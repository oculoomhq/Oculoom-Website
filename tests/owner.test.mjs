import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/owner.mjs';
test('owner forms reject unsigned and forged sessions and preview hosts',async()=>{
  Object.assign(process.env,{ADMIN_GOOGLE_CLIENT_ID:'test',ADMIN_GOOGLE_CLIENT_SECRET:'test',ADMIN_SESSION_SECRET:'x'.repeat(32),ADMIN_OWNER_EMAIL:'owner@example.com'});
  const url='https://oculoom.in/.netlify/functions/owner?action=forms';
  for(const headers of [{},{cookie:'__Host-oc_owner='+String(Date.now()+60000)+'.forged'}]){
    const result=await handler(new Request(url,{headers}));
    assert.equal(result.status,401);
    assert.equal(result.headers.get('cache-control'),'no-store');
  }
  assert.equal((await handler(new Request(url.replace('oculoom.in','preview.netlify.app')))).status,404);
});
