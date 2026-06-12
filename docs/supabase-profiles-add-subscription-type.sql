-- Add subscription_type to existing public.profiles (for downloaded_songs and other paid features)
-- Run this in Supabase Dashboard → SQL Editor

alter table public.profiles
  add column if not exists subscription_type text not null default 'free';

comment on column public.profiles.subscription_type is 'User subscription: free | paid. Used e.g. by downloaded_songs RLS.';
