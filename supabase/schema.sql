-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.bookings (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now()             not null,
  ref_num     text        not null unique,
  name        text        not null,
  email       text        not null,
  org         text,
  role        text,
  session     text        not null,  -- discovery | strategy | retainer | speaking
  topic       text        not null,
  challenge   text        not null,
  timing      text,
  status      text        default 'pending' not null  -- pending | reviewed | booked | declined
);

-- Row-level security: only the service-role key (used by your API) can read/write.
-- No public access. The Supabase dashboard always bypasses RLS.
alter table public.bookings enable row level security;

-- Optional: view new submissions sorted by date in the Supabase table editor
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
