-- Notifications system tables for web + Android/iOS push
-- Run in Supabase SQL Editor

create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  priority smallint not null default 5,
  title text not null,
  message text not null,
  deep_link text null,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.user_notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  notification_id uuid not null references public.notifications(id) on delete cascade,
  is_read boolean not null default false,
  read_at timestamptz null,
  created_at timestamptz not null default now()
);

create unique index if not exists user_notifications_user_notification_unique
  on public.user_notifications(user_id, notification_id);
create index if not exists user_notifications_user_created_idx
  on public.user_notifications(user_id, created_at desc);
create index if not exists user_notifications_user_read_idx
  on public.user_notifications(user_id, is_read);

create table if not exists public.device_tokens (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  token text not null unique,
  platform text not null check (platform in ('android', 'ios', 'web')),
  is_active boolean not null default true,
  last_seen_at timestamptz not null default now(),
  created_at timestamptz not null default now()
);

create index if not exists device_tokens_user_idx on public.device_tokens(user_id);
create index if not exists device_tokens_active_idx on public.device_tokens(is_active);

alter table public.notifications enable row level security;
alter table public.user_notifications enable row level security;
alter table public.device_tokens enable row level security;

-- notifications rows are viewed through user_notifications joins.
create policy "Deny direct reads to notifications for anon/auth users"
  on public.notifications
  for select
  using (false);

create policy "Users can view own user_notifications"
  on public.user_notifications
  for select
  using (auth.uid() = user_id);

create policy "Users can update own user_notifications"
  on public.user_notifications
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users can view own device tokens"
  on public.device_tokens
  for select
  using (auth.uid() = user_id);

create policy "Users can manage own device tokens"
  on public.device_tokens
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

