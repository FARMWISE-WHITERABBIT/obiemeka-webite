-- Full current schema, for reference / fresh manual setup in the Supabase SQL
-- editor (Dashboard → SQL Editor → New query). The authoritative, applied
-- history lives in supabase/migrations/ — that's what Supabase's GitHub
-- integration replays to build preview-branch databases, so any future schema
-- change should be added there as a new migration file, not just here.

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

-- ── Green Circle funnel signups ─────────────────────────────────────────────
-- The API lowercases and trims email before every write, so a plain unique
-- constraint on the column is enough to catch repeat signups (re-submits
-- upsert onto the existing row instead of erroring).
create table if not exists public.green_circle_signups (
  id             uuid        default gen_random_uuid() primary key,
  created_at     timestamptz default now()             not null,
  name           text        not null,
  email          text        not null unique,
  phone          text,
  utm_source     text,
  utm_medium     text,
  utm_campaign   text,
  utm_content    text,
  landing_path   text,
  referrer       text,
  status         text        not null default 'pending' check (status in ('pending', 'approved', 'declined')),
  approval_token text        not null,  -- powers the one-click approve/decline link in the admin notification email
  approved_at    timestamptz
);

alter table public.green_circle_signups enable row level security;

create index if not exists green_circle_signups_created_at_idx on public.green_circle_signups (created_at desc);
create index if not exists green_circle_signups_utm_source_idx on public.green_circle_signups (utm_source);
create unique index if not exists green_circle_signups_approval_token_idx on public.green_circle_signups (approval_token);
create index if not exists green_circle_signups_status_idx on public.green_circle_signups (status);
