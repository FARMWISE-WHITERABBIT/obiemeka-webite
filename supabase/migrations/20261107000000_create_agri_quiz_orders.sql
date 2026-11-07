create table public.agri_quiz_orders (
  reference uuid primary key,
  created_at timestamptz not null default now(),
  email text not null,
  access_hash text not null,
  transaction_id text unique,
  report jsonb
);

alter table public.agri_quiz_orders enable row level security;
revoke all on public.agri_quiz_orders from anon, authenticated;
