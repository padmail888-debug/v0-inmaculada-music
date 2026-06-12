-- Subscriptions table: payment/subscription state separate from profiles
-- Run in Supabase SQL Editor

create table if not exists public.subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  plan text not null default 'free',
  status text not null default 'active',
  current_period_start timestamptz,
  current_period_end timestamptz,
  cancel_at_period_end boolean not null default false,
  stripe_customer_id text,
  stripe_subscription_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint subscriptions_user_id_key unique (user_id)
);

create index if not exists subscriptions_user_id_idx on public.subscriptions(user_id);
create index if not exists subscriptions_status_idx on public.subscriptions(status);

alter table public.subscriptions enable row level security;

-- Users can read their own subscription
create policy "Users can view own subscription"
  on public.subscriptions for select
  using (auth.uid() = user_id);

-- Insert/update/delete typically done by backend (Stripe webhook) with service role.
-- Optionally allow user to read only; write via API or service role.
-- Uncomment if you want users to trigger cancel (e.g. set cancel_at_period_end):
-- create policy "Users can update own subscription for cancel_at_period_end"
--   on public.subscriptions for update
--   using (auth.uid() = user_id)
--   with check (auth.uid() = user_id);

comment on table public.subscriptions is 'Payment/subscription state. Writes usually from Stripe webhook (service role).';
