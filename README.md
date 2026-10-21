# OCULOOM approved website implementation

Static multipage site for the existing GitHub → Netlify deployment. Original uploaded logos are in `assets/`, unmodified. No client logos are published until approved assets are supplied.

## Build and preview

Node 22+, `npm ci`, `npm run build`, `npm test`. Netlify configuration is in `netlify.toml`: build `npm run build`, publish `dist`. No SPA catch-all: every page has its own HTML URL.

Approved pages: Home, Ecosystem, Services, Approach, About, Pilot and pilot success, Contact and contact success; Privacy now reflects the approved retention rules, plus 404. The service URL hash opens the matching service panel. Mobile/tap, keyboard tabs, escape-to-close, reduced motion and consent controls are included.

## Netlify Forms — required account setup

1. In the correct Netlify project, open Forms and enable form detection **before redeploying**.
2. Build/deploy this branch as a Deploy Preview. Check Netlify detects `contact-enquiry` and `pilot-application`.
3. Configure form notifications to `oculoomhq@gmail.com` under the project’s form notifications. This cannot be activated from static source code alone. Do not assume email delivery until tested.
4. Send disposable test enquiries and pilot applications. Verify each is saved in the dashboard, its email notification arrives, and only then confirm the success page.
5. On invalid fields the browser blocks submission; on failed network responses entered details stay in place. Double submission is disabled while pending. Local preview does not fake a successful save.
6. No automatic applicant email is currently sent. Success is shown in the browser. Native HTML fallback also posts to Netlify using each form’s action.
7. Forms use a honeypot and Netlify filtering. Consider additional provider-supported anti-spam if real traffic warrants it.

**Important:** consent acknowledges the privacy policy and operational retention must be in place before accepting real submissions. Enquiry, project, email and export copies require manual record review; the scheduler covers queued pilot form records only.

## Rejected pilot deletion — must configure and test

A protected admin endpoint queues a rejection timestamp in a private Netlify Blobs store. An hourly scheduled function deletes queued Netlify submissions once due. It starts the clock from the **rejection decision**, not the application date, and repeated reject calls do not extend that clock. The queue becomes due at 9 days 23 hours so the next hourly pass normally runs within 10 days. Monitor failures: an external outage can delay a sweep and requires manual action to meet the policy.

Required **production Functions-scoped** Netlify environment variables:
- `RETENTION_ENABLED`: set to `true` in the production Functions scope only after setup and a disposable test.
- `NETLIFY_API_TOKEN`: a Netlify credential authorised for this site’s Forms API. Never commit it or include it in client code.
- `PILOT_ADMIN_SECRET`: a randomly generated administrator-only secret of at least 32 characters. Never place it in a URL or browser script.
- `SITE_ID`: supplied by Netlify; confirm available to Functions.

The functions are deliberately disabled unless `RETENTION_ENABLED=true` and fail closed without settings. Netlify must support the Blobs/function configuration for this site. Confirm the hourly function appears in its dashboard and test against disposable data first. Review account usage/billing before enabling.

For an unsuccessful application, get its submission ID from Netlify. On an administrator’s computer set `OCULOOM_SITE_URL` to the HTTPS production domain and `PILOT_ADMIN_SECRET` in the terminal environment, then run:

```
node scripts/reject-pilot.mjs SUBMISSION_ID
```

To cancel a mistaken rejection **before deletion**, use `node scripts/reject-pilot.mjs SUBMISSION_ID cancel`. This removes the scheduled rejection, not the application. The endpoint validates the ID belongs to this site’s `pilot-application` form. It is not linked publicly.

Deletion covers the Netlify form record and the rejection queue, **not email copies, CSV exports or other systems**. Avoid notification emails containing full pilot data if possible; otherwise remove these copies manually within the same period. Do not promise universal automated deletion. General enquiries that do not become client engagements are to be deleted six months after the last conversation. This requires a last-contact record and a separate deletion workflow; the current pilot-only scheduler does not automate enquiry deletion. Accepted-client retention remains undecided. No scheduled function has run or deleted real data as part of preparing this PR.

## Analytics and privacy

GA4 `G-25L264DXWL` loads only on oculoom.in/www.oculoom.in after explicit analytics acceptance. Declining makes no Google Analytics request. Cookie settings can change the choice and remove first-party GA cookies. Google advertising/personalisation signals are disabled. Code sends no form values to Analytics; query strings and hashes are omitted from configured page URLs. Automatic enhanced-measurement form tracking and user-provided data collection should be **disabled in the GA4 property** before launch; review its settings so website restrictions are not undermined by account-level tracking. Configure retention in GA4 and finalise cookie/provider disclosures. Browser events include successful `generate_lead` and pilot interest clicks. Preview hosts do not track.

## Launch gates

- Validate preview desktop/mobile and live provider form storage/notifications.
- Configure and test rejection workflow/monitoring; manage email copies.
- Confirm legal operator details, enquiry/successful-client retention and processor locations; remove privacy draft status only after review.
- Confirm Analytics settings and consent behaviour on actual domain.
- Keep client logos hidden pending assets.
- Merge the PR only after preview review. No production merge/deployment is performed by this change alone.

## Release readiness check

The authenticated `verify` action reads the provider submission and private queue without writing or scheduling a rejection. It is allowed with `RETENTION_ENABLED=false`. After production deployment, use `node scripts/reject-pilot.mjs SUBMISSION_ID verify` with the saved admin secret and HTTPS production URL. Expect connectionVerified/submissionVerified/storageReadable true, retentionEnabled false, scheduled false for a fresh test. `reject` is blocked while the switch is false. `cancel` remains available for safety even with the switch off.

Analytics configuration is two months for user/event data, reset off (confirmed by owner). Tag cookies explicitly expire after 60 days with cookie_update false. These are distinct from provider aggregate report retention. The policy includes Netlify/Gmail/Analytics processing and the six-month enquiry / twelve-month project record rules. Manually manage mail/export/project copies; no claim that the pilot-only function deletes those automatically.
