create table public.inner_circle_checkouts (
  email text primary key,
  reference uuid unique not null,
  created_at timestamptz not null default now(),
  checkout_url text,
  transaction_id text unique
);

alter table public.inner_circle_checkouts enable row level security;
revoke all on public.inner_circle_checkouts from anon, authenticated;
