-- Arkitect marketing site — "download-tracking" vertical slice.
-- Counts actual file download clicks (separate from free-spot claims).

create table if not exists public.arkitect_file_download_totals (
  file_key text primary key check (file_key in ('arkitect-setup', 'user-guide')),
  total_count integer not null default 0 check (total_count >= 0),
  unique_count integer not null default 0 check (unique_count >= 0),
  updated_at timestamptz not null default now()
);

insert into public.arkitect_file_download_totals (file_key, total_count, unique_count)
values
  ('arkitect-setup', 0, 0),
  ('user-guide', 0, 0)
on conflict (file_key) do nothing;

create table if not exists public.arkitect_file_download_visitors (
  file_key text not null references public.arkitect_file_download_totals (file_key) on delete cascade,
  visitor_id text not null check (char_length(visitor_id) between 8 and 128),
  first_downloaded_at timestamptz not null default now(),
  primary key (file_key, visitor_id)
);

create index if not exists arkitect_file_download_visitors_first_at_idx
  on public.arkitect_file_download_visitors (first_downloaded_at desc);

alter table public.arkitect_file_download_totals enable row level security;
alter table public.arkitect_file_download_visitors enable row level security;

revoke all on public.arkitect_file_download_totals from anon, authenticated;
revoke all on public.arkitect_file_download_visitors from anon, authenticated;

create or replace function public.arkitect_record_file_download(
  p_file_key text,
  p_visitor_id text
)
returns table (file_key text, total_count integer, unique_count integer)
language plpgsql
security definer
set search_path = public
as $$
#variable_conflict use_column
declare
  v_inserted boolean;
  v_file_key text;
  v_total_count integer;
  v_unique_count integer;
begin
  if p_file_key not in ('arkitect-setup', 'user-guide') then
    raise exception 'invalid_file_key' using errcode = '22023';
  end if;

  if p_visitor_id is null or char_length(p_visitor_id) < 8 or char_length(p_visitor_id) > 128 then
    raise exception 'invalid_visitor_id' using errcode = '22023';
  end if;

  insert into public.arkitect_file_download_visitors (file_key, visitor_id)
  values (p_file_key, p_visitor_id)
  on conflict (file_key, visitor_id) do nothing;
  v_inserted := found;

  update public.arkitect_file_download_totals as t
    set
      total_count = t.total_count + 1,
      unique_count = t.unique_count + case when v_inserted then 1 else 0 end,
      updated_at = now()
    where t.file_key = p_file_key
    returning t.file_key, t.total_count, t.unique_count
    into v_file_key, v_total_count, v_unique_count;

  return query select v_file_key, v_total_count, v_unique_count;
end;
$$;

create or replace function public.arkitect_get_file_download_stats()
returns table (file_key text, total_count integer, unique_count integer)
language sql
stable
security definer
set search_path = public
as $$
  select file_key, total_count, unique_count
  from public.arkitect_file_download_totals
  order by file_key;
$$;

grant execute on function public.arkitect_record_file_download(text, text) to anon, authenticated;
grant execute on function public.arkitect_get_file_download_stats() to anon, authenticated;
