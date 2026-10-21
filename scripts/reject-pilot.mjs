// Set OCULOOM_SITE_URL and PILOT_ADMIN_SECRET in the terminal environment; never put secrets in arguments.
const id = process.argv[2], action = process.argv[3] || 'reject';
if (!id || !['reject','cancel'].includes(action) || !process.env.PILOT_ADMIN_SECRET || !process.env.OCULOOM_SITE_URL) {
  console.error('Usage: node scripts/reject-pilot.mjs SUBMISSION_ID [reject|cancel]. Requires OCULOOM_SITE_URL and PILOT_ADMIN_SECRET environment variables.'); process.exit(1);
}
const url = new URL('/.netlify/functions/pilot-rejection',process.env.OCULOOM_SITE_URL);
if (url.protocol !== 'https:') throw Error('Use the production HTTPS site');
const res = await fetch(url,{method:'POST',headers:{Authorization:`Bearer ${process.env.PILOT_ADMIN_SECRET}`,'Content-Type':'application/json'},body:JSON.stringify({submissionId:id,action})});
console.log(await res.text()); if (!res.ok) process.exitCode=1;
