(() => {
  'use strict';
  const $ = (s, p = document) => p.querySelector(s);
  const $$ = (s, p = document) => [...p.querySelectorAll(s)];
  const menu = $('.menu-button'), nav = $('#main-nav');
  menu?.addEventListener('click', () => { const open = nav.classList.toggle('open'); menu.setAttribute('aria-expanded', String(open)); });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { nav?.classList.remove('open'); menu?.setAttribute('aria-expanded', 'false'); closeService(true); } });
  // Consent is denied by default. Never load Analytics on previews, local hosts or success pages.
  const prod = ['oculoom.in', 'www.oculoom.in'].includes(location.hostname);
  let consent = 'unset', loaded = false;
  try { consent = localStorage.getItem('oculoom-analytics') || 'unset'; } catch {}
  const banner = $('.consent');
  function loadAnalytics() {
    if (!prod || loaded || consent !== 'granted') return;
    loaded = true;
    window.dataLayer = window.dataLayer || [];
    window.gtag = function() { window.dataLayer.push(arguments); };
    window.gtag('consent', 'default', { analytics_storage: 'granted', ad_storage: 'denied', ad_user_data: 'denied', ad_personalization: 'denied' });
    window.gtag('js', new Date());
    // Remove URL query and hash: they can contain user-provided values.
    window.gtag('config', 'G-25L264DXWL', { page_location: location.origin + location.pathname, page_referrer: document.referrer ? new URL(document.referrer).origin : '', send_page_view: true, allow_google_signals: false, allow_ad_personalization_signals: false });
    const tag = document.createElement('script'); tag.async = true; tag.src = 'https://www.googletagmanager.com/gtag/js?id=G-25L264DXWL'; document.head.appendChild(tag);
  }
  function track(event, values = {}) { if (prod && consent === 'granted' && window.gtag) window.gtag('event', event, values); }
  function setConsent(value) {
    consent = value;
    try { localStorage.setItem('oculoom-analytics', value); } catch {}
    banner.hidden = true;
    if (value === 'granted') loadAnalytics();
    else {
      window['ga-disable-G-25L264DXWL'] = true;
      window.gtag?.('consent', 'update', { analytics_storage: 'denied' });
      for (const pair of document.cookie.split(';')) {
        const name = pair.split('=')[0].trim();
        if (!name.startsWith('_ga')) continue;
        for (const domain of ['', ';domain=' + location.hostname, ';domain=.oculoom.in']) document.cookie = name + '=;Max-Age=0;path=/' + domain;
      }
      if (loaded) location.reload();
    }
  }
  if (prod && consent === 'unset') banner.hidden = false;
  if (consent === 'granted') loadAnalytics();
  $$('[data-consent]').forEach(b => b.addEventListener('click', () => { window['ga-disable-G-25L264DXWL'] = false; setConsent(b.dataset.consent); }));
  $$('[data-cookie-settings]').forEach(b => b.addEventListener('click', () => { banner.hidden = false; }));
  // Forms remain real, statically declared Netlify forms; this layer provides recovery and verified-success navigation.
  $$('form[data-lead]').forEach(form => {
    let sending = false;
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (sending || !form.reportValidity()) return;
      const status = $('.form-status', form), submit = $('button[type=submit]', form);
      if (!prod && !location.hostname.endsWith('.netlify.app')) { status.textContent = 'Forms can be tested on the Netlify deploy preview. No application has been sent from this local preview.'; return; }
      const data = new FormData(form);
      if (data.get('website-check')) { status.textContent = 'Please reload and try again.'; return; }
      sending = true; submit.disabled = true; status.textContent = 'Sending securely…';
      try {
        const res = await fetch('/', { method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, body: new URLSearchParams(data).toString() });
        if (!res.ok) throw new Error('Submission failed');
        // Never send field contents, email, name, website or question to Analytics.
        track('generate_lead', { form_type: form.dataset.lead, transport_type: 'beacon' });
        try { sessionStorage.setItem('oculoom-submitted', form.dataset.lead); } catch {}
        location.assign(form.getAttribute('action'));
      } catch {
        status.textContent = 'We couldn’t confirm your submission. Your details are still here. Please try again, or email oculoomhq@gmail.com.';
        sending = false; submit.disabled = false;
      }
    });
  });
  let capabilities = [], activeService = null, closeTimer;
  function closeService(focus = false) {
    const popup = $('#service-popover');
    if (!popup || popup.hidden) return;
    const trigger = activeService;
    popup.hidden = true; $$('[data-service]').forEach(b => b.setAttribute('aria-expanded', 'false')); activeService = null;
    if (focus) trigger?.focus();
  }
  function showService(id, forceFocus = false) {
    const c = capabilities.find(x => x.id === id), popup = $('#service-popover'), trigger = $(`[data-service="${id}"]`);
    if (!c || !popup || !trigger) return;
    clearTimeout(closeTimer); activeService = trigger;
    $$('[data-service]').forEach(b => b.setAttribute('aria-expanded', String(b === trigger)));
    popup.replaceChildren();
    const close = document.createElement('button'); close.className = 'close-popover'; close.setAttribute('aria-label', 'Close service details'); close.textContent = '×'; close.onclick = () => closeService(true); popup.append(close);
    const title = document.createElement('h2'); title.textContent = 'OCULOOM ' + c.name; popup.append(title);
    if (c.id === 'commerce') { const label = document.createElement('p'); label.textContent = 'Developing capability · Availability discussed individually.'; popup.append(label); }
    const sub = document.createElement('p'); sub.className = 'eyebrow'; sub.textContent = 'Services'; popup.append(sub);
    const list = document.createElement('ul'); c.services.forEach(s => { const li = document.createElement('li'); li.textContent = s; list.append(li); }); popup.append(list);
    const delivery = document.createElement('p'); delivery.className = 'eyebrow'; delivery.textContent = 'Deliverables'; popup.append(delivery);
    const info = document.createElement('p'); info.textContent = c.deliver; popup.append(info);
    const link = document.createElement('a'); link.className = 'button ivory'; link.href = '/contact.html?service=' + encodeURIComponent(c.name); link.textContent = 'Discuss this service ↗'; popup.append(link);
    popup.hidden = false;
    // Keep the floating panel aligned with the active row on desktop.
    if (matchMedia('(min-width:641px)').matches) popup.style.top = Math.max(0, trigger.closest('article').offsetTop - 10) + 'px';
    if (forceFocus) close.focus();
  }
  function selectCapability(id) {
    const c = capabilities.find(x => x.id === id); if (!c || !$('#cap-name')) return;
    $$('[data-capability]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.capability === id)));
    $('#cap-name').textContent = 'OCULOOM ' + c.name; $('#cap-tag').textContent = c.tag; $('#cap-desc').textContent = c.desc;
    const link = $('#cap-service'); link.textContent = 'Explore ' + c.name + ' Services ↗'; link.href = '/services.html#' + c.id;
    $('#cap-links').replaceChildren(...c.links.map(id => { const other = capabilities.find(x => x.id === id); const b = document.createElement('button'); b.textContent = other.name; b.onclick = () => selectCapability(id); return b; }));
  }
  let questionIndex = 0;
  function selectQuestion(id) {
    questionIndex = capabilities.findIndex(c => c.id === id); if (questionIndex < 0) questionIndex = 0;
    const c = capabilities[questionIndex];
    if (!$('#pilot-question')) return;
    $('#question-capability').textContent = c.name + (id === 'commerce' ? ' · Developing capability' : '');
    $('#pilot-question').textContent = c.question; $('#question-count').textContent = `${questionIndex + 1} / 6`;
    $$('[data-question]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.question === c.id)));
  }
  const needsCapabilities = $('.service-grid, .ecosystem-map, .explorer');
  if (needsCapabilities) fetch('/assets/capabilities.json').then(r => { if (!r.ok) throw Error(); return r.json(); }).then(data => {
    capabilities = data;
    $$('[data-service]').forEach(b => {
      b.addEventListener('click', () => showService(b.dataset.service, true));
      b.addEventListener('pointerenter', e => { if (e.pointerType === 'mouse' && matchMedia('(hover:hover)').matches) showService(b.dataset.service); });
      b.addEventListener('pointerleave', () => { closeTimer = setTimeout(() => closeService(), 450); });
    });
    const popup = $('#service-popover');
    popup?.addEventListener('pointerenter', () => clearTimeout(closeTimer));
    popup?.addEventListener('pointerleave', () => { closeTimer = setTimeout(() => closeService(), 450); });
    document.addEventListener('click', e => { if (!e.target.closest('.service-popover, .service-trigger')) closeService(); });
    function hashService() { const id = location.hash.slice(1); if (capabilities.some(c => c.id === id) && popup) { showService(id); $('#' + id)?.scrollIntoView({ block: 'center' }); } }
    hashService(); window.addEventListener('hashchange', hashService);
    $$('[data-capability]').forEach(b => b.addEventListener('click', () => selectCapability(b.dataset.capability))); selectCapability('growth');
    $$('[data-question]').forEach(b => b.addEventListener('click', () => selectQuestion(b.dataset.question)));
    $('[data-question-prev]')?.addEventListener('click', () => selectQuestion(capabilities[(questionIndex + 5) % 6].id));
    $('[data-question-next]')?.addEventListener('click', () => selectQuestion(capabilities[(questionIndex + 1) % 6].id));
    $('#use-question')?.addEventListener('click', () => {
      const form = $('form[data-lead=pilot]');
      $('[name=message]', form).value = $('#custom-question').value.trim() || capabilities[questionIndex].question;
      $('[name=capability]', form).value = capabilities[questionIndex].name;
      $('#application').scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion:reduce)').matches ? 'auto' : 'smooth' });
      setTimeout(() => $('[name=name]', form).focus({ preventScroll: true }), 300);
    });
  }).catch(() => {
    const note = document.createElement('p'); note.textContent = 'Details are temporarily unavailable. Please contact us to discuss a capability.'; note.className = 'caption'; needsCapabilities.after(note);
  });
  if ($('[data-step]')) fetch('/assets/steps.json').then(r => r.json()).then(steps => {
    let active = 0;
    function setStep(i) {
      active = i; const step = steps[i];
      $$('[data-step]').forEach(b => { const selected = Number(b.dataset.step) === i; b.setAttribute('aria-selected', String(selected)); b.tabIndex = selected ? 0 : -1; });
      $('#step-panel').setAttribute('aria-labelledby', 'step-tab-' + i); $('#step-label').textContent = `Step 0${i+1} of 05`;
      $('#step-title').textContent = step[0]; $('#step-subtitle').textContent = step[1]; $('#step-do').textContent = step[2]; $('#step-get').textContent = step[3];
      $('#next-step').textContent = i === 4 ? 'Start again: Understand →' : 'Next: ' + steps[i+1][0] + ' →';
    }
    $$('[data-step]').forEach(b => { b.addEventListener('click', () => setStep(Number(b.dataset.step))); b.addEventListener('keydown', e => {
      let next = active; if (['ArrowDown','ArrowRight'].includes(e.key)) next = (active + 1) % 5; else if (['ArrowUp','ArrowLeft'].includes(e.key)) next = (active + 4) % 5; else if (e.key === 'Home') next = 0; else if (e.key === 'End') next = 4; else return;
      e.preventDefault(); setStep(next); $(`[data-step="${next}"]`).focus();
    }); }); $('#next-step').addEventListener('click', () => setStep((active+1)%5));
  });
  const service = new URLSearchParams(location.search).get('service');
  if (service && capabilities.length === 0) { const option = $$('select[name=topic] option').find(o => o.value === service); if (option) option.selected = true; }
  $$('a[href="/pilot.html"],a[href="#application"]').forEach(a => a.addEventListener('click', () => track('pilot_interest')));
})();
