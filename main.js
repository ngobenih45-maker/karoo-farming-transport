/* =====================================================================
   Karoo Farming Transport — main.js
   - WhatsApp automation (context-aware pre-filled messages)
   - Navigation, scroll effects, reveal, counters, 3D tilt, coverflow, forms
   ===================================================================== */
(() => {
  'use strict';

  /* ------------------------------------------------------------------
     CONFIG  — edit these two lines to change the WhatsApp number / brand
     ------------------------------------------------------------------ */
  const WA_NUMBER = '27792145474';           // +27 79 214 5474 (international format, no + or spaces)
  const BRAND = 'Karoo Farming Transport';

  const root = document.documentElement;
  root.classList.add('js');
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const raf = (fn) => requestAnimationFrame(fn);

  /* ------------------------------------------------------------------
     WHATSAPP AUTOMATION
     Every element with data-wa="type:label" gets a tailored message.
       data-wa="quote"                        -> quote request template
       data-wa="booking"                      -> collection booking template
       data-wa="track"                        -> delivery update request
       data-wa="callback"                     -> call-back request
       data-wa="service:Furniture & Removals" -> service enquiry
       data-wa="fleet:32-Ton Heavy Hauler"    -> fleet enquiry
       data-wa="general"                      -> generic hello
     ------------------------------------------------------------------ */
  const greeting = () => {
    const h = new Date().getHours();
    return h < 12 ? 'Good morning' : h < 18 ? 'Good afternoon' : 'Good evening';
  };
  const pageName = () => (document.title.split('|')[0] || 'website').trim();

  const TEMPLATES = {
    general: () => `I would like to make an enquiry about your freight and logistics services. Please assist.`,
    quote: () => `I would like to request a *quote*.\n\nPickup location:\nDelivery destination:\nCargo type / weight:\nPreferred date:\nCompany / name:`,
    booking: () => `I would like to *book a collection*.\n\nPickup address:\nDelivery address:\nCargo type / weight:\nDate & time needed:\nContact person & number:`,
    track: () => `I would like an *update on my delivery*.\n\nName / company:\nReference or route (from - to):`,
    callback: () => `Please *call me back* regarding a freight enquiry.\n\nName:\nBest time to call:`,
    service: (l) => `I am interested in your *${l}* service. Please send me a quote and availability.\n\nPickup location:\nDelivery destination:\nCargo details:\nPreferred date:`,
    fleet: (l) => `I would like to enquire about the *${l}* - availability and rates for my load.\n\nCargo type / weight:\nRoute (from - to):\nPreferred date:`,
    contact: () => `I found your contact page and would like to speak to someone in dispatch.`,
    about: () => `I read about your company and would like to discuss working together on my freight needs.`,
  };

  function buildMessage(topic = 'general', extra = '') {
    const i = topic.indexOf(':');
    const type = i === -1 ? topic : topic.slice(0, i);
    const label = i === -1 ? '' : topic.slice(i + 1);
    const tpl = TEMPLATES[type] || TEMPLATES.general;
    return `${greeting()} ${BRAND}, ${tpl(label)}${extra ? `\n\n${extra}` : ''}\n\n- Sent from ${location.hostname || 'our website'} (${pageName()} page)`;
  }
  const waLink = (topic, extra) => `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(buildMessage(topic, extra))}`;
  window.KFT = { waLink, buildMessage };

  function prepareWaLinks() {
    $$('[data-wa]').forEach((a) => {
      a.href = waLink(a.dataset.wa);
      a.target = '_blank';
      a.rel = 'noopener';
    });
  }
  // delegated: always rebuild at click time (topic may have changed, e.g. 3D viewer)
  document.addEventListener('click', (e) => {
    const a = e.target.closest('[data-wa]');
    if (!a) return;
    a.href = waLink(a.dataset.wa);
    if (window.dataLayer) window.dataLayer.push({ event: 'whatsapp_click', topic: a.dataset.wa });
  });
  prepareWaLinks();

  /* ------------------------------------------------------------------
     PRELOADER
     ------------------------------------------------------------------ */
  const pre = $('.preloader');
  let hidden = false;
  const hidePre = () => {
    if (hidden) return;
    hidden = true;
    document.body.classList.add('is-loaded');
    if (pre) { pre.classList.add('is-done'); setTimeout(() => pre.remove(), 900); }
  };
  window.addEventListener('load', () => setTimeout(hidePre, reduce ? 0 : 450));
  setTimeout(hidePre, 3200);
  window.addEventListener('pageshow', (e) => { if (e.persisted) { document.body.classList.remove('is-leaving'); hidePre(); } });

  /* ------------------------------------------------------------------
     HEADER, MOBILE NAV, SCROLL PROGRESS
     ------------------------------------------------------------------ */
  const header = $('[data-header]');
  const burger = $('.burger');
  const setNav = (open) => {
    document.body.classList.toggle('nav-open', open);
    if (burger) burger.setAttribute('aria-expanded', String(open));
  };
  if (burger) burger.addEventListener('click', () => setNav(!document.body.classList.contains('nav-open')));
  $$('.nav a').forEach((a, i) => { a.style.setProperty('--n', i); a.addEventListener('click', () => setNav(false)); });
  addEventListener('keydown', (e) => { if (e.key === 'Escape') { setNav(false); closeWidget(); } });
  addEventListener('resize', () => { if (innerWidth > 900) setNav(false); });

  const progress = $('.progress');
  let ticking = false;
  const onScroll = () => {
    ticking = false;
    const y = scrollY;
    if (header) header.classList.toggle('is-scrolled', y > 40);
    if (progress) {
      const max = document.documentElement.scrollHeight - innerHeight;
      progress.style.setProperty('--p', max > 0 ? Math.min(1, y / max).toFixed(4) : 0);
    }
  };
  addEventListener('scroll', () => { if (!ticking) { ticking = true; raf(onScroll); } }, { passive: true });
  onScroll();

  // page transitions
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || a.target === '_blank') return;
    const url = new URL(a.href, location.href);
    if (url.origin !== location.origin || url.pathname === location.pathname || a.hasAttribute('download') || reduce) return;
    if (!/\.html?$|\/$/.test(url.pathname)) return;
    e.preventDefault();
    document.body.classList.add('is-leaving');
    setTimeout(() => { location.href = url.href; }, 260);
  });

  /* ------------------------------------------------------------------
     SCROLL REVEAL + COUNTERS + PROCESS LINE
     ------------------------------------------------------------------ */
  $$('[data-stagger]').forEach((p) => $$('.reveal', p).forEach((c, i) => c.style.setProperty('--i', i)));
  const io = new IntersectionObserver((entries) => {
    entries.forEach((en) => {
      if (!en.isIntersecting) return;
      en.target.classList.add('is-in');
      if (en.target.hasAttribute('data-count')) countUp(en.target);
      io.unobserve(en.target);
    });
  }, { threshold: 0.14, rootMargin: '0px 0px -6% 0px' });
  $$('.reveal, .steps, .route, [data-count]').forEach((el) => io.observe(el));

  function countUp(el) {
    const end = parseFloat(el.dataset.count);
    const suffix = el.dataset.suffix || '';
    if (reduce) { el.innerHTML = `${end}<em>${suffix}</em>`; return; }
    const t0 = performance.now(), dur = 1700;
    const step = (t) => {
      const p = Math.min(1, (t - t0) / dur);
      const v = Math.round(end * (1 - Math.pow(1 - p, 3)));
      el.innerHTML = `${v}<em>${suffix}</em>`;
      if (p < 1) raf(step);
    };
    raf(step);
  }

  /* ------------------------------------------------------------------
     3D TILT CARDS + PHOTO TILT + HERO STAGE PARALLAX  (mouse only)
     ------------------------------------------------------------------ */
  if (finePointer && !reduce) {
    $$('[data-tilt]').forEach((el) => {
      const max = parseFloat(el.dataset.tilt) || 9;
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
        el.style.setProperty('--rx', ((0.5 - py) * max * 1.2).toFixed(2) + 'deg');
        el.style.setProperty('--ry', ((px - 0.5) * max * 1.6).toFixed(2) + 'deg');
        el.style.setProperty('--gx', (px * 100).toFixed(1) + '%');
        el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', () => {
        el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg');
      });
    });

    $$('.photo-3d').forEach((box) => {
      const inner = $('.photo-3d__in', box);
      box.addEventListener('pointermove', (e) => {
        const r = box.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        inner.style.setProperty('--ry', (px * 18).toFixed(2) + 'deg');
        inner.style.setProperty('--rx', (-py * 12).toFixed(2) + 'deg');
      });
      box.addEventListener('pointerleave', () => { inner.style.removeProperty('--ry'); inner.style.removeProperty('--rx'); });
    });

    const hero = $('.hero');
    const stage = $('.stage__inner');
    if (hero && stage) {
      let tx = -14, ty = 5, cx = -14, cy = 5, run = false;
      const loop = () => {
        cx += (tx - cx) * 0.08; cy += (ty - cy) * 0.08;
        stage.style.setProperty('--ry', cx.toFixed(2) + 'deg');
        stage.style.setProperty('--rx', cy.toFixed(2) + 'deg');
        if (Math.abs(tx - cx) > 0.05 || Math.abs(ty - cy) > 0.05) raf(loop); else run = false;
      };
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        tx = -14 + ((e.clientX - r.left) / r.width - 0.5) * 22;
        ty = 5 - ((e.clientY - r.top) / r.height - 0.5) * 14;
        if (!run) { run = true; raf(loop); }
      });
    }

    $$('.magnetic').forEach((b) => {
      b.addEventListener('pointermove', (e) => {
        const r = b.getBoundingClientRect();
        b.style.translate = `${((e.clientX - r.left) / r.width - 0.5) * 12}px ${((e.clientY - r.top) / r.height - 0.5) * 10}px`;
      });
      b.addEventListener('pointerleave', () => { b.style.translate = ''; });
    });
  } else {
    // touch / reduced-motion: gentle automatic sway of the hero stage
    const stage = $('.stage__inner');
    if (stage && !reduce) {
      let t = 0;
      const sway = () => {
        t += 0.012;
        stage.style.setProperty('--ry', (-14 + Math.sin(t) * 7).toFixed(2) + 'deg');
        stage.style.setProperty('--rx', (5 + Math.cos(t * 0.8) * 2.5).toFixed(2) + 'deg');
        raf(sway);
      };
      raf(sway);
    }
  }

  /* ------------------------------------------------------------------
     FLIP CARDS (tap on touch devices)
     ------------------------------------------------------------------ */
  $$('.flip').forEach((f) => {
    const toggle = () => f.classList.toggle('is-flipped');
    f.addEventListener('click', toggle);
    f.addEventListener('keydown', (e) => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); } });
  });

  /* ------------------------------------------------------------------
     FAQ ACCORDION
     ------------------------------------------------------------------ */
  $$('.faq__item').forEach((item) => {
    const q = $('.faq__q', item);
    q.addEventListener('click', () => {
      const open = item.classList.toggle('is-open');
      q.setAttribute('aria-expanded', String(open));
    });
  });

  /* ------------------------------------------------------------------
     3D COVERFLOW GALLERY + LIGHTBOX
     ------------------------------------------------------------------ */
  const lb = (() => {
    const el = document.createElement('div');
    el.className = 'lightbox';
    el.setAttribute('role', 'dialog');
    el.setAttribute('aria-label', 'Gallery image');
    el.innerHTML = `<button class="lb-close" aria-label="Close"><svg class="ico"><use href="#i-x"/></svg></button>
      <button class="lb-prev" aria-label="Previous"><svg class="ico"><use href="#i-arrow"/></svg></button>
      <figure><img alt=""><figcaption></figcaption></figure>
      <button class="lb-next" aria-label="Next"><svg class="ico"><use href="#i-arrow"/></svg></button>`;
    document.body.appendChild(el);
    let items = [], idx = 0;
    const img = $('img', el), cap = $('figcaption', el);
    const show = (i) => { idx = (i + items.length) % items.length; img.src = items[idx].src; img.alt = items[idx].alt; cap.textContent = items[idx].alt; };
    const open = (list, i) => { items = list; show(i); el.classList.add('is-open'); };
    const close = () => el.classList.remove('is-open');
    $('.lb-close', el).onclick = close;
    $('.lb-prev', el).onclick = () => show(idx - 1);
    $('.lb-next', el).onclick = () => show(idx + 1);
    el.addEventListener('click', (e) => { if (e.target === el) close(); });
    addEventListener('keydown', (e) => {
      if (!el.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') show(idx - 1);
      if (e.key === 'ArrowRight') show(idx + 1);
    });
    return { open };
  })();

  $$('[data-coverflow]').forEach((cf) => {
    const items = $$('.cf-item', cf);
    const dots = $('.cf-dots', cf.parentElement);
    const n = items.length;
    let active = 0, timer = null;
    const list = items.map((it) => ({ src: it.dataset.full || $('img', it).src, alt: $('img', it).alt }));
    items.forEach((_, i) => {
      if (!dots) return;
      const b = document.createElement('button');
      b.setAttribute('aria-label', `Show image ${i + 1}`);
      b.addEventListener('click', () => go(i, true));
      dots.appendChild(b);
    });
    function layout() {
      const narrow = innerWidth < 760;
      items.forEach((it, i) => {
        let off = i - active;
        if (off > n / 2) off -= n; else if (off < -n / 2) off += n;
        const a = Math.abs(off), s = Math.sign(off);
        const tx = off * (narrow ? 46 : 54);
        const tz = -a * (narrow ? 110 : 170);
        const ry = -s * Math.min(a, 2) * (narrow ? 32 : 36);
        it.style.transform = `translate(-50%,-50%) translateX(${tx}%) translateZ(${tz}px) rotateY(${ry}deg)`;
        it.style.zIndex = String(10 - a);
        it.style.opacity = a > 2 ? 0 : 1 - a * 0.18;
        it.style.filter = a === 0 ? 'none' : `brightness(${1 - a * 0.22})`;
        it.style.pointerEvents = a > 2 ? 'none' : 'auto';
        it.classList.toggle('is-active', a === 0);
      });
      if (dots) $$('button', dots).forEach((b, i) => b.setAttribute('aria-current', String(i === active)));
    }
    function go(i, user) { active = (i + n) % n; layout(); if (user) restart(); }
    function restart() { clearInterval(timer); if (!reduce) timer = setInterval(() => go(active + 1), 5200); }
    items.forEach((it, i) => it.addEventListener('click', () => { if (i === active) lb.open(list, i); else go(i, true); }));
    $('.cf-btn--prev', cf)?.addEventListener('click', () => go(active - 1, true));
    $('.cf-btn--next', cf)?.addEventListener('click', () => go(active + 1, true));
    // swipe / drag
    let sx = null;
    cf.addEventListener('pointerdown', (e) => { sx = e.clientX; });
    addEventListener('pointerup', (e) => {
      if (sx === null) return;
      const dx = e.clientX - sx; sx = null;
      if (Math.abs(dx) > 45) go(active + (dx < 0 ? 1 : -1), true);
    });
    cf.addEventListener('keydown', (e) => { if (e.key === 'ArrowLeft') go(active - 1, true); if (e.key === 'ArrowRight') go(active + 1, true); });
    cf.addEventListener('mouseenter', () => clearInterval(timer));
    cf.addEventListener('mouseleave', restart);
    addEventListener('resize', layout);
    layout(); restart();
  });

  /* ------------------------------------------------------------------
     FAQ / QUOTE FORM  ->  WhatsApp
     ------------------------------------------------------------------ */
  const form = $('[data-wa-form]');
  if (form) {
    const sel = $('select[name="service"]', form);
    const params = new URLSearchParams(location.search);
    if (sel && params.get('service')) {
      const v = Array.from(sel.options).find((o) => o.value.toLowerCase() === params.get('service').toLowerCase());
      if (v) sel.value = v.value;
    }
    $$('.chips button').forEach((c) => c.addEventListener('click', () => {
      $$('.chips button').forEach((x) => x.classList.remove('is-on'));
      c.classList.add('is-on');
      if (sel) sel.value = c.dataset.value;
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      let ok = true;
      $$('[required]', form).forEach((f) => {
        const bad = !String(f.value).trim();
        f.closest('.field').classList.toggle('has-error', bad);
        if (bad) ok = false;
      });
      if (!ok) { const first = $('.has-error input, .has-error select', form); first && first.focus(); return; }
      const lines = [
        `*Name:* ${d.name}`,
        d.company ? `*Company:* ${d.company}` : '',
        `*Phone:* ${d.phone}`,
        `*Service needed:* ${d.service}`,
        `*Pickup location:* ${d.pickup}`,
        `*Delivery destination:* ${d.delivery}`,
        d.date ? `*Preferred date:* ${d.date}` : '',
        d.cargo ? `*Cargo details:* ${d.cargo}` : '',
      ].filter(Boolean).join('\n');
      const msg = `${greeting()} ${BRAND}, I would like to request a *quote*. Details below:\n\n${lines}\n\n- Sent from ${location.hostname || 'our website'} (Contact form)`;
      const url = `https://wa.me/${WA_NUMBER}?text=${encodeURIComponent(msg)}`;
      const ok2 = $('.form-ok', form);
      if (ok2) ok2.classList.add('is-show');
      const w = window.open(url, '_blank', 'noopener');
      if (!w) location.href = url;
    });
    $$('input,select', form).forEach((f) => f.addEventListener('input', () => f.closest('.field').classList.remove('has-error')));
  }

  /* ------------------------------------------------------------------
     FLOATING WHATSAPP WIDGET
     ------------------------------------------------------------------ */
  const widget = $('[data-wa-widget]');
  const fab = widget && $('.wa-fab', widget);
  const teaser = widget && $('.wa-teaser', widget);
  function openWidget() { widget.classList.add('is-open'); fab.setAttribute('aria-expanded', 'true'); teaser && teaser.classList.remove('is-show'); }
  function closeWidget() { if (!widget) return; widget.classList.remove('is-open'); fab.setAttribute('aria-expanded', 'false'); }
  if (widget) {
    fab.addEventListener('click', () => (widget.classList.contains('is-open') ? closeWidget() : openWidget()));
    $('.wa-close', widget).addEventListener('click', closeWidget);
    document.addEventListener('click', (e) => { if (!widget.contains(e.target)) closeWidget(); });
    $$('.wa-options a', widget).forEach((a) => a.addEventListener('click', () => setTimeout(closeWidget, 200)));
    let seen = false;
    try { seen = sessionStorage.getItem('kft-teaser') === '1'; } catch (e) { /* ignore */ }
    if (!seen && teaser) {
      setTimeout(() => {
        if (widget.classList.contains('is-open')) return;
        teaser.classList.add('is-show');
        try { sessionStorage.setItem('kft-teaser', '1'); } catch (e) { /* ignore */ }
        setTimeout(() => teaser.classList.remove('is-show'), 6500);
      }, 7000);
    }
  }

  $$('[data-year]').forEach((y) => (y.textContent = new Date().getFullYear()));
})();
