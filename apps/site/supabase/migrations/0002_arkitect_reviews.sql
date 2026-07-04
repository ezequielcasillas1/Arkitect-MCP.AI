-- Arkitect marketing site — "reviews" vertical slice.
-- Visitor reviews/feedback: public insert, moderation-friendly visibility.
--
-- Pattern alignment: public SELECT/INSERT stay behind RLS `with check`
-- constraints (mirrors the existing `page_views` precedent style in the
-- adjacent PasteCraft project, read during investigation only — no schema
-- or data from that project is reused or referenced here). Moderation
-- (hiding a review) is a service-role-only action, never exposed to anon.
--
-- Apply this against the DEDICATED Arkitect Supabase project only.

create table if not exists public.arkitect_reviews (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null check (char_length(visitor_id) between 8 and 128),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  rating smallint not null check (rating between 1 and 5),
  message text not null check (char_length(btrim(message)) between 1 and 1000),
  is_visible boolean not null default true,
  created_at timestamptz not null default now()
);

create index if not exists arkitect_reviews_created_at_idx
  on public.arkitect_reviews (created_at desc);

alter table public.arkitect_reviews enable row level security;

create policy "arkitect_reviews_public_read"
  on public.arkitect_reviews
  for select
  to anon, authenticated
  using (is_visible = true);

create policy "arkitect_reviews_public_insert"
  on public.arkitect_reviews
  for insert
  to anon, authenticated
  with check (
    char_length(btrim(name)) between 1 and 80
    and rating between 1 and 5
    and char_length(btrim(message)) between 1 and 1000
    and char_length(visitor_id) between 8 and 128
  );

-- Intentionally no UPDATE/DELETE policy: anon/authenticated can never edit
-- or remove a review once posted. Moderation happens from the Supabase
-- dashboard (service role), which bypasses RLS by default.

create or replace function public.arkitect_enforce_review_rate_limit()
returns trigger
language plpgsql
as $$
declare
  v_recent_count integer;
begin
  select count(*) into v_recent_count
  from public.arkitect_reviews
  where visitor_id = new.visitor_id
    and created_at > now() - interval '1 hour';

  if v_recent_count >= 3 then
    raise exception 'review_rate_limited' using errcode = '22023';
  end if;

  return new;
end;
$$;

drop trigger if exists arkitect_reviews_rate_limit on public.arkitect_reviews;
create trigger arkitect_reviews_rate_limit
  before insert on public.arkitect_reviews
  for each row execute function public.arkitect_enforce_review_rate_limit();
