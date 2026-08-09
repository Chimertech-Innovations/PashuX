-- ==============================================================================
-- Chimertech PashuX AI — Remove All Admin Schema SQL Script
-- Run this in your Supabase SQL Editor to delete all admin views, policies & triggers
-- ==============================================================================

-- 1. Drop Admin Views
drop view if exists public.admin_user_summary cascade;
drop view if exists public.admin_report_details cascade;

-- 2. Drop Admin RLS Policies
drop policy if exists "Admins can view all users" on public.users;
drop policy if exists "Admins can view all requests" on public.analysis_requests;
drop policy if exists "Admins can view all results" on public.analysis_results;

-- 3. Drop Admin Triggers & Functions
drop trigger if exists set_role_on_user_created on auth.users;
drop function if exists public.handle_new_user_role() cascade;

-- 4. Remove Admin Role Column from Users Table
alter table public.users drop column if exists role;

-- 5. Safe User Creation Trigger (prevents 500/422 errors on signup)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  on conflict (id) do update set
    full_name = coalesce(excluded.full_name, public.users.full_name),
    email = excluded.email;
  return new;
exception when others then
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
