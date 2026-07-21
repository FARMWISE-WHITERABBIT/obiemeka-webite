// Google Calendar appointment-schedule booking pages, one per paid session
// type. Create each schedule in Google Calendar (calendar.google.com →
// Create → Appointment schedule), then paste its "Open booking page" share
// link here. An empty string hides the scheduling step for that session.
//
// This file is imported by both the frontend (payment success screen) and
// the API (confirmation email) — it must stay a plain module with no deps.
export const SCHEDULING_URLS = {
  discovery:  '', // 45 min
  compliance: '', // 2 hrs
  strategy:   '', // first sitting of 5 cumulative hrs
  investment: '', // 3 hrs
}
