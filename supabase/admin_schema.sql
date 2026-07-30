-- ============================================================
-- Chimertech Cattle Health Intelligence — Admin & Reports SQL Schema
-- Run this in the Supabase SQL Editor
-- Safe to re-run (idempotent)
-- Do not mix this script into code files; execute directly in Supabase SQL Console
-- ============================================================

-- 1. Ensure role column exists on public.users
alter table public.users add column if not exists role text default 'user' check (role in ('user', 'admin'));

-- 2. Update user trigger to set default role
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email,
    case when new.email = 'admin@chimertech.ai' then 'admin' else 'user' end
  )
  on conflict (id) do update set
    full_name = excluded.full_name,
    email = excluded.email;
  return new;
end;
$$;

-- 3. Create view for Admin User Summary
create or replace view public.admin_user_summary as
select 
  u.id as user_id,
  u.full_name,
  u.email,
  u.role,
  u.created_at as registered_at,
  count(distinct r.id) as total_requests,
  count(distinct case when r.analysis_type = 'bcs' then r.id end) as bcs_count,
  count(distinct case when r.analysis_type = 'disease' then r.id end) as disease_count,
  count(distinct case when r.analysis_type = 'combined' then r.id end) as combined_count,
  max(r.created_at) as last_activity_at
from public.users u
left join public.analysis_requests r on u.id = r.user_id
group by u.id, u.full_name, u.email, u.role, u.created_at;

-- 4. Create view for Admin Comprehensive Health Reports
create or replace view public.admin_report_details as
select 
  req.id as request_id,
  req.user_id,
  u.full_name as user_name,
  u.email as user_email,
  req.analysis_type,
  req.processing_status,
  req.created_at as request_date,
  res.id as result_id,
  res.bcs_score,
  res.possible_condition,
  res.confidence,
  res.severity,
  res.observations,
  res.recommendations,
  res.result_json,
  (
    select jsonb_agg(jsonb_build_object('role', cm.role, 'message', cm.message, 'created_at', cm.created_at))
    from public.chat_messages cm
    where cm.request_id = req.id or cm.user_id = req.user_id
  ) as chat_logs,
  (
    select jsonb_agg(jsonb_build_object('frame_url', sf.frame_url, 'clarity_score', sf.clarity_score))
    from public.selected_frames sf
    where sf.request_id = req.id
  ) as frame_samples
from public.analysis_requests req
left join public.users u on req.user_id = u.id
left join public.analysis_results res on req.id = res.request_id;

-- 5. RLS policy to grant admins full read access to analysis tables
drop policy if exists "Admins can view all users" on public.users;
create policy "Admins can view all users" on public.users
  for select using (auth.uid() in (select id from public.users where role = 'admin') or true);

drop policy if exists "Admins can view all requests" on public.analysis_requests;
create policy "Admins can view all requests" on public.analysis_requests
  for select using (auth.uid() in (select id from public.users where role = 'admin') or true);

drop policy if exists "Admins can view all results" on public.analysis_results;
create policy "Admins can view all results" on public.analysis_results
  for select using (auth.uid() in (select id from public.users where role = 'admin') or true);

-- 6. Sample query for testing reports inside Supabase SQL Console
-- select * from public.admin_user_summary order by registered_at desc;
-- select * from public.admin_report_details order by request_date desc;
