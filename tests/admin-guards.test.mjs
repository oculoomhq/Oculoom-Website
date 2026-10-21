import test from 'node:test';
import assert from 'node:assert/strict';
import handler from '../netlify/functions/pilot-rejection.mjs';
const secret='x'.repeat(40);
test('admin endpoint rejects unsupported methods without writes',async()=>{const r=await handler(new Request('https://example.com',{method:'GET'}));assert.equal(r.status,405)});
test('missing credentials fail closed',async()=>{const r=await handler(new Request('https://example.com',{method:'POST'}));assert.equal(r.status,503)});
test('valid credentials do not permit rejection while deletion disabled',async()=>{
 const saved={...process.env};
 Object.assign(process.env,{PILOT_ADMIN_SECRET:secret,NETLIFY_API_TOKEN:'test-only',SITE_ID:'test-site',RETENTION_ENABLED:'false'});
 try{
 const r=await handler(new Request('https://example.com',{method:'POST',headers:{Authorization:'Bearer '+secret},body:JSON.stringify({action:'reject',submissionId:'test-submission'})}));assert.equal(r.status,409);
 const unauthorized=await handler(new Request('https://example.com',{method:'POST',body:JSON.stringify({action:'verify',submissionId:'test-submission'})}));assert.equal(unauthorized.status,401);
 }finally{for(const k of ['PILOT_ADMIN_SECRET','NETLIFY_API_TOKEN','SITE_ID','RETENTION_ENABLED']){if(saved[k]===undefined)delete process.env[k];else process.env[k]=saved[k];}}
});
