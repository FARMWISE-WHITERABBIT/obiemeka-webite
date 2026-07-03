-- Run this in your Supabase SQL editor (Dashboard → SQL Editor → New query)

create table if not exists public.bookings (
  id                 uuid        default gen_random_uuid() primary key,
  created_at         timestamptz default now()             not null,
  ref_num            text        not null unique,
  name               text        not null,
  email              text        not null,
  org                text,
  role               text,
  session            text        not null,  -- discovery | compliance | strategy | investment | retainer | speaking
  topic              text        not null,
  challenge          text        not null,
  timing             text,
  status             text        default 'pending' not null,       -- pending | reviewed | booked | declined
  payment_status     text        default 'not_required' not null,  -- not_required | pending | paid | failed
  amount             numeric,                                       -- NGN, null when payment isn't required
  currency           text,
  flw_transaction_id text
);

-- Row-level security: only the service-role key (used by your API) can read/write.
-- No public access. The Supabase dashboard always bypasses RLS.
alter table public.bookings enable row level security;

-- Optional: view new submissions sorted by date in the Supabase table editor
create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_email_idx on public.bookings (email);

-- ── Migration for an existing table (skip if creating fresh) ─────────────────
-- alter table public.bookings add column if not exists payment_status text default 'not_required' not null;
-- alter table public.bookings add column if not exists amount numeric;
-- alter table public.bookings add column if not exists currency text;
-- alter table public.bookings add column if not exists flw_transaction_id text;
-- create index if not exists bookings_email_idx on public.bookings (email);
