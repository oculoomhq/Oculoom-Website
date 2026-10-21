import { getStore } from '@netlify/blobs';
import { cleanRejected } from '../../lib/retention.mjs';
import { api } from '../../lib/netlify-api.mjs';
export default async () => {
  if (process.env.RETENTION_ENABLED !== 'true') return;
  if (!process.env.NETLIFY_API_TOKEN || !process.env.SITE_ID) throw new Error('Configure retention credentials before launch');
  const store = getStore({name:'pilot-rejection-queue',consistency:'strong'});
  const count = await cleanRejected({store,deleteSubmission:async id => {
    // Queue entries are only written after site/form validation by the admin endpoint.
    await api('/submissions/' + encodeURIComponent(id),{method:'DELETE'});
  }});
  console.log(`Retention sweep completed: ${count} queued submissions removed.`);
};
export const config = {schedule:'0 * * * *'};
