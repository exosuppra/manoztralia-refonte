/* Manoztralia — concept de refonte · motion & interactions */
(() => {
  'use strict';

  const root = document.documentElement;
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => [...c.querySelectorAll(s)];

  // Without GSAP the page stays a plain, fully readable document.
  if (!window.gsap || !window.ScrollTrigger) { root.className = 'no-js'; return; }
  gsap.registerPlugin(ScrollTrigger);
  ScrollTrigger.config({ ignoreMobileResize: true });

  // The page opens with a boarding sequence: always start from the top.
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  scrollTo(0, 0);

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const lerp = (a, b, t) => a + (b - a) * t;
  const CLEAR = 'transform,opacity,visibility';

  /* ------------------------------------------------------------------ */
  /* Text splitting (words / chars wrapped in overflow masks)            */
  /* ------------------------------------------------------------------ */
  function split(el, mode = 'words') {
    if (mode === 'chars' && !el.hasAttribute('aria-hidden')) el.setAttribute('aria-label', el.textContent.replace(/s+/g, ' ').trim());
    const walk = node => {
      [...node.childNodes].forEach(n => {
        if (n.nodeType === 3) {
          const frag = document.createDocumentFragment();
          n.textContent.split(/([ \n\t]+)/).forEach(part => {
            if (!part) return;
            if (/^[ \n\t]+$/.test(part)) { frag.append(' '); return; }
            const w = document.createElement('span'); w.className = 'w';
            const wi = document.createElement('span'); wi.className = 'wi';
            if (mode === 'chars') {
              [...part].forEach(ch => { const c = document.createElement('span'); c.className = 'c'; c.textContent = ch; wi.append(c); });
            } else wi.textContent = part;
            w.append(wi); frag.append(w);
          });
          n.replaceWith(frag);
        } else if (n.nodeType === 1 && !n.matches('svg, img, br, .nosplit')) walk(n);
      });
    };
    walk(el);
    return $$(mode === 'chars' ? '.c' : '.wi', el);
  }

  /* ------------------------------------------------------------------ */
  /* Smooth scroll                                                       */
  /* ------------------------------------------------------------------ */
  let lenis = null;
  if (!reduce && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add(t => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  }
  const go = target => {
    if (lenis) lenis.scrollTo(target, { duration: 1.5 });
    else if (typeof target === 'number') scrollTo({ top: target });
    else target.scrollIntoView();
  };

  /* ------------------------------------------------------------------ */
  /* Hero — the plane window that opens onto Sydney                      */
  /* ------------------------------------------------------------------ */
  const pin = $('.hero__pin'), slot = $('.hero__slot'), mover = $('.hero__mover'), heroImg = $('.hero__img');
  const PHOTO = { ratio: 3 / 4, x: 0.54, y: 0.42 };   // portrait picture; where the opera sits in it
  const FOCAL = { x: 0.5, y: 0.36 };                  // where the opera should land once full-bleed
  const BLEED = 0.04;
  const hero = { p: 0 };
  let geo = null;

  function measureHero() {
    const W = pin.clientWidth, H = pin.clientHeight, clamp = gsap.utils.clamp;
    const l = slot.offsetLeft, t = slot.offsetTop, w = slot.offsetWidth, h = slot.offsetHeight;
    // lay the picture out so it covers the viewport (plus a little bleed) with the opera on the focal point
    const k = Math.max((1 + 2 * BLEED) * W / 3, (1 + 2 * BLEED) * H / 4), iw = 3 * k, ih = 4 * k;
    const left = clamp(W * (1 + BLEED) - iw, -W * BLEED, W * FOCAL.x - PHOTO.x * iw);
    const top = clamp(H * (1 + BLEED) - ih, -H * BLEED, H * FOCAL.y - PHOTO.y * ih);
    Object.assign(heroImg.style, { width: iw + 'px', height: ih + 'px', left: left + 'px', top: top + 'px' });
    const fx = left + PHOTO.x * iw, fy = top + PHOTO.y * ih;
    // smallest zoom that still fills the window when the opera is centred in it
    const need = Math.max(h / 2 / (fy - top), h / 2 / (top + ih - fy), w / 2 / (fx - left), w / 2 / (left + iw - fx));
    geo = { t, l, r: W - l - w, b: H - t - h, rad: w * 0.48, dx: l + w / 2 - fx, dy: t + h / 2 - fy, zoom: Math.min(1, need * 1.2) };
    mover.style.transformOrigin = fx + 'px ' + fy + 'px';
  }
  function renderHero() {
    if (!geo) return;
    const q = 1 - hero.p, s = pin.style;
    s.setProperty('--t', geo.t * q + 'px');
    s.setProperty('--r', geo.r * q + 'px');
    s.setProperty('--b', geo.b * q + 'px');
    s.setProperty('--l', geo.l * q + 'px');
    s.setProperty('--rad', geo.rad * q + 'px');
    s.setProperty('--q', q);
    mover.style.transform = 'translate3d(' + geo.dx * q + 'px,' + geo.dy * q + 'px,0) scale(' + (1 - (1 - geo.zoom) * q) + ')';
  }
  measureHero(); renderHero();

  const heroWords = split($('.hero__title'));
  const heroBWords = split($('.hero__b-title'));
  const scribble = $('.scribble path');
  scribble.setAttribute('pathLength', 1);
  gsap.set(scribble, { strokeDasharray: 1, strokeDashoffset: 1 });

  const heroTl = gsap.timeline({
    defaults: { ease: 'none' },
    scrollTrigger: {
      trigger: '.hero', start: 'top top', end: () => '+=' + innerHeight * 1.7,
      pin, scrub: reduce ? true : 0.7, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 2,
      onRefresh: () => { measureHero(); renderHero(); }
    }
  });
  heroTl
    .to(hero, { p: 1, duration: 0.72, ease: 'power2.inOut', onUpdate: renderHero }, 0)
    .to('.hero__a', { yPercent: -8, autoAlpha: 0, duration: 0.3, ease: 'power1.in' }, 0.03)
    .fromTo(['.badge', '.hero__seat', '.hero__scroll'], { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.12, immediateRender: false }, 0)
    .fromTo('.hero__ring', { autoAlpha: 1 }, { autoAlpha: 0, duration: 0.2, immediateRender: false }, 0.5)
    .to('.hero__veil', { opacity: 1, duration: 0.3 }, 0.42)
    .from('.hero__b-eyebrow', { autoAlpha: 0, y: 20, duration: 0.12 }, 0.6)
    .from(heroBWords, { yPercent: 165, duration: 0.2, stagger: 0.035, ease: 'power3.out' }, 0.6)
    .from('.hero__chips li', { autoAlpha: 0, y: 24, duration: 0.12, stagger: 0.022, ease: 'power2.out' }, 0.76)
    .to({}, { duration: 0.06 });

  if (fine && !reduce) {
    const dx = gsap.quickTo('.hero__drift', 'x', { duration: 1.2, ease: 'power3' });
    const dy = gsap.quickTo('.hero__drift', 'y', { duration: 1.2, ease: 'power3' });
    pin.addEventListener('pointermove', e => {
      dx((e.clientX / innerWidth - 0.5) * -24);
      dy((e.clientY / innerHeight - 0.5) * -18);
    });
  }

  function heroIntro() {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.from(heroWords, { yPercent: 150, rotate: 5, duration: 1.4, stagger: 0.08 }, 0)
      .from('.hero__eyebrow', { y: 20, autoAlpha: 0, duration: 1 }, 0.25)
      .from(['.hero__ring', '.hero__stage'], { y: 70, autoAlpha: 0, duration: 1.4 }, 0.1)
      .to('.hero__shade', { yPercent: -101, duration: 1.6, ease: 'expo.inOut' }, 0.5)
      .to(scribble, { strokeDashoffset: 0, duration: 1.1, ease: 'power3.inOut' }, 0.95)
      .from(['.hero__lead', '.hero__cta > *'], { y: 26, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.7)
      .from('.hero__trust li', { y: 22, autoAlpha: 0, duration: 1.1, stagger: 0.08 }, 0.9)
      .from('.badge', { scale: 0, rotate: -140, duration: 1.3, ease: 'back.out(1.5)' }, 1.05)
      .from(['.hero__seat', '.hero__scroll'], { autoAlpha: 0, duration: 1 }, 1.4)
      .from('.nav', { yPercent: -130, duration: 1.2, clearProps: 'all' }, 0.6)
      .add(() => lenis && lenis.start(), 1.1);
    return tl;
  }

  /* ------------------------------------------------------------------ */
  /* Loader                                                              */
  /* ------------------------------------------------------------------ */
  (function loader() {
    const el = $('.loader');
    const pct = $('.loader__pct b'), fill = $('.loader__fill'), plane = $('.loader__plane'), status = $('.loader__status');
    const words = ['Passeport', 'Visa', 'Crème solaire', 'Tongs', 'Décollage'];
    const o = { v: 0 };
        const ready = Promise.race([
      Promise.all([document.fonts ? document.fonts.ready : 0, heroImg.complete ? 0 : new Promise(r => { heroImg.onload = heroImg.onerror = r; })]),
      new Promise(r => setTimeout(r, 4500))
    ]);
    gsap.set(el, { clipPath: 'inset(0% 0% 0% 0%)' });
    gsap.to(o, {
      v: 100, duration: reduce ? 0.5 : 2.2, ease: 'power2.inOut',
      onUpdate() {
        pct.textContent = Math.round(o.v);
        fill.style.transform = `scaleX(${o.v / 100})`;
        plane.style.left = o.v + '%';
        status.textContent = words[Math.min(words.length - 1, Math.floor(o.v / 100 * words.length))];
      },
      onComplete: () => ready.then(() => {
        ScrollTrigger.refresh();
        gsap.timeline()
          .to(['.loader__top', '.loader__route', '.loader__bottom'], { y: -50, autoAlpha: 0, duration: 0.55, ease: 'power3.in', stagger: 0.06 }, 0.1)
          .to(el, { clipPath: 'inset(0% 0% 100% 0%)', duration: 1.1, ease: 'expo.inOut' }, 0.45)
          .add(heroIntro(), 0.75)
          .set(el, { display: 'none' }, 1.6);
      })
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Generic reveals                                                     */
  /* ------------------------------------------------------------------ */
  $$('[data-reveal="words"]').forEach(el => {
    gsap.from(split(el), {
      yPercent: 150, duration: 1.15, ease: 'expo.out', stagger: 0.05,
      scrollTrigger: { trigger: el, start: 'top 88%', once: true }
    });
  });
  $$('[data-reveal="chars"]').forEach(el => {
    gsap.from(split(el, 'chars'), {
      yPercent: 165, duration: 1.1, ease: 'expo.out', stagger: 0.022,
      scrollTrigger: { trigger: el, start: 'top 84%', once: true }
    });
  });
  $$('[data-reveal="fade"]').forEach(el => {
    gsap.from(el, {
      y: 36, autoAlpha: 0, duration: 1.15, ease: 'power3.out', clearProps: CLEAR,
      scrollTrigger: { trigger: el, start: 'top 90%', once: true }
    });
  });
  $$('[data-reveal="img"]').forEach(el => {
    const st = { trigger: el, start: 'top 90%', once: true };
    gsap.fromTo(el, { clipPath: 'inset(100% 0% 0% 0% round 26px)' }, { clipPath: 'inset(0% 0% 0% 0% round 26px)', duration: 1.5, ease: 'expo.out', scrollTrigger: st });
    gsap.from($('img', el), { scale: 1.4, duration: 1.9, ease: 'expo.out', clearProps: 'transform', scrollTrigger: st });
  });
  $$('.label').forEach(el => {
    if (el.closest('.hero')) return;
    gsap.from(el, { x: -24, autoAlpha: 0, duration: 1, ease: 'power3.out', scrollTrigger: { trigger: el, start: 'top 92%', once: true } });
  });

  // numbers that count up
  $$('[data-count]').forEach(el => {
    const end = +el.dataset.count, dec = +(el.dataset.decimals || 0), o = { v: 0 };
    const fmt = v => v.toLocaleString('fr-FR', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    gsap.to(o, {
      v: end, duration: 2.2, ease: 'power3.out',
      onStart: () => { el.textContent = fmt(0); }, onUpdate: () => { el.textContent = fmt(o.v); },
      scrollTrigger: { trigger: el, start: 'top 92%', once: true }
    });
  });

  // parallax drift
  if (!reduce) $$('[data-float]').forEach(el => {
    gsap.to(el, { y: +el.dataset.float, ease: 'none', scrollTrigger: { trigger: el.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  });

  /* ------------------------------------------------------------------ */
  /* Manifesto — words light up as you read                              */
  /* ------------------------------------------------------------------ */
  (function manifesto() {
    const el = $('[data-scrub-words]');
    split(el);
    const tl = gsap.timeline({ scrollTrigger: { trigger: el, start: 'top 80%', end: 'bottom 55%', scrub: 0.6 } });
    $$('.wi, .pill-img', el).forEach((it, i) => {
      if (it.classList.contains('pill-img')) tl.fromTo(it, { scale: 0, rotate: -14 }, { scale: 1, rotate: 0, duration: 4, ease: 'back.out(2.2)' }, i);
      else tl.fromTo(it, { opacity: 0.13 }, { opacity: 1, duration: 2.4, ease: 'none' }, i);
    });

    $$('.stat').forEach((s, i) => {
      gsap.timeline({ scrollTrigger: { trigger: '.stats', start: 'top 86%', once: true } })
        .fromTo(s, { '--line': 0 }, { '--line': 1, duration: 1.4, ease: 'expo.out' }, i * 0.1)
        .from(s.children, { y: 34, autoAlpha: 0, duration: 1.1, stagger: 0.08, ease: 'power3.out' }, i * 0.1 + 0.1);
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Manon                                                               */
  /* ------------------------------------------------------------------ */
  (function manon() {
    gsap.from('.manon__photo', { yPercent: 10, autoAlpha: 0, duration: 1.6, ease: 'expo.out', scrollTrigger: { trigger: '.manon', start: 'top 55%', once: true } });
    gsap.from(['.manon__note', '.sticker'], { scale: 0, autoAlpha: 0, duration: 1, ease: 'back.out(1.8)', stagger: 0.13, scrollTrigger: { trigger: '.manon', start: 'top 30%', once: true } });
    gsap.to('.tl__line span', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: '.tl', start: 'top 68%', end: 'bottom 62%', scrub: 0.4 } });
    $$('.tl__item').forEach(it => {
      ScrollTrigger.create({ trigger: it, start: 'top 68%', onEnter: () => it.classList.add('is-on'), onLeaveBack: () => it.classList.remove('is-on') });
      gsap.from(it.children, { x: 36, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: it, start: 'top 86%', once: true } });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Visas — boarding passes                                             */
  /* ------------------------------------------------------------------ */
  (function visas() {
    gsap.timeline({ scrollTrigger: { trigger: '.tickets', start: 'top 80%', once: true } })
      .from('.ticket-wrap--l', { xPercent: -70, rotation: -16, autoAlpha: 0, duration: 1.6, ease: 'expo.out' }, 0)
      .from('.ticket-wrap--r', { xPercent: 70, rotation: 16, autoAlpha: 0, duration: 1.6, ease: 'expo.out' }, 0.12)
      .from('.stamp', { scale: 3.4, rotation: 34, autoAlpha: 0, duration: 0.45, ease: 'power4.in' }, 1)
      .to('.stamp', { scale: 1.07, duration: 0.09, yoyo: true, repeat: 1, ease: 'power1.out' })
      .to('.tickets', { y: 5, duration: 0.07, yoyo: true, repeat: 1 }, '<');

    if (fine && !reduce) $$('[data-tilt]').forEach(el => {
      gsap.set(el, { transformPerspective: 1300 });
      const rx = gsap.quickTo(el, 'rotationX', { duration: 0.7, ease: 'power3' });
      const ry = gsap.quickTo(el, 'rotationY', { duration: 0.7, ease: 'power3' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        ry(((e.clientX - r.left) / r.width - 0.5) * 9);
        rx(((e.clientY - r.top) / r.height - 0.5) * -7);
      });
      el.addEventListener('pointerleave', () => { rx(0); ry(0); });
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Programmes — list with a picture that follows the cursor            */
  /* ------------------------------------------------------------------ */
  (function programmes() {
    const list = $('.plist'), rows = $$('.prow'), box = $('.pfloat'), inner = $('.pfloat__in');
    gsap.from(rows, { y: 56, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: list, start: 'top 86%', once: true } });
    if (!fine) return;

    let imgs = [];
    const load = () => { if (!imgs.length) imgs = rows.map(r => { const im = new Image(); im.alt = ''; im.src = r.dataset.img; inner.append(im); return im; }); };
    ScrollTrigger.create({ trigger: '.progs', start: 'top bottom', once: true, onEnter: load });
    const fx = gsap.quickTo(box, 'x', { duration: 0.55, ease: 'power3' });
    const fy = gsap.quickTo(box, 'y', { duration: 0.55, ease: 'power3' });
    const rot = gsap.quickTo(box, 'rotation', { duration: 0.8, ease: 'power3' });
    let px = 0, calm;
    gsap.set(box, { scale: 0.6 });
    list.addEventListener('pointermove', e => { fx(e.clientX); fy(e.clientY); rot(gsap.utils.clamp(-14, 14, (e.clientX - px) * 0.6)); px = e.clientX; clearTimeout(calm); calm = setTimeout(() => rot(0), 110); });
    list.addEventListener('pointerenter', e => { load(); px = e.clientX; gsap.set(box, { x: e.clientX, y: e.clientY }); gsap.to(box, { autoAlpha: 1, scale: 1, duration: 0.5, ease: 'power3.out' }); });
    list.addEventListener('pointerleave', () => { gsap.to(box, { autoAlpha: 0, scale: 0.6, duration: 0.4, ease: 'power3.in' }); rot(0); });
    rows.forEach((r, i) => r.addEventListener('pointerenter', () => imgs.forEach((im, j) => im.classList.toggle('is-on', i === j))));
  })();

  /* ------------------------------------------------------------------ */
  /* Destinations — map of Australia + horizontal journey                */
  /* ------------------------------------------------------------------ */
  (function destinations() {
    // Simplified coastline (lon, lat), clockwise from Cape York.
    const COAST = [[142.5,-10.7],[143.5,-12.6],[143.8,-14.3],[145.3,-15],[145.8,-16.9],[146.4,-18.9],[148.6,-20.2],[149.3,-21.2],[150.8,-22.6],[151,-23.6],[152.5,-24.9],[153.2,-25.9],[153.2,-27.4],[153.6,-28.6],[153.1,-30.4],[152.5,-32.2],[151.3,-33.8],[150.8,-35.2],[150,-36.9],[149.9,-37.5],[147.9,-38],[146.4,-39.1],[145.1,-38.4],[144.9,-37.9],[143.5,-38.8],[141.6,-38.4],[140.3,-37.8],[139.7,-36.8],[139.3,-35.6],[138.4,-35.6],[138.5,-34.8],[138,-34.2],[137.7,-35.1],[136.9,-35.2],[137.5,-33.9],[137.8,-32.6],[137,-33.7],[135.9,-34.8],[135.2,-34.4],[134.2,-32.8],[133.4,-32.1],[131.2,-31.5],[129,-31.7],[126.2,-32.3],[124,-33],[123.4,-33.9],[120,-33.9],[118,-35],[116,-34.8],[115.1,-34.3],[115,-33.6],[115.7,-33.2],[115.7,-32],[115,-30.5],[114.6,-28.8],[114.1,-27.3],[113.5,-26.1],[113.5,-24.9],[113.7,-23.5],[113.9,-22],[114.9,-21.6],[116.7,-20.6],[118.6,-20.3],[120.9,-19.6],[122.2,-18],[122.9,-16.8],[123.6,-17.3],[124.4,-16.3],[125.2,-15],[126.9,-13.9],[128.1,-14.9],[129.6,-14.9],[129.7,-13.4],[130.8,-12.4],[132.6,-12.1],[132.7,-11.2],[135.2,-12.2],[136.9,-12.2],[136,-13.7],[135.5,-14.9],[137,-15.8],[139,-16.9],[140.9,-17.5],[141.4,-16],[141.7,-13.9],[141.9,-12.5],[142.2,-11]];
    const TAS = [[144.7,-40.7],[146.4,-41.2],[148.3,-40.9],[148.3,-42.2],[147.9,-43.2],[146.8,-43.6],[146,-43.5],[145.2,-42.2]];
    const proj = ([lon, lat]) => [(lon - 112.4) * 10.2, (-lat - 9.4) * 11.4];
    const smooth = pts => {
      const n = pts.length, f = v => v.toFixed(1);
      let d = `M${f(pts[0][0])},${f(pts[0][1])}`;
      for (let i = 0; i < n; i++) {
        const p0 = pts[(i - 1 + n) % n], p1 = pts[i], p2 = pts[(i + 1) % n], p3 = pts[(i + 2) % n];
        d += `C${f(p1[0] + (p2[0] - p0[0]) / 6)},${f(p1[1] + (p2[1] - p0[1]) / 6)} ${f(p2[0] - (p3[0] - p1[0]) / 6)},${f(p2[1] - (p3[1] - p1[1]) / 6)} ${f(p2[0])},${f(p2[1])}`;
      }
      return d + 'Z';
    };
    const svg = $('.ozmap'), NS = 'http://www.w3.org/2000/svg';
    const make = (tag, attrs, parent = svg) => { const n = document.createElementNS(NS, tag); Object.entries(attrs).forEach(([k, v]) => n.setAttribute(k, v)); parent.append(n); return n; };
    const land = make('path', { class: 'land', d: smooth(COAST.map(proj)) + smooth(TAS.map(proj)) });

    const cities = $$('.city[data-city]');
    const pins = cities.map(c => {
      const [x, y] = proj([+c.dataset.lon, +c.dataset.lat]);
      const g = make('g', {});
      make('circle', { class: 'pin-ring', cx: x, cy: y, r: 7 }, g);
      make('circle', { class: 'pin', cx: x, cy: y, r: 4.6 }, g);
      return g;
    });
    const idx = $('.dest__idx'), name = $('.dest__city');
    let current = -1;
    const setCity = i => {
      if (i === current) return; current = i;
      idx.textContent = String(i + 1).padStart(2, '0');
      name.textContent = $('h3', cities[i]).textContent;
      pins.forEach((p, j) => p.classList.toggle('is-on', i === j));
      if (!reduce) gsap.fromTo(name, { yPercent: 60, autoAlpha: 0 }, { yPercent: 0, autoAlpha: 1, duration: 0.5, ease: 'power3.out' });
    };
    setCity(0);

    // the coastline draws itself
    const len = land.getTotalLength();
    gsap.fromTo(land, { strokeDasharray: len, strokeDashoffset: len, fillOpacity: 0 }, { strokeDashoffset: 0, fillOpacity: 1, duration: 2.6, ease: 'power2.inOut', scrollTrigger: { trigger: '.dest', start: 'top 60%', once: true } });
    gsap.from(pins, { scale: 0, transformOrigin: 'center', duration: 0.7, ease: 'back.out(3)', stagger: 0.09, delay: 1.2, scrollTrigger: { trigger: '.dest', start: 'top 60%', once: true } });
    gsap.from('.city', { y: 110, autoAlpha: 0, duration: 1.4, ease: 'expo.out', stagger: 0.09, scrollTrigger: { trigger: '.dest', start: 'top 55%', once: true } });

    const mm = gsap.matchMedia();
    mm.add('(min-width: 901px)', () => {
      const track = $('.dest__track');
      const dist = () => Math.max(0, track.scrollWidth - innerWidth);
      const tw = gsap.to(track, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: { trigger: '.dest', start: 'top top', end: () => '+=' + dist(), pin: '.dest__pin', scrub: reduce ? true : 0.6, anticipatePin: 1, invalidateOnRefresh: true, refreshPriority: 1 }
      });
      cities.forEach((c, i) => {
        ScrollTrigger.create({ trigger: c, containerAnimation: tw, start: 'left 52%', end: 'right 52%', onToggle: s => s.isActive && setCity(i) });
        gsap.fromTo($('.city__img', c), { xPercent: -9 }, { xPercent: 9, ease: 'none', scrollTrigger: { trigger: c, containerAnimation: tw, start: 'left right', end: 'right left', scrub: true } });
      });
    });
    mm.add('(max-width: 900px)', () => {
      const vp = $('.dest__viewport');
      const onScroll = () => {
        const mid = vp.scrollLeft + vp.clientWidth / 2;
        let best = 0, bd = Infinity;
        cities.forEach((c, i) => { const d = Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid); if (d < bd) { bd = d; best = i; } });
        setCity(best);
      };
      vp.addEventListener('scroll', onScroll, { passive: true });
      return () => vp.removeEventListener('scroll', onScroll);
    });
  })();

  /* ------------------------------------------------------------------ */
  /* Flight plan — a dashed route drawn on scroll, a plane riding it     */
  /* ------------------------------------------------------------------ */
  (function flight() {
    const map = $('.flight__map'), svg = $('.flight__svg'), plane = $('.flight__plane');
    const paths = $$('path', svg), route = $('.flight__path'), reveal = $('.flight__reveal');
    const steps = $$('.step'), dots = $$('.step__dot');
    const state = { p: 0 };
    let len = 0, marks = [];

    function build() {
      const r0 = map.getBoundingClientRect(), W = r0.width, H = r0.height;
      svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
      const pts = dots.map(d => { const r = d.getBoundingClientRect(); return [r.left - r0.left + r.width / 2, r.top - r0.top + r.height / 2]; });
      const all = [[W / 2, -6], ...pts, [W / 2, H + 6]];
      let d = `M${all[0][0]},${all[0][1]}`;
      for (let i = 1; i < all.length; i++) {
        const [x0, y0] = all[i - 1], [x1, y1] = all[i], my = (y0 + y1) / 2;
        d += ` C${x0},${my} ${x1},${my} ${x1},${y1}`;
      }
      paths.forEach(p => p.setAttribute('d', d));
      len = route.getTotalLength();
      reveal.style.strokeDasharray = len;
      // length along the route at which each step is reached (route is monotonic in y)
      marks = pts.map(([, y]) => {
        let a = 0, b = len;
        for (let k = 0; k < 22; k++) { const m = (a + b) / 2; if (route.getPointAtLength(m).y < y) a = m; else b = m; }
        return a;
      });
      render();
    }
    function render() {
      if (!len) return;
      const l = len * state.p;
      reveal.style.strokeDashoffset = len - l;
      const a = route.getPointAtLength(Math.max(0, l - 2)), b = route.getPointAtLength(Math.min(len, l + 2));
      plane.style.transform = `translate3d(${(a.x + b.x) / 2}px,${(a.y + b.y) / 2}px,0) rotate(${Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI}deg)`;
      plane.style.opacity = state.p > 0.004 && state.p < 0.996 ? 1 : 0;
      steps.forEach((s, i) => s.classList.toggle('is-on', l >= marks[i] - 6));
    }
    build();
    ScrollTrigger.addEventListener('refresh', build);
    gsap.to(state, { p: 1, ease: 'none', onUpdate: render, scrollTrigger: { trigger: map, start: 'top 60%', end: 'bottom 62%', scrub: 0.5 } });
  })();

  /* ------------------------------------------------------------------ */
  /* Services, reviews, blog                                             */
  /* ------------------------------------------------------------------ */
  $$('.svc').forEach(el => {
    const set = e => { const r = el.getBoundingClientRect(); el.style.setProperty('--mx', e.clientX - r.left + 'px'); el.style.setProperty('--my', e.clientY - r.top + 'px'); };
    el.addEventListener('pointerenter', set); el.addEventListener('pointerleave', set);
  });
  gsap.from('.svc', { y: 80, autoAlpha: 0, rotation: 4, duration: 1.3, ease: 'expo.out', stagger: 0.1, clearProps: CLEAR, scrollTrigger: { trigger: '.bento', start: 'top 84%', once: true } });
  gsap.from('.avis__stars i', { scale: 0, rotation: -200, duration: 0.9, ease: 'back.out(2.4)', stagger: 0.09, scrollTrigger: { trigger: '.avis__score', start: 'top 80%', once: true } });
  gsap.from('.marquee--cards', { y: 70, autoAlpha: 0, duration: 1.3, ease: 'expo.out', stagger: 0.14, scrollTrigger: { trigger: '.marquee--cards', start: 'top 92%', once: true } });
  gsap.from('.post', { y: 60, autoAlpha: 0, duration: 1.2, ease: 'power3.out', stagger: 0.12, scrollTrigger: { trigger: '.posts', start: 'top 86%', once: true } });

  /* ------------------------------------------------------------------ */
  /* Marquees (speed and direction follow the scroll)                    */
  /* ------------------------------------------------------------------ */
  const marquees = $$('[data-marquee]').map(el => {
    const track = el.firstElementChild, group = track.firstElementChild;
    const m = { track, x: 0, half: 1, speed: +(el.dataset.speed || 60), dir: el.dataset.dir === '-1' ? -1 : 1, hover: 1, hoverTo: 1, visible: false };
    m.build = () => {
      $$('.marquee__group', track).slice(1).forEach(n => n.remove());
      m.half = group.offsetWidth || 1;
      const copies = Math.ceil(innerWidth * 1.3 / m.half) + 1;
      for (let i = 0; i < copies; i++) { const c = group.cloneNode(true); c.setAttribute('aria-hidden', 'true'); track.append(c); }
    };
    m.build();
    new IntersectionObserver(([e]) => { m.visible = e.isIntersecting; }, { rootMargin: '120px' }).observe(el);
    if ('pause' in el.dataset && fine) {
      el.addEventListener('pointerenter', () => { m.hoverTo = 0; });
      el.addEventListener('pointerleave', () => { m.hoverTo = 1; });
    }
    return m;
  });
  if (!reduce) {
    let boost = 1, way = 1;
    gsap.ticker.add((t, dt) => {
      const v = lenis ? lenis.velocity : 0;
      if (Math.abs(v) > 0.6) way = v < 0 ? -1 : 1;
      boost = lerp(boost, way * (1 + Math.min(Math.abs(v) * 0.11, 6)), 0.08);
      const step = Math.min(dt, 60) / 1000;
      marquees.forEach(m => {
        if (!m.visible) return;
        m.hover = lerp(m.hover, m.hoverTo, 0.08);
        m.x -= m.speed * m.dir * boost * m.hover * step;
        if (m.x <= -m.half) m.x += m.half; else if (m.x > 0) m.x -= m.half;
        m.track.style.transform = `translate3d(${m.x}px,0,0)`;
      });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Quiz                                                                */
  /* ------------------------------------------------------------------ */
  (function quiz() {
    const stage = $('.quiz__stage'), bar = $('.quiz__bar span');
    const Q = [
      { q: 'Ton réveil idéal ?', a: [
        ['Session de surf au lever du soleil', { goldcoast: 2, byron: 2, sunshine: 1 }],
        ['Flat white dans une ruelle arty', { melbourne: 3 }],
        ['Footing avec vue sur l’opéra', { sydney: 3 }],
        ['Marché local, puis vélo le long de la rivière', { brisbane: 2, adelaide: 2 }] ] },
      { q: 'Ton ambiance ?', a: [
        ['Une grande ville qui ne dort jamais', { sydney: 2, melbourne: 2 }],
        ['Petit village bohème, pieds nus', { byron: 3, sunshine: 1 }],
        ['Soleil toute l’année, vie dehors', { brisbane: 2, goldcoast: 2, sunshine: 1 }],
        ['Grands espaces, loin de la foule', { perth: 3, adelaide: 1 }] ] },
      { q: 'Ta priorité là-bas ?', a: [
        ['Rencontrer du monde et faire la fête', { sydney: 2, goldcoast: 2, melbourne: 1 }],
        ['Trouver un job rapidement', { melbourne: 2, brisbane: 2, sydney: 1, perth: 1 }],
        ['Profiter de la nature et des plages', { sunshine: 3, perth: 2, byron: 1 }],
        ['Maîtriser mon budget', { adelaide: 3, brisbane: 1, perth: 1 }] ] }
    ];
    const cities = Object.fromEntries($$('.city[data-city]').map(c => [c.dataset.city, { name: $('h3', c).textContent, txt: $('p', c).textContent, img: $('img', c).src }]));
    let step = 0, score = {};

    const swap = html => {
      const paint = () => {
        stage.innerHTML = html;
        if (!reduce) gsap.from(stage.firstElementChild.children, { y: 26, autoAlpha: 0, duration: 0.7, ease: 'power3.out', stagger: 0.06, clearProps: CLEAR });
      };
      if (reduce || !stage.firstElementChild) paint();
      else gsap.to(stage.firstElementChild, { x: -40, autoAlpha: 0, duration: 0.3, ease: 'power2.in', onComplete: paint });
    };
    const ask = () => {
      const { q, a } = Q[step];
      bar.style.width = step / Q.length * 100 + '%';
      swap(`<div class="quiz__q"><small>Question ${step + 1} / ${Q.length}</small><h3>${q}</h3><div class="quiz__opts">${a.map(([t], i) => `<button class="quiz__opt" type="button" data-i="${i}"><i>${'ABCD'[i]}</i>${t}</button>`).join('')}</div></div>`);
    };
    const result = () => {
      const key = Object.entries(score).sort((x, y) => y[1] - x[1])[0][0], c = cities[key];
      bar.style.width = '100%';
      swap(`<div class="quiz__res"><div class="quiz__res-img"><img src="${c.img}" alt=""></div><small>Ton camp de base idéal</small><h3>${c.name}</h3><p>${c.txt} On regarde ensemble les écoles et les logements sur place ?</p><div class="quiz__res-cta"><a class="btn btn--sun" href="https://www.manoztralia.fr/demande-de-devis-sejour-linguistique/" target="_blank" rel="noopener"><span class="btn__label">Mon devis pour ${c.name}</span><span class="btn__icon"><svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg></span></a><button class="quiz__again" type="button">Recommencer</button></div></div>`);
    };
    stage.addEventListener('click', e => {
      const opt = e.target.closest('.quiz__opt');
      if (opt) {
        Object.entries(Q[step].a[+opt.dataset.i][1]).forEach(([k, v]) => { score[k] = (score[k] || 0) + v; });
        step++; step < Q.length ? ask() : result();
      } else if (e.target.closest('.quiz__again')) { step = 0; score = {}; ask(); }
    });
    ask();
  })();

  /* ------------------------------------------------------------------ */
  /* CTA + footer                                                        */
  /* ------------------------------------------------------------------ */
  gsap.fromTo('.cta__media', { clipPath: 'inset(10% 7% 10% 7% round 48px)' }, { clipPath: 'inset(0% 0% 0% 0% round 0px)', ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top 88%', end: 'top 8%', scrub: true } });
  if (!reduce) gsap.fromTo('.cta__media img', { yPercent: -5 }, { yPercent: 5, ease: 'none', scrollTrigger: { trigger: '.cta', start: 'top bottom', end: 'bottom top', scrub: true } });
  gsap.from(['.cta__hand', '.cta__actions > *', '.cta__info'], { y: 30, autoAlpha: 0, duration: 1.1, ease: 'power3.out', stagger: 0.1, scrollTrigger: { trigger: '.cta__in', start: 'top 62%', once: true } });

  const word = $('.foot__word'), foot = $('.foot');
  const wordChars = split(word, 'chars');
  const fitWord = () => {
    word.style.fontSize = '';
    const cs = getComputedStyle(foot), avail = foot.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
    word.style.fontSize = parseFloat(getComputedStyle(word).fontSize) * avail / word.offsetWidth + 'px';
  };
  fitWord();
  gsap.from(wordChars, { yPercent: 175, duration: 1.3, ease: 'expo.out', stagger: 0.04, scrollTrigger: { trigger: word, start: 'top 96%', once: true } });
  gsap.from('.foot__top > *', { y: 30, autoAlpha: 0, duration: 1, ease: 'power3.out', stagger: 0.07, scrollTrigger: { trigger: foot, start: 'top 82%', once: true } });

  const clocks = $$('[data-clock]');
  const tick = () => clocks.forEach(c => { c.textContent = new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: c.dataset.clock }).format(new Date()); });
  tick(); setInterval(tick, 20000);

  /* ------------------------------------------------------------------ */
  /* Chrome: progress, flight HUD, nav, menu, cursor, magnets            */
  /* ------------------------------------------------------------------ */
  const nav = $('.nav'), menu = $('.menu'), burger = $('.nav__burger');
  const bar = $('.progress__bar'), hud = $('.hud'), hudDot = $('.hud i b'), hudKm = $('.hud__km');
  const KM = 16960; // Paris → Sydney, great-circle
  ScrollTrigger.create({
    start: 0, end: 'max',
    onUpdate: s => {
      bar.style.transform = `scaleX(${s.progress})`;
      hudDot.style.left = s.progress * 100 + '%';
      hudKm.textContent = Math.round(s.progress * KM).toLocaleString('fr-FR');
      if (!menu.classList.contains('is-open')) nav.classList.toggle('is-hidden', s.direction === 1 && s.scroll() > innerHeight * 0.5);
    }
  });
  ScrollTrigger.create({ trigger: '.manifesto', start: 'top 70%', endTrigger: foot, end: 'top bottom', toggleClass: { targets: hud, className: 'is-on' } });
  $$('.nav__links a').forEach(a => {
    const target = $(a.getAttribute('href'));
    if (target) ScrollTrigger.create({ trigger: target, start: 'top 50%', end: 'bottom 50%', onToggle: s => a.classList.toggle('is-active', s.isActive) });
  });

  const setMenu = open => {
    menu.classList.toggle('is-open', open);
    menu.setAttribute('aria-hidden', String(!open));
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Fermer le menu' : 'Ouvrir le menu');
    if (lenis) open ? lenis.stop() : lenis.start();
  };
  burger.addEventListener('click', () => setMenu(!menu.classList.contains('is-open')));
  addEventListener('keydown', e => { if (e.key === 'Escape') setMenu(false); });

  document.addEventListener('click', e => {
    const a = e.target.closest('a[href^="#"]');
    if (!a) return;
    const id = a.getAttribute('href');
    const target = id === '#top' ? 0 : $(id);
    if (target === null) return;
    e.preventDefault();
    if (menu.classList.contains('is-open')) setMenu(false);
    go(target);
  });

  if (fine && !reduce) {
    const cur = $('.cursor'), lab = $('.cursor__label');
    const cx = gsap.quickTo(cur, 'x', { duration: 0.35, ease: 'power3' });
    const cy = gsap.quickTo(cur, 'y', { duration: 0.35, ease: 'power3' });
    addEventListener('pointermove', e => { cx(e.clientX); cy(e.clientY); cur.classList.add('is-active'); }, { passive: true });
    document.addEventListener('pointerover', e => {
      const l = e.target.closest('[data-cursor]'), k = e.target.closest('a, button');
      cur.classList.toggle('is-label', !!l);
      cur.classList.toggle('is-link', !l && !!k);
      if (l) lab.textContent = l.dataset.cursor;
    });
    root.addEventListener('pointerleave', () => cur.classList.remove('is-active'));

    $$('[data-magnetic]').forEach(el => {
      const x = gsap.quickTo(el, 'x', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      const y = gsap.quickTo(el, 'y', { duration: 0.9, ease: 'elastic.out(1, 0.45)' });
      el.addEventListener('pointermove', e => {
        const r = el.getBoundingClientRect();
        x((e.clientX - r.left - r.width / 2) * 0.32); y((e.clientY - r.top - r.height / 2) * 0.32);
      });
      el.addEventListener('pointerleave', () => { x(0); y(0); });
    });
  }

  /* ------------------------------------------------------------------ */
  /* Keep measurements honest                                            */
  /* ------------------------------------------------------------------ */
  const relayout = () => { marquees.forEach(m => m.build()); fitWord(); ScrollTrigger.refresh(); };
  if (document.fonts) document.fonts.ready.then(relayout);
  addEventListener('load', () => ScrollTrigger.refresh());
  let rt; addEventListener('resize', () => { clearTimeout(rt); rt = setTimeout(() => { marquees.forEach(m => m.build()); fitWord(); }, 200); });
})();
