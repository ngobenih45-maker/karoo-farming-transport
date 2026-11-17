/* =====================================================================
   Karoo Farming Transport — fleet3d.js
   Interactive 3D truck viewer built with pure CSS 3D transforms
   (no external libraries, works offline). Drag to rotate, zoom, view presets.
   ===================================================================== */
(() => {
  'use strict';
  const viewer = document.querySelector('[data-truck3d]');
  if (!viewer) return;

  const $ = (s, c = viewer) => c.querySelector(s);
  const $$ = (s, c = viewer) => Array.from(c.querySelectorAll(s));
  const stage = $('.viewer__stage');
  const world = $('.t3d');
  const hint = $('.viewer__hint');
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- tiny DOM helpers ---------- */
  let SC = 1; // build-time scale (used for the small 1-ton truck)
  const n = (v) => +(v * SC).toFixed(4);
  const mk = (cls, css = '', html = '') => {
    const d = document.createElement('div');
    d.className = cls;
    if (css) d.style.cssText = css;
    if (html) d.innerHTML = html;
    return d;
  };
  const group = (x = 0) => mk('b', `--x:${x};--y:0;--z:0;--bw:0;--bh:0;--bd:0;`);

  const decal = (ds, light, top = 44, left = 50) =>
    `<div class="decal${light ? ' decal--light' : ''}" style="--ds:${n(ds)};top:${top}%;left:${left}%"><b>KFT</b><i>Karoo Farming</i><u>Transport</u>${light ? '' : '<s>Safe &bull; Reliable &bull; On time</s>'}</div>`;

  /** cuboid centred at (x,y,z) metres — y is height above ground */
  function box(p) {
    const b = mk('b', `--x:${n(p.x)};--y:${n(p.y)};--z:${n(p.z || 0)};--bw:${n(p.w)};--bh:${n(p.h)};--bd:${n(p.d)};${p.c ? `--c:${p.c};` : ''}`);
    ['r', 'l', 't', 'n', 'k'].forEach((k) => {
      if (p.no && p.no.includes(k)) return;
      b.appendChild(mk(`f ${k}${p.fc && p.fc[k] ? ' ' + p.fc[k] : ''}`, '', (p.f && p.f[k]) || ''));
    });
    return b;
  }

  /** cylinder; axis 'z' (wheels) or 'x' (fuel tanks) */
  function cyl({ x, y, z = 0, axis = 'z', r, len, sides = 12, c = '#10131f', cap = 'disc' }) {
    const g = mk('b', `--x:${n(x)};--y:${n(y)};--z:${n(z)};--bw:0;--bh:0;--bd:0;`);
    const R = n(r), L = n(len);
    const tang = +(2 * R * Math.tan(Math.PI / sides) * 1.05).toFixed(4);
    for (let i = 0; i < sides; i++) {
      const th = (360 / sides) * i;
      const s = Math.sin((th * Math.PI) / 180);
      const shade = axis === 'z' ? (1 + s) / 2 : (1 - s) / 2; // darker underneath
      const a = (0.5 * shade).toFixed(2);
      const tr = axis === 'z'
        ? `rotateZ(${th}deg) translateX(calc(var(--u)*${R})) rotateY(90deg)`
        : `rotateX(${th}deg) translateZ(calc(var(--u)*${R}))`;
      g.appendChild(mk('cs',
        `--c:${c};width:calc(var(--u)*${L});height:calc(var(--u)*${tang});left:calc(var(--u)*${-L / 2});top:calc(var(--u)*${-tang / 2});transform:${tr};background-image:linear-gradient(rgba(0,0,0,${a}),rgba(0,0,0,${a}))`));
    }
    const d = `width:calc(var(--u)*${2 * R});height:calc(var(--u)*${2 * R});left:calc(var(--u)*${-R});top:calc(var(--u)*${-R});`;
    const cls = cap === 'tank' ? 'disc disc--tank' : 'disc';
    const tz = `calc(var(--u)*${L / 2})`;
    if (axis === 'z') {
      g.appendChild(mk(cls, d + `transform:translateZ(${tz})`));
      g.appendChild(mk(cls, d + `transform:rotateY(180deg) translateZ(${tz})`));
    } else {
      g.appendChild(mk(cls, d + `transform:rotateY(90deg) translateZ(${tz})`));
      g.appendChild(mk(cls, d + `transform:rotateY(-90deg) translateZ(${tz})`));
    }
    return g;
  }

  const wheel = (x, s, r = 0.52, w = 0.5) => cyl({ x, y: r, z: s * 1.0, r, len: w, sides: 12 });

  /* ---------- truck parts (front bumper at x = 0, truck extends to -x) ---------- */
  function tractor(o) {
    const g = group();
    const len = o.len || 6.0;
    g.append(
      box({ x: -len / 2 - 0.1, y: 0.95, w: len, h: 0.3, d: 1.05, c: '#141a30', no: ['n', 'k'] }),
      box({ x: -0.1, y: 0.62, w: 0.22, h: 0.5, d: 2.45, c: '#0f1429', no: ['k'] }),
      // cab
      box({ x: -1.35, y: 2.45, w: 2.5, h: 2.3, d: 2.5, c: '#f6f8ff', no: ['k'],
        fc: { r: 'liv-cab', l: 'liv-cab' },
        f: { r: decal(0.5, true, 34, 34), l: decal(0.5, true, 34, 66) } }),
      // roof deflector
      box({ x: -1.95, y: 3.88, w: 1.7, h: 0.6, d: 2.3, c: '#f6f8ff', no: ['k'] }),
      // windscreen, grille, lamps
      box({ x: -0.08, y: 2.95, w: 0.05, h: 1.0, d: 2.2, no: ['r', 'l', 't', 'k'], fc: { n: 'glass' } }),
      box({ x: -0.075, y: 1.85, w: 0.04, h: 0.55, d: 1.15, no: ['r', 'l', 't', 'k'], fc: { n: 'grille' } }),
      box({ x: -0.075, y: 1.75, z: 0.95, w: 0.04, h: 0.28, d: 0.4, c: '#fff4b8', no: ['r', 'l', 't', 'k'] }),
      box({ x: -0.075, y: 1.75, z: -0.95, w: 0.04, h: 0.28, d: 0.4, c: '#fff4b8', no: ['r', 'l', 't', 'k'] }),
      // side windows + mirrors
      box({ x: -0.75, y: 2.9, z: 1.255, w: 1.0, h: 0.8, d: 0.03, no: ['n', 'k', 't', 'l'], fc: { r: 'glass' } }),
      box({ x: -0.75, y: 2.9, z: -1.255, w: 1.0, h: 0.8, d: 0.03, no: ['n', 'k', 't', 'r'], fc: { l: 'glass' } }),
      box({ x: -0.45, y: 3.05, z: 1.42, w: 0.12, h: 0.55, d: 0.14, c: '#0f1429' }),
      box({ x: -0.45, y: 3.05, z: -1.42, w: 0.12, h: 0.55, d: 0.14, c: '#0f1429' })
    );
    // fuel tanks + wheels
    [1, -1].forEach((s) => {
      g.append(cyl({ x: -2.9, y: 0.93, z: s * 0.92, axis: 'x', r: 0.36, len: 1.5, sides: 10, c: '#c3ccdc', cap: 'tank' }));
      g.append(wheel(-0.9, s));
      (o.drive || [-4.0, -5.3]).forEach((x) => g.append(wheel(x, s)));
    });
    if (o.fifth) g.append(box({ x: -4.65, y: 1.17, w: 1.1, h: 0.1, d: 1.1, c: '#222a45' }));
    return g;
  }

  function trailer(kind, xf, L, axles, o = {}) {
    const g = group();
    const xc = xf - L / 2, xr = xf - L;
    if (o.rail !== false) g.append(box({ x: xc - 0.9, y: 0.95, w: L - 1.8, h: 0.28, d: 0.9, c: '#141a30', no: ['n', 'k'] }));

    if (kind === 'drop') {
      g.append(box({ x: xc, y: 1.2, w: L, h: 0.12, d: 2.5, c: '#0b1b5a', no: ['n', 'k'] }));
      [1, -1].forEach((s) => {
        g.append(box({
          x: xc, y: 1.91, z: s * 1.215, w: L, h: 1.3, d: 0.07, c: '#0b1b5a', no: ['n', 'k'],
          fc: s > 0 ? { r: 'liv-wall' } : { l: 'liv-wall' },
          f: s > 0 ? { r: decal(0.5) } : { l: decal(0.5) },
        }));
      });
      g.append(
        box({ x: xf - 0.05, y: 2.21, w: 0.1, h: 1.9, d: 2.5, c: '#0b1b5a', no: ['k'] }),
        box({ x: xr + 0.05, y: 1.91, w: 0.1, h: 1.3, d: 2.5, c: '#0b1b5a', no: ['n'] })
      );
    } else {
      g.append(
        box({ x: xc, y: 1.2, w: L - 0.2, h: 0.14, d: 1.6, c: '#10162f', no: ['n', 'k'] }),
        box({ x: xc, y: 1.78, w: L - 0.3, h: 0.85, d: 2.0, c: '#0b1b5a', no: ['t'] }),
        box({
          x: xc, y: 2.85, w: L - 0.1, h: 1.3, d: 2.5, c: '#0b1b5a',
          fc: { r: 'liv-wall', l: 'liv-wall' }, f: { r: decal(0.5), l: decal(0.5) },
        })
      );
    }

    // fenders, wheels, rear marker
    const cx = (Math.max(...axles) + Math.min(...axles)) / 2;
    const span = Math.max(...axles) - Math.min(...axles) + 1.5;
    [1, -1].forEach((s) => {
      g.append(box({ x: cx, y: 1.13, z: s * 1.0, w: span, h: 0.1, d: 0.7, fc: { t: 'fender', r: 'fender', l: 'fender' }, c: '#0b1b5a', no: ['n', 'k'] }));
      if (o.wheels !== false) axles.forEach((x) => g.append(wheel(x, s)));
    });
    if (o.last) {
      g.append(
        box({ x: xr - 0.04, y: 0.8, w: 0.06, h: 0.45, d: 2.3, no: ['r', 'l', 't'], fc: { k: 'chev' } }),
        box({ x: xr - 0.03, y: 1.12, z: 1.0, w: 0.05, h: 0.2, d: 0.25, c: '#e11d2a', no: ['r', 'l', 't', 'n'] }),
        box({ x: xr - 0.03, y: 1.12, z: -1.0, w: 0.05, h: 0.2, d: 0.25, c: '#e11d2a', no: ['r', 'l', 't', 'n'] })
      );
    }
    return g;
  }

  const interlink = (kind) => {
    const g = group();
    g.append(
      tractor({ fifth: true }),
      trailer(kind, -3.9, 7.2, [-10.1, -8.75]),
      box({ x: -11.3, y: 0.95, w: 0.5, h: 0.28, d: 0.7, c: '#141a30' }),
      box({ x: -11.3, y: 1.2, w: 0.5, h: 0.12, d: 1.4, c: '#10162f', no: ['n', 'k'] }),
      trailer(kind, -11.5, 7.6, [-18.1, -16.75, -15.4], { last: true })
    );
    return g;
  };
  const rigid = (bodyL, drive, len) => {
    const g = group();
    g.append(
      tractor({ len, drive }),
      trailer('drop', -3.8, bodyL, drive, { rail: false, wheels: false, last: true })
    );
    return g;
  };

  /* ---------- variants ---------- */
  const VARIANTS = {
    tipper: {
      name: '32-Ton Side-Tipper Interlink', len: 19.1, scale: 1,
      desc: 'Our flagship bulk hauler: a premium tractor coupled to two side-tipping trailers for fast, clean off-loading of bulk produce, feed and aggregates.',
      specs: [['Payload', 'Up to 32 tons'], ['Configuration', 'Tractor + interlink trailers'], ['Body', 'Side-tipping tub'], ['Best for', 'Bulk loads & agriculture']],
      build: () => interlink('tipper'),
    },
    drop: {
      name: '32-Ton Drop-Side Interlink', len: 19.1, scale: 1,
      desc: 'A tri-axle drop-side interlink for general cargo, machinery and building materials, with side access for quick loading and off-loading.',
      specs: [['Payload', 'Up to 32 tons'], ['Configuration', 'Tractor + interlink trailers'], ['Body', 'Drop-side deck'], ['Best for', 'General cargo & machinery']],
      build: () => interlink('drop'),
    },
    medium: {
      name: '8-Ton Medium Truck', len: 9.4, scale: 1,
      desc: 'A tri-axle drop-side rigid for retail stock, building materials, furniture and mid-sized loads, delivered locally or long-distance.',
      specs: [['Payload', 'Up to 8 tons'], ['Configuration', 'Tri-axle rigid'], ['Body', 'Drop-side'], ['Best for', 'Stock, furniture, materials']],
      build: () => rigid(5.6, [-7.0, -8.3], 9.3),
    },
    light: {
      name: '1-Ton Light Delivery', len: 7.4, scale: 0.62,
      desc: 'Quick, flexible local runs for small parcels, documents and urgent deliveries when a full truck is not required.',
      specs: [['Payload', 'Up to 1 ton'], ['Configuration', 'Light rigid'], ['Body', 'Drop-side'], ['Best for', 'Parcels & local runs']],
      build: () => rigid(3.3, [-5.4], 7.4),
    },
  };

  /* ---------- state ---------- */
  let az = -32, el = -16, zoom = 1, spin = !reduce, dragging = false;
  let tween = null, resumeAt = 0, variant = null, extent = 20, visible = true, lastT = performance.now();

  const apply = () => { world.style.transform = `rotateX(${el.toFixed(2)}deg) rotateY(${az.toFixed(2)}deg)`; };
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

  function fit() {
    const w = stage.clientWidth || 600;
    const fitU = (w * 0.97) / (extent + 2);
    const u = clamp(fitU, 9, 54) * zoom * (w < 520 ? 1.18 : 1);
    world.style.setProperty('--u', u.toFixed(2) + 'px');
  }

  function setVariant(key, animate = true) {
    const v = VARIANTS[key];
    if (!v) return;
    variant = key;
    SC = v.scale;
    world.innerHTML = '';
    const wrap = group(+((v.len * v.scale) / 2).toFixed(3));
    wrap.appendChild(v.build());
    extent = v.len * v.scale;
    const D = extent + 4.5;
    world.appendChild(mk('ground', `width:calc(var(--u)*${D});height:calc(var(--u)*${D});left:calc(var(--u)*${-D / 2});top:calc(var(--u)*${-D / 2});`));
    world.appendChild(wrap);
    SC = 1;
    fit();
    if (animate) { world.classList.remove('is-swap'); void world.offsetWidth; world.classList.add('is-swap'); }

    // info panel
    $$('[data-variant]').forEach((b) => b.setAttribute('aria-selected', String(b.dataset.variant === key)));
    const t = $('[data-v-title]'); if (t) t.textContent = v.name;
    const d = $('[data-v-desc]'); if (d) d.textContent = v.desc;
    const s = $('[data-v-specs]');
    if (s) s.innerHTML = v.specs.map(([a, b]) => `<div><dt>${a}</dt><dd>${b}</dd></div>`).join('');
    const wa = $('[data-v-wa]'); if (wa) wa.dataset.wa = `fleet:${v.name}`;
  }

  /* ---------- animation loop ---------- */
  function frame(t) {
    const dt = Math.min(0.05, (t - lastT) / 1000);
    lastT = t;
    if (visible && !document.hidden) {
      if (tween) {
        const dA = ((tween.az - az + 540) % 360) - 180;
        az += dA * 0.12; el += (tween.el - el) * 0.12;
        if (Math.abs(dA) < 0.3 && Math.abs(tween.el - el) < 0.3) { az = tween.az; el = tween.el; tween = null; resumeAt = t + 2500; }
        apply();
      } else if (spin && !dragging && t > resumeAt) {
        az += dt * 14;
        apply();
      }
    }
    requestAnimationFrame(frame);
  }

  /* ---------- interaction ---------- */
  let lx = 0, ly = 0;
  const hideHint = () => hint && hint.classList.add('is-hidden');
  stage.addEventListener('pointerdown', (e) => {
    if (e.target.closest('button')) return;
    dragging = true; tween = null; lx = e.clientX; ly = e.clientY;
    stage.setPointerCapture && stage.setPointerCapture(e.pointerId);
    hideHint();
  });
  stage.addEventListener('pointermove', (e) => {
    if (!dragging) return;
    az += (e.clientX - lx) * 0.55;
    el = clamp(el - (e.clientY - ly) * 0.3, -88, 0);
    lx = e.clientX; ly = e.clientY;
    apply();
  });
  const endDrag = () => { if (dragging) { dragging = false; resumeAt = performance.now() + 2500; } };
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') { az -= 8; apply(); }
    if (e.key === 'ArrowRight') { az += 8; apply(); }
  });

  const VIEWS = { side: { az: 0, el: -6 }, front: { az: -90, el: -6 }, rear: { az: 90, el: -6 }, top: { az: 0, el: -84 }, angle: { az: -32, el: -16 } };
  $$('[data-view]').forEach((b) => b.addEventListener('click', () => { tween = VIEWS[b.dataset.view]; hideHint(); }));
  $$('[data-zoom]').forEach((b) => b.addEventListener('click', () => {
    zoom = clamp(zoom * (b.dataset.zoom === 'in' ? 1.25 : 0.8), 0.6, 2.6); fit();
  }));
  const spinBtn = $('[data-spin]');
  if (spinBtn) {
    spinBtn.setAttribute('aria-pressed', String(spin));
    spinBtn.addEventListener('click', () => { spin = !spin; spinBtn.setAttribute('aria-pressed', String(spin)); });
  }
  $$('[data-variant]').forEach((b) => b.addEventListener('click', () => setVariant(b.dataset.variant)));

  new IntersectionObserver((en) => { visible = en[0].isIntersecting; }, { threshold: 0.05 }).observe(stage);
  new ResizeObserver(fit).observe(stage);

  setVariant('tipper', false);
  apply();
  requestAnimationFrame(frame);
})();
