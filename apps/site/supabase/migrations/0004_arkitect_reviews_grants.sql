-- Fix: arkitect_reviews had RLS policies but anon/authenticated lacked table
-- privileges, causing PostgREST 401 on list/insert from the marketing site.

grant select on public.arkitect_reviews to anon, authenticated;
grant insert on public.arkitect_reviews to anon, authenticated;
