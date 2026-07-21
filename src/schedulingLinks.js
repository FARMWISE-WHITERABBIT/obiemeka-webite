// Google Calendar appointment-schedule booking pages, one per paid session
// type. Create each schedule in Google Calendar (calendar.google.com →
// Create → Appointment schedule), then paste its "Open booking page" share
// link here. An empty string hides the scheduling step for that session.
//
// This file is imported by both the frontend (payment success screen) and
// the API (confirmation email) — it must stay a plain module with no deps.
// Free Google accounts allow a single appointment schedule, so all paid
// sessions share one booking page for now. The booked slot marks the session
// start; longer sessions get their full calendar hold adjusted manually.
// If the account is upgraded later, give each session its own link here.
const BOOKING_PAGE = 'https://calendar.app.google/NNAHBnfYXSpWCjfz7'

export const SCHEDULING_URLS = {
  discovery:  BOOKING_PAGE, // 45 min
  compliance: BOOKING_PAGE, // 2 hrs
  strategy:   BOOKING_PAGE, // first sitting of 5 cumulative hrs
  investment: BOOKING_PAGE, // 3 hrs
}
