-- Green Circle funnel (Component 3/5) — owned record of every WhatsApp
-- Community signup, independent of whether the person goes on to actually
-- join the WhatsApp group. UTM columns let entry points (exit popup, each
-- blog post's CTA, each YouTube link) be compared against each other.

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
  referrer       text
);

-- Row-level security: only the service-role key (used by your API) can read/write.
-- No public access. The Supabase dashboard always bypasses RLS.
alter table public.green_circle_signups enable row level security;

create index if not exists green_circle_signups_created_at_idx on public.green_circle_signups (created_at desc);
create index if not exists green_circle_signups_utm_source_idx on public.green_circle_signups (utm_source);
