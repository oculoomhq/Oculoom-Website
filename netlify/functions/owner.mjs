import {createHmac,randomBytes,timingSafeEqual} from 'node:crypto';
import {api} from '../../lib/netlify-api.mjs';
const origin='https://oculoom.in';
const callback=origin+'/.netlify/functions/owner?action=callback';
const headers={'cache-control':'no-store','x-robots-tag':'noindex','content-type':'application/json'};
const response=(status,data)=>new Response(JSON.stringify(data),{status,headers});
const cookie=(name,value,age)=>name+'='+value+'; Path=/; Secure; HttpOnly; SameSite=Lax; Max-Age='+age;
const redirect=(location,setCookie)=>new Response(null,{status:303,headers:{...headers,location,...(setCookie?{'set-cookie':setCookie}:{})}});
const get=(req,name)=>req.headers.get('cookie')?.split(/;\s*/).find(x=>x.startsWith(name+'='))?.slice(name.length+1);
const sign=(s,key)=>createHmac('sha256',key).update(s).digest('base64url');
function equal(a,b){
  return typeof a==='string' && typeof b==='string' && Buffer.byteLength(a)===Buffer.byteLength(b) && timingSafeEqual(Buffer.from(a),Buffer.from(b));
}
export default async function(req){
  const {ADMIN_GOOGLE_CLIENT_ID:id,ADMIN_GOOGLE_CLIENT_SECRET:secret,ADMIN_SESSION_SECRET:key,ADMIN_OWNER_EMAIL:owner,SITE_ID}=process.env;
  const url=new URL(req.url);
  if(url.origin!==origin) return response(404,{error:'Unavailable'});
  if(!id || !secret || !owner || !key || key.length<32) return response(503,{error:'Owner access has not been configured.'});
  const action=url.searchParams.get('action');
  if(action==='logout' && req.method==='POST' && req.headers.get('origin')===origin) return redirect('/admin',cookie('__Host-oc_owner','',0));
  if(req.method!=='GET') return response(405,{error:'Method not allowed'});
  try {
    if(action==='login'){
      const state=randomBytes(32).toString('base64url');
      const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      target.search=new URLSearchParams({client_id:id,redirect_uri:callback,response_type:'code',scope:'openid email',state,prompt:'select_account'});
      return redirect(target.href,cookie('__Host-oc_state',state,300));
    }
    if(action==='callback'){
      const state=url.searchParams.get('state'),code=url.searchParams.get('code');
      const denied=()=>redirect('/admin?error=signin',cookie('__Host-oc_state','',0));
      if(!code || !equal(state,get(req,'__Host-oc_state'))) return denied();
      const token=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,client_id:id,client_secret:secret,redirect_uri:callback,grant_type:'authorization_code'}),signal:AbortSignal.timeout(8000)});
      if(!token.ok) return denied();
      const {access_token}=await token.json();
      const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+access_token},signal:AbortSignal.timeout(8000)});
      if(!profile.ok) return denied();
      const user=await profile.json();
      if(user.email_verified!==true || user.email?.toLowerCase()!==owner.toLowerCase()) return denied();
      const expiry=String(Date.now()+3600000);
      const result=redirect('/admin',cookie('__Host-oc_owner',expiry+'.'+sign(expiry+':'+owner,key),3600));
      result.headers.append('set-cookie',cookie('__Host-oc_state','',0));
      return result;
    }
    const [expiry,mac]=get(req,'__Host-oc_owner')?.split('.')||[];
    if(!expiry || !(Number(expiry)>Date.now()) || !equal(mac,sign(expiry+':'+owner,key))) return response(401,{error:'Sign in to continue.'});
    if(action!=='forms') return response(404,{error:'Unavailable'});
    if(!SITE_ID) return response(503,{error:'Forms are not configured.'});
    const forms=await api('/sites/'+encodeURIComponent(SITE_ID)+'/forms');
    const results=await Promise.all(['pilot-application','contact-enquiry'].map(async name=>{
      const form=forms.find(f=>f.name===name);
      if(!form) throw Error('Missing form');
      const rows=await api('/forms/'+encodeURIComponent(form.id)+'/submissions?per_page=50');
      return rows.map(({created_at,data={}})=>({created_at,...Object.fromEntries(['name','business','email','website','capability','topic','message'].map(k=>[k,typeof data[k]==='string'?data[k]:'']))}));
    }));
    return response(200,{pilot:results[0],contact:results[1],checkedAt:new Date().toISOString()});
  } catch {
    return response(502,{error:'Could not load the requested information. Try again shortly.'});
  }
}
