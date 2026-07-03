create table if not exists public.bookings (
  id          uuid        default gen_random_uuid() primary key,
  created_at  timestamptz default now()             not null,
  ref_num     text        not null unique,
  name        text        not null,
  email       text        not null,
  org         text,
  role        text,
  session     text        not null,
  topic       text        not null,
  challenge   text        not null,
  timing      text,
  status      text        default 'pending' not null
);

alter table public.bookings enable row level security;

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
