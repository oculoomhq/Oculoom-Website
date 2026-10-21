export const TEN_DAYS_MS = 10 * 24 * 60 * 60 * 1000;
// Sweep hourly; queue at 9 days 23 hours so the next scheduled pass is within 10 days.
export function rejectionRecord(submissionId, now = Date.now()) {
  return { submissionId, rejectedAt: new Date(now).toISOString(), deleteAfter: new Date(now + TEN_DAYS_MS - 3600000).toISOString() };
}
export async function cleanRejected({store, deleteSubmission, now = Date.now()}) {
  let removed = 0;
  for await (const page of store.list({ paginate: true })) {
    for (const {key} of page.blobs) {
      const record = await store.get(key, {type:'json'});
      if (!record || !Number.isFinite(Date.parse(record.deleteAfter)) || Date.parse(record.deleteAfter) > now) continue;
      // Keep queue on upstream failure; a later run retries it. A missing submission counts as deleted.
      await deleteSubmission(record.submissionId);
      await store.delete(key);
      removed++;
    }
  }
  return removed;
}
