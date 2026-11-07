# Green Circle products rollout

Both offers default to checkout off. The product panels live on /links. With the frontend switches off, their checkout buttons are unavailable and the standalone product routes are excluded from the sitemap and marked noindex. The server switches separately control whether the APIs accept orders.

1. Apply the product migrations to a test Supabase project. Create an approved test Green Circle member.
2. Set Flutterwave test credentials and SITE_URL for the HTTPS preview. Confirm the hosted checkout domain and the configured webhook secret format. Inner Circle uses the site's existing v3 webhook.
3. Create a NGN 50,000 monthly payment plan in Flutterwave test mode and keep customer cancellation links enabled. Set FLUTTERWAVE_INNER_CIRCLE_PLAN_ID to its numeric ID. Enable the two Inner Circle flags in preview. Ensure Resend can email the configured operator address.
4. Test the first charge and verify that the operator receives a verified-payment email. Test a duplicate attempt, cancellation and failed renewal. Reconcile paid status in Flutterwave and add or remove members manually on WhatsApp. If a cancelled member returns or a hosted checkout becomes unusable, reconcile the old order and disable its link before clearing the checkout record.
5. Enable both quiz flags in preview. Test questionnaire completion before checkout, successful and pending payments, and reloading the inline report on /links. The return URL and the same browser's 30-day cookie reopen the report. The full report is also emailed through Resend after payment verification. Test delivery from the webhook with the browser closed and check that repeated notifications do not resend the report.
6. Review sample reports with Nigerian operators before opening sales. Screening rules do not model local prices, yields or returns. Confirm the refund, support and data-retention processes before using live credentials and the live plan ID.

Local checks use node --test scripts/agri-fit.test.mjs scripts/product-payments.test.mjs, the production build with both frontend flags enabled, and npm run test:seo. Simulated payment tests do not substitute for hosted test payments or renewals.
