-- Approval/vetting step before the WhatsApp invite link is sent (Component 3
-- follow-up). Signups land as 'pending'; Obi approves or declines via a
-- one-click magic link in the signup-notification email, which uses
-- approval_token so the link can't be guessed or replayed by anyone else.

alter table public.green_circle_signups
  add column if not exists status text not null default 'pending',
  add column if not exists approval_token text,
  add column if not exists approved_at timestamptz;

-- Backfill a token for any pre-existing rows so the approve link works uniformly.
update public.green_circle_signups
set approval_token = encode(gen_random_bytes(24), 'hex')
where approval_token is null;

alter table public.green_circle_signups
  alter column approval_token set not null;

create unique index if not exists green_circle_signups_approval_token_idx
  on public.green_circle_signups (approval_token);

create index if not exists green_circle_signups_status_idx
  on public.green_circle_signups (status);

alter table public.green_circle_signups
  add constraint green_circle_signups_status_check
  check (status in ('pending', 'approved', 'declined'));
