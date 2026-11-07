alter table public.bookings
  add column quiz_order_reference uuid references public.agri_quiz_orders(reference),
  add column quiz_checkout_url text;

create unique index bookings_one_discovery_credit_per_quiz
  on public.bookings (quiz_order_reference)
  where quiz_order_reference is not null;
