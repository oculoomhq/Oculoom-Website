import {createHmac,randomBytes,timingSafeEqual,createCipheriv,createDecipheriv,createHash} from 'node:crypto';
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
const gmailScope='https://www.googleapis.com/auth/gmail.readonly';
const gmailEmail='oculoomhq@gmail.com';
const gmailCookie='__Host-oc_gmail';
function seal(value,key){
  const iv=randomBytes(12);
  const cipher=createCipheriv('aes-256-gcm',createHash('sha256').update('gmail:'+key).digest(),iv);
  const body=Buffer.concat([cipher.update(JSON.stringify(value)),cipher.final()]);
  return Buffer.concat([iv,cipher.getAuthTag(),body]).toString('base64url');
}
function unseal(value,key){
  try{
    const buf=Buffer.from(value,'base64url');
    const decipher=createDecipheriv('aes-256-gcm',createHash('sha256').update('gmail:'+key).digest(),buf.subarray(0,12));
    decipher.setAuthTag(buf.subarray(12,28));
    return JSON.parse(Buffer.concat([decipher.update(buf.subarray(28)),decipher.final()]));
  }catch{return null;}
}
export default async function(req){
  const {ADMIN_GOOGLE_CLIENT_ID:id,ADMIN_GOOGLE_CLIENT_SECRET:secret,ADMIN_SESSION_SECRET:key,ADMIN_OWNER_EMAIL:owner,SITE_ID}=process.env;
  const url=new URL(req.url);
  if(url.origin!==origin) return response(404,{error:'Unavailable'});
  if(!id || !secret || !owner || !key || key.length<32) return response(503,{error:'Owner access has not been configured.'});
  const action=url.searchParams.get('action');
  if(action==='logout' && req.method==='POST' && req.headers.get('origin')===origin) { const result=redirect('/admin',cookie('__Host-oc_owner','',0)); result.headers.append('set-cookie',cookie(gmailCookie,'',0)); return result; }
  if(req.method!=='GET') return response(405,{error:'Method not allowed'});
  const session=get(req,'__Host-oc_owner');
  const [expiry,mac]=session?.split('.')||[];
  const authenticated=Boolean(expiry && Number(expiry)>Date.now() && equal(mac,sign(expiry+':'+owner,key)));
  try {
    if(action==='gmail-connect'){
      if(!authenticated) return response(401,{error:'Sign in to continue.'});
      const state='gmail-'+randomBytes(32).toString('base64url');
      const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      target.search=new URLSearchParams({client_id:id,redirect_uri:callback,response_type:'code',scope:'openid email '+gmailScope,state,login_hint:gmailEmail,prompt:'select_account'});
      return redirect(target.href,cookie('__Host-oc_state',state,300));
    }
    if(action==='login'){
      const state=randomBytes(32).toString('base64url');
      const target=new URL('https://accounts.google.com/o/oauth2/v2/auth');
      target.search=new URLSearchParams({client_id:id,redirect_uri:callback,response_type:'code',scope:'openid email',state,prompt:'select_account'});
      return redirect(target.href,cookie('__Host-oc_state',state,300));
    }
    if(action==='callback'){
      const state=url.searchParams.get('state'),code=url.searchParams.get('code');
      const gmail=state?.startsWith('gmail-');
      const denied=()=>redirect(gmail?'/admin?gmail=denied#outreach':'/admin?error=signin',cookie('__Host-oc_state','',0));
      if(!code || (gmail && !authenticated) || !equal(state,get(req,'__Host-oc_state'))) return denied();
      const token=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({code,client_id:id,client_secret:secret,redirect_uri:callback,grant_type:'authorization_code'}),signal:AbortSignal.timeout(8000)});
      if(!token.ok) return denied();
      const {access_token,scope,expires_in}=await token.json();
      const profile=await fetch('https://openidconnect.googleapis.com/v1/userinfo',{headers:{Authorization:'Bearer '+access_token},signal:AbortSignal.timeout(8000)});
      if(!profile.ok) return denied();
      const user=await profile.json();
      if(gmail){
        if(user.email_verified!==true || user.email?.toLowerCase()!==gmailEmail || !scope?.split(' ').includes(gmailScope)) return denied();
        const age=Math.min(Number(expires_in),Math.floor((Number(expiry)-Date.now())/1000));
        if(!(age>0)) return denied();
        const result=redirect('/admin#outreach',cookie(gmailCookie,seal({token:access_token,session,until:Date.now()+age*1000},key),age));
        result.headers.append('set-cookie',cookie('__Host-oc_state','',0));
        return result;
      }
      if(user.email_verified!==true || user.email?.toLowerCase()!==owner.toLowerCase()) return denied();
      const ownerExpiry=String(Date.now()+3600000);
      const result=redirect('/admin',cookie('__Host-oc_owner',ownerExpiry+'.'+sign(ownerExpiry+':'+owner,key),3600));
      result.headers.append('set-cookie',cookie('__Host-oc_state','',0));
      return result;
    }
    if(!authenticated) return response(401,{error:'Sign in to continue.'});
    if(action==='gmail'){
      const grant=unseal(get(req,gmailCookie),key);
      if(!grant || !equal(grant.session,session) || !(grant.until>Date.now())) return response(200,{connected:false});
      const base='https://gmail.googleapis.com/gmail/v1/users/me/messages';
      const request=async (url)=>{
        const r=await fetch(url,{headers:{Authorization:'Bearer '+grant.token},signal:AbortSignal.timeout(7000)});
        if(!r.ok) throw Error('Gmail unavailable');
        return r.json();
      };
      const queries={sent:'in:sent label:oculoom-outreach newer_than:30d',replies:'label:oculoom-reply newer_than:30d',bounces:'label:oculoom-bounce newer_than:30d'};
      const groups=await Promise.all(Object.entries(queries).map(async ([kind,q])=>{
        const data=await request(base+'?'+new URLSearchParams({q,maxResults:'100'}));
        const messages=data.messages||[];
        const recent=kind==='sent'?[]:await Promise.all(messages.slice(0,5).map(async ({id})=>{
          const m=await request(base+'/'+encodeURIComponent(id)+'?format=metadata&metadataHeaders=From&metadataHeaders=Subject');
          const header=name=>m.payload?.headers?.find(h=>h.name.toLowerCase()===name)?.value||'';
          return {from:header('from'),subject:header('subject'),threadId:m.threadId,date:m.internalDate};
        }));
        return [kind,{count:messages.length,more:Boolean(data.nextPageToken),recent}];
      }));
      return response(200,{connected:true,groups:Object.fromEntries(groups)});
    }
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
