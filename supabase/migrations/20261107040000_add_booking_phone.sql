-- Keep historical bookings readable. The booking API requires a number for new submissions.
alter table public.bookings add column if not exists phone text;
