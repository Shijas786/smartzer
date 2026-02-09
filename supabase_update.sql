-- Add missing columns to anonymous_super_traders
alter table public.anonymous_super_traders 
add column if not exists last_seen_tx text,
add column if not exists last_seen_timestamp bigint;

-- Ensure RLS is updated
alter table public.anonymous_super_traders enable row level security;
