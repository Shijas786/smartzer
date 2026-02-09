-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. Followed Traders
create table public.followed_traders (
    id uuid primary key default uuid_generate_v4(),
    username text not null,
    address text not null unique,
    pnl numeric default 0
);

-- 2. Anonymous Super Traders
create table public.anonymous_super_traders (
    id uuid primary key default uuid_generate_v4(),
    label text not null,
    address text not null unique,
    pnl numeric default 0
);

-- 3. Replicated Trades
create table public.replicated_trades (
    id uuid primary key default uuid_generate_v4(),
    trader text not null,
    token text not null,
    side text not null, -- 'BUY' or 'SELL'
    tx_hash text,
    timestamp bigint not null,
    chain text default 'Base'
);

-- 4. Processed Notifications (To avoid duplicate replies)
create table public.processed_notifications (
    notification_id text primary key,
    processed_at timestamp with time zone default now()
);

-- 5. Logs (The "Brain" view)
create table public.logs (
    id bigint primary key, -- Using timestamp as ID from agent
    text text not null,
    created_at timestamp with time zone default now()
);

-- 6. Agent Metrics (Singleton state)
create table public.agent_metrics (
    key text primary key, 
    value_numeric numeric,
    value_timestamp bigint
);

-- Initialize Metrics
insert into public.agent_metrics (key, value_numeric, value_timestamp) values 
('agent_pnl', 420.69, null),
('last_check', null, 0),
('last_status_post', null, 0);

-- Enable RLS (Security) - Allow public access for this hackathon demo
alter table public.followed_traders enable row level security;
create policy "Public Access" on public.followed_traders for all using (true) with check (true);

alter table public.anonymous_super_traders enable row level security;
create policy "Public Access" on public.anonymous_super_traders for all using (true) with check (true);

alter table public.replicated_trades enable row level security;
create policy "Public Access" on public.replicated_trades for all using (true) with check (true);

alter table public.processed_notifications enable row level security;
create policy "Public Access" on public.processed_notifications for all using (true) with check (true);

alter table public.logs enable row level security;
create policy "Public Access" on public.logs for all using (true) with check (true);

alter table public.agent_metrics enable row level security;
create policy "Public Access" on public.agent_metrics for all using (true) with check (true);

-- Functions to mimic the JSON structure behavior if needed, but direct query is better.
