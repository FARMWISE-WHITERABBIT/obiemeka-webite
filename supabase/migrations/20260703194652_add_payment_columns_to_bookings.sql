alter table public.bookings add column if not exists payment_status text default 'not_required' not null;
alter table public.bookings add column if not exists amount numeric;
alter table public.bookings add column if not exists currency text;
alter table public.bookings add column if not exists flw_transaction_id text;
create index if not exists bookings_email_idx on public.bookings (email);
