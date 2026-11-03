const el=id=>document.getElementById(id);
function render(key,rows){
  el(key+'-count').textContent=rows.length;
  const list=el(key+'-rows');
  if(!rows.length) list.textContent='No submissions found.';
  for(const row of rows){
    const details=document.createElement('details'), title=document.createElement('summary');
    for(const [value,kind] of [[row.business||row.name||'Submission','record-name'],[row.business?row.name:'','record-contact'],[row.created_at?new Date(row.created_at).toLocaleDateString('en-IN',{day:'numeric',month:'short',year:'numeric'}):'','record-date']]){
      const cell=document.createElement('span');
      cell.className=kind;
      cell.textContent=value;
      title.append(cell);
    }
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
    void loadGmail();
  }catch(error){
    el('status').textContent=error instanceof SyntaxError?'Owner service is unavailable.':error.message;
  }
}
addEventListener('pagehide',()=>{el('dashboard').hidden=true;});
addEventListener('pageshow',e=>{if(e.persisted) location.reload();});
load();

async function loadGmail(){
  const status=el('gmail-status');
  if(new URLSearchParams(location.search).get('gmail')==='denied') status.textContent='Gmail access was not granted. Choose the OCULOOM mailbox and allow read-only access.';
  try{
    const r=await fetch('/.netlify/functions/owner?action=gmail',{cache:'no-store'});
    if(!r.ok) throw Error();
    const data=await r.json();
    if(!data.connected) return;
    status.textContent='Last 30 days. Counts include only messages labeled for OCULOOM outreach.';
    el('gmail-connect').hidden=true;
    for(const [kind,group] of Object.entries(data.groups)){
      el('gmail-'+kind).textContent=group.count+(group.more?'+':'');
      el('gmail-'+kind+'-note').textContent='Labeled · last 30 days';
      if(kind==='sent') continue;
      const heading=document.createElement('h3');
      heading.textContent=kind==='replies'?'Recent replies':'Recent bounces';
      el('gmail-recent').append(heading);
      if(!group.recent.length){
        const p=document.createElement('p');p.textContent='No labeled messages found.';el('gmail-recent').append(p);
      }
      for(const message of group.recent){
        const p=document.createElement('p'), a=document.createElement('a');
        a.href='https://mail.google.com/mail/u/oculoomhq@gmail.com/#all/'+encodeURIComponent(message.threadId);
        a.textContent=message.subject||'(No subject)';
        p.append(a,document.createTextNode(' · '+message.from));
        el('gmail-recent').append(p);
      }
    }
  }catch{status.textContent='Gmail could not load. Check that the Gmail API is enabled and reconnect.';}
}
