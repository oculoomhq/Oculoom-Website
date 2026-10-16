(() => {
  const menuToggle = document.querySelector('.menu-toggle');
  const nav = document.querySelector('.primary-nav');
  if (menuToggle && nav) {
    menuToggle.addEventListener('click', () => {
      const isOpen = nav.classList.toggle('open');
      menuToggle.setAttribute('aria-expanded', String(isOpen));
      menuToggle.setAttribute('aria-label', isOpen ? 'Close navigation' : 'Open navigation');
      document.body.classList.toggle('menu-open', isOpen);
    });
    nav.querySelectorAll('a').forEach(link => link.addEventListener('click', () => {
      nav.classList.remove('open');
      menuToggle.setAttribute('aria-expanded', 'false');
      menuToggle.setAttribute('aria-label', 'Open navigation');
      document.body.classList.remove('menu-open');
    }));
  }

  const revealItems = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    const observer = new IntersectionObserver(entries => entries.forEach(entry => {
      if (entry.isIntersecting) { entry.target.classList.add('is-visible'); observer.unobserve(entry.target); }
    }), { threshold: 0.12, rootMargin: '0px 0px -25px 0px' });
    revealItems.forEach(item => observer.observe(item));
  } else revealItems.forEach(item => item.classList.add('is-visible'));

  // Interactive calendar. Dates before today are disabled; times are a demo selection, not live availability.
  const calendarGrid = document.getElementById('calendar-grid');
  const monthLabel = document.getElementById('month-label');
  const prevMonth = document.getElementById('prev-month');
  const nextMonth = document.getElementById('next-month');
  const bookingNote = document.getElementById('booking-note');
  const requestMeeting = document.getElementById('request-meeting');
  const today = new Date(); today.setHours(0, 0, 0, 0);
  let viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
  let selectedDate = new Date(today);
  let selectedTime = '02:00 PM';
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const formatDate = d => d.toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

  function renderCalendar() {
    if (!calendarGrid || !monthLabel) return;
    monthLabel.textContent = viewMonth.toLocaleDateString('en-IN', { month: 'long', year: 'numeric' });
    calendarGrid.innerHTML = '';
    dayNames.forEach(day => {
      const label = document.createElement('span'); label.className = 'calendar-day-label'; label.textContent = day; calendarGrid.appendChild(label);
    });
    const firstDay = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), 1).getDay();
    const daysInMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) { const blank = document.createElement('span'); blank.setAttribute('aria-hidden', 'true'); calendarGrid.appendChild(blank); }
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(viewMonth.getFullYear(), viewMonth.getMonth(), day); date.setHours(0, 0, 0, 0);
      const button = document.createElement('button'); button.type = 'button'; button.className = 'calendar-date'; button.textContent = String(day);
      button.setAttribute('aria-label', formatDate(date));
      if (date < today) button.disabled = true;
      if (selectedDate && date.toDateString() === selectedDate.toDateString()) { button.classList.add('selected'); button.setAttribute('aria-pressed', 'true'); }
      else button.setAttribute('aria-pressed', 'false');
      button.addEventListener('click', () => { selectedDate = date; renderCalendar(); updateBookingNote(); });
      calendarGrid.appendChild(button);
    }
    if (prevMonth) prevMonth.disabled = viewMonth.getFullYear() === today.getFullYear() && viewMonth.getMonth() <= today.getMonth();
  }
  function updateBookingNote() {
    if (bookingNote) bookingNote.textContent = selectedDate ? `Selected: ${formatDate(selectedDate)} at ${selectedTime} IST. Availability will be confirmed by email.` : 'Choose a date and time to prepare your meeting request.';
  }
  prevMonth?.addEventListener('click', () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() - 1, 1); renderCalendar(); });
  nextMonth?.addEventListener('click', () => { viewMonth = new Date(viewMonth.getFullYear(), viewMonth.getMonth() + 1, 1); renderCalendar(); });
  document.querySelectorAll('.time-slots button').forEach(button => button.addEventListener('click', () => {
    document.querySelectorAll('.time-slots button').forEach(b => { b.classList.remove('selected'); b.setAttribute('aria-pressed', 'false'); });
    button.classList.add('selected'); button.setAttribute('aria-pressed', 'true'); selectedTime = button.dataset.time; updateBookingNote();
  }));
  requestMeeting?.addEventListener('click', () => {
    if (!selectedDate) { bookingNote.textContent = 'Please select a date first.'; return; }
    const subject = encodeURIComponent('OCULOOM meeting request');
    const body = encodeURIComponent(`Hello OCULOOM,\n\nI would like to request a meeting on ${formatDate(selectedDate)} at ${selectedTime} IST. Please confirm availability.\n\nBusiness / name:\nTopics to discuss:\n\nThank you.`);
    window.location.href = `mailto:oculoomhq@gmail.com?subject=${subject}&body=${body}`;
  });
  renderCalendar(); updateBookingNote();

  const contactForm = document.getElementById('contact-form');
  contactForm?.addEventListener('submit', event => {
    event.preventDefault();
    const data = new FormData(contactForm);
    const name = String(data.get('name') || '').trim();
    const email = String(data.get('email') || '').trim();
    const message = String(data.get('message') || '').trim();
    const subject = encodeURIComponent(`OCULOOM website enquiry from ${name}`);
    const body = encodeURIComponent(`Name: ${name}\nBusiness email: ${email}\n\nMessage:\n${message}`);
    const status = document.getElementById('form-status');
    if (status) status.textContent = 'Opening your email app to send the enquiry. Please review and send the draft.';
    window.location.href = `mailto:oculoomhq@gmail.com?subject=${subject}&body=${body}`;
  });
  const year = document.getElementById('year'); if (year) year.textContent = String(new Date().getFullYear());
})();
