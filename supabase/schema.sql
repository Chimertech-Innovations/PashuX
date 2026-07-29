-- ============================================================
-- Chimertech Cattle Health Intelligence — Supabase Schema
-- Run this in the Supabase SQL Editor
-- Safe to re-run (idempotent)
-- ============================================================

-- Enable UUID extension
create extension if not exists "pgcrypto";

-- ── users ─────────────────────────────────────────────────────────────────────
create table if not exists public.users (
  id          uuid primary key references auth.users(id) on delete cascade,
  full_name   text,
  email       text not null,
  created_at  timestamptz default now() not null
);

alter table public.users enable row level security;
drop policy if exists "Users can view own profile"   on public.users;
drop policy if exists "Users can update own profile" on public.users;
create policy "Users can view own profile"   on public.users for select using (auth.uid() = id);
create policy "Users can update own profile" on public.users for update using (auth.uid() = id);

-- Auto-create profile on sign up
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.users (id, full_name, email)
  values (
    new.id,
    new.raw_user_meta_data->>'full_name',
    new.email
  )
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();


-- ── analysis_requests ─────────────────────────────────────────────────────────
create table if not exists public.analysis_requests (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid references auth.users(id) on delete set null,
  analysis_type       text not null check (analysis_type in ('bcs', 'disease')),
  original_video_url  text,
  processing_status   text not null default 'pending'
                       check (processing_status in ('pending','processing','completed','failed')),
  created_at          timestamptz default now() not null
);

alter table public.analysis_requests enable row level security;
drop policy if exists "Users see own requests"    on public.analysis_requests;
drop policy if exists "Users insert own requests" on public.analysis_requests;
drop policy if exists "Users update own requests" on public.analysis_requests;
create policy "Users see own requests"    on public.analysis_requests for select using (auth.uid() = user_id);
create policy "Users insert own requests" on public.analysis_requests for insert with check (auth.uid() = user_id or user_id is null);
create policy "Users update own requests" on public.analysis_requests for update using (auth.uid() = user_id);


-- ── analysis_results ──────────────────────────────────────────────────────────
create table if not exists public.analysis_results (
  id                  uuid primary key default gen_random_uuid(),
  request_id          uuid not null references public.analysis_requests(id) on delete cascade,
  bcs_score           numeric(3,1),
  possible_condition  text,
  confidence          numeric(4,3),
  severity            text,
  observations        jsonb,
  recommendations     jsonb,
  result_json         jsonb,
  created_at          timestamptz default now() not null
);

alter table public.analysis_results enable row level security;
drop policy if exists "Users see own results" on public.analysis_results;
drop policy if exists "Service can insert results" on public.analysis_results;
create policy "Users see own results" on public.analysis_results
  for select using (
    exists (
      select 1 from public.analysis_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );
create policy "Service can insert results" on public.analysis_results
  for insert with check (true);


-- ── selected_frames ───────────────────────────────────────────────────────────
create table if not exists public.selected_frames (
  id              uuid primary key default gen_random_uuid(),
  request_id      uuid not null references public.analysis_requests(id) on delete cascade,
  frame_url       text not null,
  frame_number    integer not null,
  clarity_score   numeric(10,2),
  created_at      timestamptz default now() not null
);

alter table public.selected_frames enable row level security;
drop policy if exists "Users see own frames" on public.selected_frames;
drop policy if exists "Service can insert frames" on public.selected_frames;
create policy "Users see own frames" on public.selected_frames
  for select using (
    exists (
      select 1 from public.analysis_requests r
      where r.id = request_id and r.user_id = auth.uid()
    )
  );
create policy "Service can insert frames" on public.selected_frames
  for insert with check (true);


-- ── chat_messages ─────────────────────────────────────────────────────────────
create table if not exists public.chat_messages (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid references auth.users(id) on delete set null,
  request_id  uuid references public.analysis_requests(id) on delete set null,
  role        text not null check (role in ('user', 'assistant', 'system')),
  message     text not null,
  created_at  timestamptz default now() not null
);

alter table public.chat_messages enable row level security;
drop policy if exists "Users see own chat"    on public.chat_messages;
drop policy if exists "Users insert own chat" on public.chat_messages;
create policy "Users see own chat"    on public.chat_messages for select using (auth.uid() = user_id);
create policy "Users insert own chat" on public.chat_messages for insert with check (auth.uid() = user_id or user_id is null);


-- ── products ──────────────────────────────────────────────────────────────────
create table if not exists public.products (
  id                  text primary key,
  name                text not null,
  category            text not null,
  description         text,
  image_url           text,
  price               numeric(10,2) not null,
  product_page_url    text,
  recommended_for     jsonb default '[]',
  created_at          timestamptz default now() not null
);

alter table public.products enable row level security;
drop policy if exists "Anyone can read products" on public.products;
create policy "Anyone can read products" on public.products for select using (true);


-- ── Storage buckets ───────────────────────────────────────────────────────────
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('frames', 'frames', true,  10485760, array['image/jpeg','image/png','image/webp']),
  ('videos', 'videos', false, 52428800, array['video/mp4','video/quicktime','video/x-msvideo','video/avi'])
on conflict (id) do nothing;

drop policy if exists "Service role can upload frames" on storage.objects;
drop policy if exists "Public read frames"             on storage.objects;
drop policy if exists "Service role can upload videos" on storage.objects;

create policy "Service role can upload frames"
  on storage.objects for insert
  with check (bucket_id = 'frames');

create policy "Public read frames"
  on storage.objects for select
  using (bucket_id = 'frames');

create policy "Service role can upload videos"
  on storage.objects for insert
  with check (bucket_id = 'videos');


-- ── Indexes ───────────────────────────────────────────────────────────────────
create index if not exists idx_analysis_requests_user_id  on public.analysis_requests(user_id);
create index if not exists idx_analysis_results_request_id on public.analysis_results(request_id);
create index if not exists idx_selected_frames_request_id  on public.selected_frames(request_id);
create index if not exists idx_chat_messages_request_id    on public.chat_messages(request_id);
create index if not exists idx_chat_messages_user_id       on public.chat_messages(user_id);
