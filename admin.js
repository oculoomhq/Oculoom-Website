const el=id=>document.getElementById(id);
function render(key,rows){
  el(key+'-count').textContent=rows.length;
  const list=el(key+'-rows');
  if(!rows.length) list.textContent='No submissions found.';
  for(const row of rows){
    const details=document.createElement('details'), title=document.createElement('summary');
    title.textContent=[row.business||row.name||'Submission',row.created_at?new Date(row.created_at).toLocaleString():''].filter(Boolean).join(' · ');
    details.append(title);
    for(const [label,k] of [['Name','name'],['Email','email'],['Business','business'],['Website','website'],['Topic','topic'],['Capability','capability'],['Message','message']]){
      if(!row[k]) continue;
      const p=document.createElement('p');
      p.textContent=label+': '+row[k];
      details.append(p);
    }
    list.append(details);
  }
}
async function load(){
  if(new URLSearchParams(location.search).has('error')) el('status').textContent='Sign-in could not be completed. Try the approved owner account.';
  try{
    const r=await fetch('/.netlify/functions/owner?action=forms',{cache:'no-store'});
    if(r.status===401) return;
    const data=await r.json();
    if(!r.ok) throw Error(data.error);
    render('pilot',data.pilot);
    render('contact',data.contact);
    el('sync').textContent='Last checked: '+new Date(data.checkedAt).toLocaleString()+' · Up to 50 recent records per form';
    el('login').hidden=true;
    el('dashboard').hidden=false;
  }catch(error){
    el('status').textContent=error instanceof SyntaxError?'Owner service is unavailable.':error.message;
  }
}
addEventListener('pagehide',()=>{el('dashboard').hidden=true;});
addEventListener('pageshow',e=>{if(e.persisted) location.reload();});
load();
