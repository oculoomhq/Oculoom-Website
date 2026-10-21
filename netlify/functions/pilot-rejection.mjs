import { timingSafeEqual } from 'node:crypto';
import { getStore } from '@netlify/blobs';
import { rejectionRecord } from '../../lib/retention.mjs';
import { verifyPilotSubmission } from '../../lib/netlify-api.mjs';
// Admin-only endpoint. No public page contains the secret. Never log request bodies or tokens.
export default async request => {
  const headers = {'Cache-Control':'no-store','Content-Type':'application/json'};
  const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers});
  if (request.method !== 'POST') return reply({error:'Method not allowed'},405);
  if (!process.env.PILOT_ADMIN_SECRET || process.env.PILOT_ADMIN_SECRET.length < 32 || !process.env.NETLIFY_API_TOKEN || !process.env.SITE_ID) return reply({error:'Retention credentials are not configured'},503);
  const expected = Buffer.from('Bearer ' + process.env.PILOT_ADMIN_SECRET);
  const given = Buffer.from(request.headers.get('Authorization') || '');
  if (given.length !== expected.length || !timingSafeEqual(given,expected)) return reply({error:'Unauthorized'},401);
  try {
    if (Number(request.headers.get('content-length')) > 2048) return reply({error:'Request too large'},413);
    const text = await request.text(); if (text.length > 2048) return reply({error:'Request too large'},413);
    const {submissionId,action} = JSON.parse(text);
    if (typeof submissionId !== 'string' || !/^[a-zA-Z0-9-]{8,100}$/.test(submissionId) || !['verify','reject','cancel'].includes(action)) return reply({error:'Invalid request'},400);
    if (action === 'reject' && process.env.RETENTION_ENABLED !== 'true') return reply({error:'Automatic deletion is switched off. Use verify to check the connection without scheduling deletion.'},409);
    await verifyPilotSubmission(submissionId);
    const store = getStore({name:'pilot-rejection-queue',consistency:'strong'});
    // A read-only check is allowed while deletion is off. It writes no queue entry.
    if (action === 'verify') {
      const queued = await store.get(submissionId,{type:'json'});
      return reply({connectionVerified:true,submissionVerified:true,storageReadable:true,retentionEnabled:process.env.RETENTION_ENABLED === 'true',scheduled:Boolean(queued),deleteAfter:queued?.deleteAfter || null});
    }
    if (action === 'cancel') { await store.delete(submissionId); return reply({cancelled:true}); }
    // Repeating a rejection must not move the deletion deadline forward.
    const existing = await store.get(submissionId,{type:'json'});
    const record = existing || rejectionRecord(submissionId);
    if (!existing) await store.setJSON(submissionId,record);
    return reply({scheduled:true,deleteAfter:record.deleteAfter});
  } catch { return reply({error:'Could not update rejection status. Check configuration and submission ID.'},400); }
};
