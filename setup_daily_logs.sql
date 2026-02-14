-- Run this query in your Supabase SQL Editor to enable Daily Logs

create table if not exists daily_logs (
  id uuid default uuid_generate_v4() primary key,
  user_id uuid references auth.users not null,
  date date not null,
  blocks jsonb default '[]'::jsonb, -- Array of { id, start (minutes from midnight), duration (minutes), projectId, note }
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_id, date)
);

-- RLS Policies (Optional but recommended if RLS is enabled)
alter table daily_logs enable row level security;

create policy "Users can view their own logs"
on daily_logs for select
using (auth.uid() = user_id);

create policy "Users can insert their own logs"
on daily_logs for insert
with check (auth.uid() = user_id);

create policy "Users can update their own logs"
on daily_logs for update
using (auth.uid() = user_id);
