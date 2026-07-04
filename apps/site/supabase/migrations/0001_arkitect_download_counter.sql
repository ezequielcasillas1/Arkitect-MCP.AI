-- Arkitect marketing site — "download-counter" vertical slice.
-- Capped, dedup-safe "free spots claimed" counter.
--
-- Pattern alignment (via Arkitect's own design-pattern catalog):
--   - Repository/Adapter: this schema is only ever reached through the app's
--     data-access.ts gateway, never raw table calls from the client.
--   - Decorator (rate-limit / abuse-prevention): arkitect_claim_download_slot
--     wraps the raw counter mutation with dedup + capacity checks before it
--     is allowed through.
--
-- Apply this against the DEDICATED Arkitect Supabase project only.

create extension if not exists pgcrypto;

create table if not exists public.arkitect_download_counter (
  id smallint primary key default 1,
  claimed_count integer not null default 0 check (claimed_count >= 0),
  spot_limit integer not null default 1000 check (spot_limit > 0),
  updated_at timestamptz not null default now(),
  constraint arkitect_download_counter_singleton check (id = 1)
);

insert into public.arkitect_download_counter (id, claimed_count, spot_limit)
values (1, 0, 1000)
on conflict (id) do nothing;

create table if not exists public.arkitect_download_claims (
  id uuid primary key default gen_random_uuid(),
  visitor_id text not null unique check (char_length(visitor_id) between 8 and 128),
  claimed_at timestamptz not null default now(),
  user_agent text check (user_agent is null or char_length(user_agent) <= 300)
);

create index if not exists arkitect_download_claims_claimed_at_idx
  on public.arkitect_download_claims (claimed_at desc);

alter table public.arkitect_download_counter enable row level security;
alter table public.arkitect_download_claims enable row level security;

-- No RLS policies are created for these two tables: anon/authenticated get
-- zero direct table access. All reads/writes happen only through the
-- SECURITY DEFINER functions below (defense in depth on top of the REVOKEs).
revoke all on public.arkitect_download_counter from anon, authenticated;
revoke all on public.arkitect_download_claims from anon, authenticated;

create or replace function public.arkitect_get_download_stats()
returns table (claimed_count integer, spot_limit integer)
language sql
stable
security definer
set search_path = public
as $$
  select claimed_count, spot_limit from public.arkitect_download_counter where id = 1;
$$;

create or replace function public.arkitect_claim_download_slot(p_visitor_id text)
returns table (claimed_count integer, spot_limit integer, already_claimed boolean)
language plpgsql
security definer
set search_path = public
as $$
declare
  v_count integer;
  v_limit integer;
  v_inserted boolean;
begin
  if p_visitor_id is null or char_length(p_visitor_id) < 8 or char_length(p_visitor_id) > 128 then
    raise exception 'invalid_visitor_id' using errcode = '22023';
  end if;

  insert into public.arkitect_download_claims (visitor_id)
  values (p_visitor_id)
  on conflict (visitor_id) do nothing;
  v_inserted := found;

  if not v_inserted then
    select c.claimed_count, c.spot_limit into v_count, v_limit
    from public.arkitect_download_counter c where c.id = 1;
    return query select v_count, v_limit, true;
    return;
  end if;

  -- Atomic capped increment: the WHERE clause + RETURNING makes this safe
  -- under concurrent claims (row lock on the single counter row serializes
  -- the check-and-increment). The table alias is required here: RETURNS
  -- TABLE(claimed_count, spot_limit, ...) creates same-named OUT
  -- parameters that would otherwise make bare column references in this
  -- statement ambiguous.
  update public.arkitect_download_counter as c
    set claimed_count = c.claimed_count + 1, updated_at = now()
    where c.id = 1 and c.claimed_count < c.spot_limit
    returning c.claimed_count, c.spot_limit into v_count, v_limit;

  if not found then
    -- Limit was already reached; undo the dedup claim so this visitor
    -- is not permanently marked as "claimed" with no spot granted.
    delete from public.arkitect_download_claims where visitor_id = p_visitor_id;
    select c.claimed_count, c.spot_limit into v_count, v_limit
    from public.arkitect_download_counter c where c.id = 1;
    return query select v_count, v_limit, false;
    return;
  end if;

  return query select v_count, v_limit, true;
end;
$$;

grant execute on function public.arkitect_get_download_stats() to anon, authenticated;
grant execute on function public.arkitect_claim_download_slot(text) to anon, authenticated;
