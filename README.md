# OCULOOM — Business Growth Ecosystem website

A responsive, one-page static website built with HTML, CSS and vanilla JavaScript. No framework or build step is required.

## Files
- `index.html` — page structure and copy
- `styles.css` — design system, responsive layouts, animation and component styles
- `script.js` — mobile navigation, scroll reveals, interactive calendar and email-draft forms
- `assets/` — place official brand assets here

## Run locally
1. Download and extract the ZIP.
2. Open `index.html` in a modern browser. For a more realistic local server, run `python -m http.server 8000` from this folder and open `http://localhost:8000`.

## Before launch — important edits
1. **Official logo:** the header/footer currently use a CSS-drawn interlocking-circle wordmark and the hero uses an inline SVG infinity placeholder. Replace those with the approved OCULOOM logo asset when available. Do not distort the source logo. If your official logo is supplied as SVG, place it in `assets/` and use an `<img src="assets/oculoom-logo.svg" alt="OCULOOM">` in the wordmark and hero where appropriate.
2. **Contact email:** `oculoomhq@gmail.com` is used by the contact form and meeting request mailto. Search and replace it if the official inbox changes.
3. **Instagram / LinkedIn / X:** check the social URLs in the footer. Replace any profile placeholder with the official profile. Instagram is set to `https://www.instagram.com/oculoomhq/`; LinkedIn is set to `https://www.linkedin.com/company/oculoom/`; X currently links to the X homepage and should be replaced with the official account or removed.
4. **Book a Meeting:** the calendar is a client-side request helper, not a live booking system. It offers sample time slots and opens an email draft; it does not check a calendar or confirm a reservation. Connect Calendly, Google Calendar appointment scheduling, or a booking backend if you want confirmed availability.
5. **Contact form:** this opens the visitor's default email app with a prefilled draft. It does not store or submit form data to a server. Connect Formspree, Basin, your CRM, or a custom backend before launch if you need server-side submissions.
6. **Case studies and metrics:** the project cards are illustrative concept examples, not actual OCULOOM client case studies or verified outcomes. Replace them with approved client stories and substantiated metrics before publishing. The dashboard numbers are also explicitly illustrative.
7. **Technology partner marks:** the partner strip uses styled text/typographic marks rather than official logo artwork. Use approved brand assets and follow each provider's logo guidelines if exact logos are required.
8. **Photos:** the decorative photos are loaded from Unsplash URLs and require an internet connection. Download appropriately licensed photos into `assets/` and update the CSS URLs if you want locally hosted imagery.
9. **Privacy and legal:** add your privacy policy, terms and any required cookie/analytics disclosures before enabling analytics or collecting visitor information.

## Deploy to Vercel and connect oculoom.in
1. Create a GitHub repository and upload the contents of this folder (the files should be at the repository root, not buried in another folder).
2. In Vercel, choose **Add New → Project**, import the GitHub repository, and keep the framework preset as **Other**. No build command is required; leave the output directory at the project root unless Vercel asks otherwise.
3. Deploy the project and preview the generated Vercel URL on desktop and mobile.
4. In Vercel project **Settings → Domains**, add `oculoom.in` and optionally `www.oculoom.in`.
5. In GoDaddy DNS, enter the exact records Vercel displays for your project. DNS values can differ by setup; do not copy records from an unrelated tutorial. Remove conflicting records only after checking what currently uses them.
6. Wait for Vercel to verify the domain and issue HTTPS. Test the root domain, `www` if configured, every navigation link, the email draft, the calendar, keyboard focus, and a mobile viewport.

## Accessibility and performance notes
- Responsive layouts and keyboard-visible focus states are included.
- Scroll reveals respect `prefers-reduced-motion`.
- Decorative dashboard visuals are marked illustrative; the calendar buttons have accessible labels.
- Google Fonts and Unsplash photos are external requests. Self-host them if you need tighter privacy/performance control.
