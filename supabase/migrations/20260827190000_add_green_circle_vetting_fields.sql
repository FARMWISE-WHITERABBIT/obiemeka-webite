-- Vetting needs more than a name and email to actually review against —
-- member_type and goal give Obi something to approve or decline on. NOT
-- NULL from the start: the table has no rows yet (this ships before the
-- signup flow has taken a real submission), and the app always requires
-- both fields, so there's nothing to backfill.
alter table public.green_circle_signups
  add column if not exists member_type text,
  add column if not exists goal text;

alter table public.green_circle_signups
  alter column member_type set not null,
  alter column goal set not null;
