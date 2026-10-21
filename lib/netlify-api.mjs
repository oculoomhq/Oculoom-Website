export async function api(path, options={}) {
  const token = process.env.NETLIFY_API_TOKEN;
  if (!token) throw new Error('Retention not configured');
  const res = await fetch('https://api.netlify.com/api/v1' + path, { ...options, headers: {Authorization:`Bearer ${token}`, ...options.headers}, signal: AbortSignal.timeout(10000) });
  if (options.method === 'DELETE' && res.status === 404) return null;
  if (!res.ok) throw new Error(`Provider returned ${res.status}`);
  return res.status === 204 ? null : res.json();
}
export async function verifyPilotSubmission(id) {
  const submission = await api('/submissions/' + encodeURIComponent(id));
  const forms = await api('/sites/' + encodeURIComponent(process.env.SITE_ID) + '/forms');
  const pilot = forms.find(f => f.name === 'pilot-application');
  if (!pilot || submission.form_id !== pilot.id) throw new Error('Not a pilot application for this site');
}
