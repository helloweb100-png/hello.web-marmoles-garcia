/* ==========================================================================
   MÁRMOLES GARCÍA | Landing corporativa premium
   Dependencias (CDN): GSAP + ScrollTrigger, Lenis. Todo degrada con elegancia:
   si no cargan o el usuario prefiere menos movimiento, la página funciona
   completa en modo estático (sin animaciones de scroll).
   ========================================================================== */
(() => {
  'use strict';

  /* ---------- Utilidades ---------- */
  const $ = (s, c = document) => c.querySelector(s);
  const $$ = (s, c = document) => Array.from(c.querySelectorAll(s));
  const root = document.documentElement;
  const body = document.body;
  const wait = (ms) => new Promise((r) => setTimeout(r, ms));
  const reducedQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;

  const hasGSAP = typeof window.gsap !== 'undefined' && typeof window.ScrollTrigger !== 'undefined';
  const animated = hasGSAP && !reducedQuery.matches;
  if (!hasGSAP) root.classList.add('no-gsap');

  let lenis = null;

  /* ---------- WhatsApp: un mensaje distinto por cada llamada a la acción ---------- */
  const PHONE = (body.dataset.waPhone || '').replace(/\D/g, '');
  const WA_MESSAGES = {
    default: 'Hola, vi su página y me gustaría cotizar un proyecto en piedra natural.',
    nav: 'Hola Mármoles García, me gustaría cotizar un proyecto con ustedes.',
    hero: 'Hola Mármoles García, quiero mi cotización para un proyecto en piedra natural.',
    marmol: 'Hola, quiero mármol en mi proyecto. ¿Me ayudan a elegir y cotizar?',
    granito: 'Hola, quiero cotizar mi cocina en granito. ¿Me pueden asesorar?',
    terrazo: 'Hola, quiero mi terrazo a medida. ¿Me ayudan a diseñarlo y cotizarlo?',
    asesoria: 'Hola, estoy listo para elegir material y necesito su asesoría.',
    process: 'Hola, quiero agendar una visita de medición para mi proyecto.',
    gallery: 'Hola, vi sus trabajos y quiero un acabado como el de su galería. ¿Podemos platicar?',
    contacto: 'Hola, tengo un proyecto y quisiera hablar con ustedes.',
    fab: 'Hola, tengo una duda sobre mármol, granito o terrazo.'
  };
  const waUrl = (text) => `https://wa.me/${PHONE}?text=${encodeURIComponent(text)}`;
  const initWhatsApp = () => {
    $$('[data-wa]').forEach((a) => { a.href = waUrl(WA_MESSAGES[a.dataset.wa] || WA_MESSAGES.default); });
  };
  const openWhatsApp = (text) => {
    const url = waUrl(text);
    const w = window.open(url, '_blank');
    if (w) w.opener = null; else window.location.href = url;
  };

  /* ---------- División de texto en palabras ---------- */
  const splitWords = (el, mode) => {
    if (el.dataset.splitDone) return $$(mode === 'mask' ? '.w__in' : '.word', el);
    const text = el.textContent.trim().replace(/\s+/g, ' ');
    el.setAttribute('aria-label', text);
    el.textContent = '';
    const frag = document.createDocumentFragment();
    const words = text.split(' ');
    words.forEach((word, i) => {
      if (mode === 'mask') {
        const outer = document.createElement('span');
        outer.className = 'w';
        outer.setAttribute('aria-hidden', 'true');
        const inner = document.createElement('span');
        inner.className = 'w__in';
        inner.textContent = word;
        outer.appendChild(inner);
        frag.appendChild(outer);
      } else {
        const span = document.createElement('span');
        span.className = 'word';
        span.setAttribute('aria-hidden', 'true');
        span.textContent = word;
        frag.appendChild(span);
      }
      if (i < words.length - 1) frag.appendChild(document.createTextNode(' '));
    });
    el.appendChild(frag);
    el.dataset.splitDone = '1';
    return $$(mode === 'mask' ? '.w__in' : '.word', el);
  };

  /* ==========================================================================
     MÓDULOS INDEPENDIENTES DE GSAP (funcionan siempre)
     ========================================================================== */

  /* Scroll bloqueado/desbloqueado (menú, visor) */
  const lockScroll = (lock) => {
    if (lenis) { lock ? lenis.stop() : lenis.start(); }
    else { body.style.overflow = lock ? 'hidden' : ''; }
  };

  /* Menú móvil */
  const menu = $('#menu');
  const menuToggle = $('#menuToggle');
  const setMenu = (open) => {
    root.classList.toggle('menu-open', open);
    menuToggle.setAttribute('aria-expanded', String(open));
    menuToggle.setAttribute('aria-label', open ? 'Cerrar menú' : 'Abrir menú');
    menu.setAttribute('aria-hidden', String(!open));
    if (open) menu.removeAttribute('inert'); else menu.setAttribute('inert', '');
    lockScroll(open);
  };
  const initMenu = () => {
    menuToggle.addEventListener('click', () => setMenu(!root.classList.contains('menu-open')));
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && root.classList.contains('menu-open')) { setMenu(false); menuToggle.focus(); }
    });
    window.matchMedia('(min-width: 1024px)').addEventListener('change', (e) => { if (e.matches) setMenu(false); });
  };

  /* Scroll hacia anclas (con Lenis si existe) y precarga del tipo de proyecto */
  const headerOffset = () => -($('#siteHeader').offsetHeight + 8);
  const initAnchors = () => {
    document.addEventListener('click', (e) => {
      const a = e.target.closest('a[href^="#"]');
      if (!a) return;
      const id = a.getAttribute('href');
      if (a.dataset.project) {
        const sel = $('#f-type');
        if (sel) sel.value = a.dataset.project;
      }
      if (id === '#') return;
      const target = id === '#inicio' ? document.body : $(id);
      if (!target) return;
      e.preventDefault();
      if (root.classList.contains('menu-open')) setMenu(false);
      const goTop = id === '#inicio';
      if (lenis) {
        lenis.scrollTo(goTop ? 0 : target, { offset: goTop ? 0 : headerOffset(), duration: 1.7, easing: (t) => 1 - Math.pow(1 - t, 4) });
      } else {
        target.scrollIntoView({ behavior: reducedQuery.matches ? 'auto' : 'smooth', block: 'start' });
      }
    });
  };

  /* Preguntas frecuentes (acordeón accesible, una abierta a la vez) */
  const initFaq = () => {
    const items = $$('.faq__item');
    items.forEach((item) => {
      const q = $('.faq__q', item);
      q.addEventListener('click', () => {
        const open = q.getAttribute('aria-expanded') === 'true';
        items.forEach((it) => {
          const qq = $('.faq__q', it);
          const isThis = it === item;
          const next = isThis ? !open : false;
          qq.setAttribute('aria-expanded', String(next));
          it.classList.toggle('is-open', next);
        });
        if (hasGSAP) setTimeout(() => ScrollTrigger.refresh(), 700);
      });
    });
  };

  /* Formulario de cotización -> WhatsApp */
  const initForm = () => {
    const form = $('#quoteForm');
    if (!form) return;
    const fields = {
      name: { el: $('#f-name'), err: $('#f-name-err') },
      phone: { el: $('#f-phone'), err: $('#f-phone-err') },
      type: { el: $('#f-type'), err: $('#f-type-err') }
    };
    let attempted = false;

    const setError = (key, msg) => {
      const { el, err } = fields[key];
      el.closest('.field').classList.toggle('is-invalid', Boolean(msg));
      el.setAttribute('aria-invalid', msg ? 'true' : 'false');
      err.textContent = msg || '';
    };
    const check = {
      name: () => (fields.name.el.value.trim().length >= 2 ? '' : 'Escribe tu nombre para que sepamos cómo llamarte.'),
      phone: () => {
        const v = fields.phone.el.value.trim();
        if (!v) return '';
        const digits = v.replace(/\D/g, '');
        return /^[\d\s()+\-.]+$/.test(v) && digits.length >= 8 && digits.length <= 15 ? '' : 'Revisa el teléfono: usa entre 8 y 15 dígitos.';
      },
      type: () => (fields.type.el.value ? '' : 'Elige el tipo de proyecto para orientarte mejor.')
    };
    const validate = () => {
      let firstBad = null;
      Object.keys(check).forEach((k) => {
        const msg = check[k]();
        setError(k, msg);
        if (msg && !firstBad) firstBad = fields[k].el;
      });
      if (firstBad) firstBad.focus();
      return !firstBad;
    };

    Object.keys(fields).forEach((k) => {
      const ev = k === 'type' ? 'change' : 'input';
      fields[k].el.addEventListener(ev, () => { if (attempted) setError(k, check[k]()); });
      fields[k].el.addEventListener('blur', () => { if (attempted || fields[k].el.value) setError(k, check[k]()); });
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      attempted = true;
      if (!validate()) return;
      const data = new FormData(form);
      const lines = [
        `Hola Mármoles García, soy ${String(data.get('nombre')).trim()}.`,
        `Quiero cotizar un proyecto de: ${data.get('proyecto')}.`,
        `Material de interés: ${data.get('material') || 'Aún no lo sé'}.`
      ];
      const detalles = String(data.get('detalles') || '').trim();
      const tel = String(data.get('telefono') || '').trim();
      if (detalles) lines.push(`Medidas o detalles: ${detalles}`);
      if (tel) lines.push(`Mi teléfono: ${tel}`);
      $('#quoteOk').hidden = false;
      openWhatsApp(lines.join('\n'));
    });
  };

  /* Botón flotante: tooltip temporal */
  const initFab = () => {
    const tip = $('#fabTip');
    if (!tip) return;
    let seen = false;
    try { seen = sessionStorage.getItem('mg-fab-tip') === '1'; } catch (_) { /* sin storage */ }
    if (seen) return;
    setTimeout(() => {
      tip.classList.add('is-visible');
      try { sessionStorage.setItem('mg-fab-tip', '1'); } catch (_) { /* sin storage */ }
      setTimeout(() => tip.classList.remove('is-visible'), 6500);
    }, 7000);
  };

  /* Año del pie */
  const initYear = () => { const y = $('#year'); if (y) y.textContent = String(new Date().getFullYear()); };

  /* Carrusel del hero: palabra, imagen y pestaña cambian juntas */
  const SLIDE_MS = 6500;
  const hero = (() => {
    const slides = $$('#heroSlides .slide');
    const tabs = $$('.hero__tab');
    const words = $$('#wordRoll .word-roll__item');
    let cur = 0;
    let timer = null;
    let running = false;

    const show = (i) => {
      if (i === cur) return;
      const prev = cur;
      cur = i;
      slides[prev].classList.remove('is-active');
      slides[i].classList.add('is-active');
      words[prev].classList.remove('is-active');
      words[prev].classList.add('is-out');
      setTimeout(() => words[prev].classList.remove('is-out'), 1100);
      words[i].classList.add('is-active');
      tabs.forEach((t, k) => {
        t.classList.toggle('is-active', k === i);
        t.setAttribute('aria-pressed', String(k === i));
      });
    };
    const schedule = () => {
      clearTimeout(timer);
      if (!running) return;
      timer = setTimeout(() => { show((cur + 1) % slides.length); schedule(); }, SLIDE_MS);
    };
    const restartFill = () => {
      const active = tabs[cur];
      if (!active) return;
      const bar = $('.hero__tab-bar i', active);
      if (!bar) return;
      bar.style.animation = 'none';
      void bar.offsetWidth;
      bar.style.animation = '';
    };
    return {
      start() {
        if (reducedQuery.matches || running) return;
        running = true;
        restartFill();
        schedule();
      },
      bind() {
        root.style.setProperty('--slide-ms', SLIDE_MS + 'ms');
        tabs.forEach((t, k) => t.addEventListener('click', () => { show(k); restartFill(); schedule(); }));
        document.addEventListener('visibilitychange', () => {
          if (document.hidden) { clearTimeout(timer); } else { schedule(); }
        });
      }
    };
  })();

  /* Galería: filtros + visor */
  const initGallery = () => {
    const items = $$('.g-item');
    const filters = $$('.filter');
    if (!items.length) return;

    const applyFilter = (f) => {
      const match = (it) => f === 'todo' || it.dataset.cat.split(' ').includes(f);
      const swap = () => {
        items.forEach((it) => it.classList.toggle('is-hidden', !match(it)));
        const visible = items.filter((it) => !it.classList.contains('is-hidden'));
        if (animated) {
          gsap.fromTo(visible, { autoAlpha: 0, y: 28 }, { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.035, ease: 'expo.out', clearProps: 'transform' });
          ScrollTrigger.refresh();
        }
      };
      if (animated) gsap.to(items.filter((it) => !it.classList.contains('is-hidden')), { autoAlpha: 0, y: -10, duration: 0.25, ease: 'power2.in', onComplete: swap });
      else swap();
    };
    filters.forEach((btn) => btn.addEventListener('click', () => {
      filters.forEach((b) => { const on = b === btn; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', String(on)); });
      applyFilter(btn.dataset.filter);
    }));

    /* Visor */
    const lb = $('#lightbox');
    const lbImg = $('#lightboxImg');
    const lbCap = $('#lightboxCap');
    const btnClose = $('.lightbox__close', lb);
    const btnPrev = $('.lightbox__nav--prev', lb);
    const btnNext = $('.lightbox__nav--next', lb);
    let list = [];
    let index = 0;
    let lastFocus = null;

    const render = () => {
      const img = $('img', list[index]);
      lbImg.style.opacity = '0';
      const next = new Image();
      next.onload = () => { lbImg.src = img.currentSrc || img.src; lbImg.alt = img.alt; lbCap.textContent = img.alt; lbImg.style.opacity = '1'; };
      next.src = img.currentSrc || img.src;
      [1, -1].forEach((d) => { const n = $('img', list[(index + d + list.length) % list.length]); if (n) new Image().src = n.currentSrc || n.src; });
    };
    const open = (btn) => {
      list = $$('.g-item:not(.is-hidden) button');
      index = Math.max(0, list.indexOf(btn));
      lastFocus = document.activeElement;
      render();
      lb.classList.add('is-open');
      lb.setAttribute('aria-hidden', 'false');
      lb.removeAttribute('inert');
      lockScroll(true);
      btnClose.focus();
    };
    const close = () => {
      lb.classList.remove('is-open');
      lb.setAttribute('aria-hidden', 'true');
      lb.setAttribute('inert', '');
      lockScroll(false);
      if (lastFocus) lastFocus.focus();
    };
    const go = (d) => { index = (index + d + list.length) % list.length; render(); };

    items.forEach((it) => $('button', it).addEventListener('click', (e) => open(e.currentTarget)));
    btnClose.addEventListener('click', close);
    btnPrev.addEventListener('click', () => go(-1));
    btnNext.addEventListener('click', () => go(1));
    lb.addEventListener('click', (e) => { if (e.target === lb) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lb.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowRight') go(1);
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'Tab') {
        const f = [btnClose, btnPrev, btnNext];
        const i = f.indexOf(document.activeElement);
        e.preventDefault();
        f[(i + (e.shiftKey ? -1 : 1) + f.length) % f.length].focus();
      }
    });
    /* Deslizar para cambiar de foto */
    let startX = null;
    lb.addEventListener('pointerdown', (e) => { startX = e.clientX; });
    lb.addEventListener('pointerup', (e) => {
      if (startX === null) return;
      const dx = e.clientX - startX;
      startX = null;
      if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
    });
  };

  /* Estela de luz y diamante que sigue el puntero (solo escritorio) */
  const initHeroPointer = () => {
    if (!finePointer || reducedQuery.matches) return;
    const heroEl = $('#inicio');
    const gem = $('#gem');
    let raf = 0;
    let ev = null;
    const apply = () => {
      raf = 0;
      const r = heroEl.getBoundingClientRect();
      const x = ev.clientX - r.left;
      const y = ev.clientY - r.top;
      heroEl.style.setProperty('--mx', x + 'px');
      heroEl.style.setProperty('--my', y + 'px');
      const nx = (x / r.width - 0.5) * 2;
      const ny = (y / r.height - 0.5) * 2;
      gem.style.setProperty('--ry', (nx * 16).toFixed(2) + 'deg');
      gem.style.setProperty('--rx', (-ny * 12).toFixed(2) + 'deg');
      hero.pointer = { x: nx, y: ny };
    };
    heroEl.addEventListener('pointermove', (e) => { ev = e; if (!raf) raf = requestAnimationFrame(apply); });
    heroEl.addEventListener('pointerleave', () => {
      gem.style.setProperty('--ry', '0deg');
      gem.style.setProperty('--rx', '0deg');
      hero.pointer = { x: 0, y: 0 };
    });
  };

  /* Resplandor que sigue al cursor en tarjetas (bento y cotizador) */
  const initSpotlights = () => {
    if (!finePointer) return;
    $$('.bento__cell, .quote').forEach((el) => {
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', e.clientX - r.left + 'px');
        el.style.setProperty('--my', e.clientY - r.top + 'px');
      });
    });
  };

  /* Palabra gigante del pie: se ajusta al ancho disponible */
  const fitFooterWord = () => {
    const box = $('.footer__word');
    const span = $('#footerWord');
    if (!box || !span) return;
    box.style.fontSize = '';
    const avail = box.clientWidth * 0.985;
    const w = span.getBoundingClientRect().width;
    if (w > avail) box.style.fontSize = `calc(12.4vw * ${(avail / w).toFixed(4)})`;
  };

  /* ==========================================================================
     PARTÍCULAS DEL HERO (polvo de piedra y rombos de marca, canvas 2D)
     ========================================================================== */
  hero.pointer = { x: 0, y: 0 };
  const initParticles = () => {
    const canvas = $('#heroCanvas');
    if (!canvas || reducedQuery.matches) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let w = 0, h = 0, parts = [], raf = 0, visible = true;
    const linkDist = 130;

    const make = () => ({
      x: Math.random() * w, y: Math.random() * h,
      r: Math.random() * 1.5 + 0.5,
      vx: (Math.random() - 0.5) * 0.14, vy: -(Math.random() * 0.22 + 0.04),
      a: Math.random() * 0.55 + 0.2, ph: Math.random() * Math.PI * 2,
      depth: Math.random() * 0.9 + 0.1, diamond: Math.random() < 0.22
    });
    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const r = canvas.getBoundingClientRect();
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr); canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const n = Math.round(Math.min(w < 700 ? 26 : 64, (w * h) / 20000));
      parts = Array.from({ length: n }, make);
    };
    const frame = (t) => {
      raf = 0;
      if (!visible) return;
      ctx.clearRect(0, 0, w, h);
      const px = hero.pointer.x, py = hero.pointer.y;
      for (let i = 0; i < parts.length; i++) {
        const p = parts[i];
        p.x += p.vx; p.y += p.vy;
        if (p.y < -10) { p.y = h + 10; p.x = Math.random() * w; }
        if (p.x < -10) p.x = w + 10; else if (p.x > w + 10) p.x = -10;
        p.rx = p.x + px * 18 * p.depth;
        p.ry = p.y + py * 12 * p.depth;
        const alpha = p.a * (0.55 + 0.45 * Math.sin(t * 0.0016 + p.ph));
        ctx.fillStyle = `rgba(205,214,255,${alpha.toFixed(3)})`;
        if (p.diamond) {
          const s = p.r * 2.4;
          ctx.save(); ctx.translate(p.rx, p.ry); ctx.rotate(Math.PI / 4); ctx.fillRect(-s / 2, -s / 2, s, s); ctx.restore();
        } else {
          ctx.beginPath(); ctx.arc(p.rx, p.ry, p.r, 0, Math.PI * 2); ctx.fill();
        }
      }
      if (w >= 900) {
        ctx.lineWidth = 0.6;
        for (let i = 0; i < parts.length; i++) {
          for (let j = i + 1; j < parts.length; j++) {
            const dx = parts[i].rx - parts[j].rx, dy = parts[i].ry - parts[j].ry;
            const d2 = dx * dx + dy * dy;
            if (d2 < linkDist * linkDist) {
              ctx.strokeStyle = `rgba(190,200,255,${(0.1 * (1 - Math.sqrt(d2) / linkDist)).toFixed(3)})`;
              ctx.beginPath(); ctx.moveTo(parts[i].rx, parts[i].ry); ctx.lineTo(parts[j].rx, parts[j].ry); ctx.stroke();
            }
          }
        }
      }
      raf = requestAnimationFrame(frame);
    };
    const kick = () => { if (!raf && visible && !document.hidden) raf = requestAnimationFrame(frame); };

    resize();
    window.addEventListener('resize', () => { resize(); });
    new IntersectionObserver((entries) => { visible = entries[0].isIntersecting; if (visible) kick(); }, { threshold: 0 }).observe($('#inicio'));
    document.addEventListener('visibilitychange', kick);
    kick();
  };

  /* ==========================================================================
     MODO ESTÁTICO (sin GSAP o con movimiento reducido): todo visible y funcional
     ========================================================================== */
  const staticMode = () => {
    const pre = $('#preloader');
    if (pre) {
      pre.style.transition = 'opacity .5s';
      setTimeout(() => { pre.style.opacity = '0'; setTimeout(() => pre.remove(), 520); }, hasGSAP ? 0 : 700);
    }
    body.classList.remove('is-loading');

    // Encabezado sólido al bajar (IntersectionObserver, sin listeners de scroll)
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:0;left:0;width:1px;height:80px;pointer-events:none';
    body.prepend(sentinel);
    const header = $('#siteHeader');
    new IntersectionObserver((e) => header.classList.toggle('is-solid', !e[0].isIntersecting)).observe(sentinel);

    hero.start();
    initParticles();
    fitFooterWord();
    window.addEventListener('resize', fitFooterWord);
    if (document.fonts) document.fonts.ready.then(fitFooterWord);
  };

  /* ==========================================================================
     MODO ANIMADO (GSAP + ScrollTrigger + Lenis)
     ========================================================================== */
  const initLenis = () => {
    if (typeof window.Lenis === 'undefined') return;
    lenis = new window.Lenis({
      duration: 1.25,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      smoothWheel: true,
      wheelMultiplier: 0.9
    });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((time) => lenis.raf(time * 1000));
    gsap.ticker.lagSmoothing(0);
    lenis.stop();
  };

  /* Preloader: la marca se ensambla, cuenta real de carga y telón de piedra que se abre */
  const runPreloader = () => new Promise((resolve) => {
    const pre = $('#preloader');
    if (!pre) { resolve(); return; }
    const count = $('#preCount');
    const bar = $('.pre__bar');
    const state = { p: 0 };
    const render = () => {
      count.textContent = String(Math.round(state.p));
      bar.style.transform = `scaleX(${state.p / 100})`;
    };

    gsap.set('.pre__block--l', { x: -80, autoAlpha: 0 });
    gsap.set('.pre__block--r', { x: 80, autoAlpha: 0 });
    gsap.set('.pre__gem', { y: -70, scale: 0.2, rotation: -90, autoAlpha: 0, transformOrigin: '50% 50%' });
    gsap.set('.pre__stem', { scaleY: 0, transformOrigin: '50% 0%' });
    gsap.set('.pre__name span', { y: 18, autoAlpha: 0 });

    gsap.timeline()
      .to('.pre__block--l, .pre__block--r', { x: 0, autoAlpha: 1, duration: 1, ease: 'power3.out' }, 0)
      .to('.pre__gem', { y: 0, scale: 1, rotation: 0, autoAlpha: 1, duration: 1.2, ease: 'back.out(1.6)' }, 0.3)
      .to('.pre__stem', { scaleY: 1, duration: 0.5, ease: 'power2.out' }, 1)
      .to('.pre__name span', { y: 0, autoAlpha: 1, duration: 0.8, stagger: 0.12, ease: 'expo.out' }, 0.7);

    gsap.to(state, { p: 88, duration: 2, ease: 'power2.out', onUpdate: render });

    const heroImg = $('#heroSlides .slide img');
    const imgReady = heroImg && !heroImg.complete
      ? new Promise((r) => { heroImg.addEventListener('load', r, { once: true }); heroImg.addEventListener('error', r, { once: true }); })
      : Promise.resolve();
    const fontsReady = document.fonts ? document.fonts.ready : Promise.resolve();

    Promise.race([Promise.all([imgReady, fontsReady, wait(2300)]), wait(6000)]).then(() => {
      gsap.to(state, {
        p: 100, duration: 0.5, ease: 'power1.out', onUpdate: render,
        onComplete: () => {
          const exit = gsap.timeline({ onComplete: () => { pre.remove(); } });
          exit
            .to('.pre__core', { autoAlpha: 0, scale: 0.9, duration: 0.55, ease: 'power2.in' })
            .to('.pre__slab--top', { yPercent: -101, duration: 1.2, ease: 'expo.inOut' }, '>-0.05')
            .to('.pre__slab--bottom', { yPercent: 101, duration: 1.2, ease: 'expo.inOut' }, '<')
            .add(() => resolve(), '-=0.75');
        }
      });
    });
  });

  const prepareHeroIntro = () => {
    gsap.set('.hero__line-in', { yPercent: 115 });
    gsap.set('.hero .eyebrow, .hero__sub, .hero__cta', { autoAlpha: 0, y: 30 });
    gsap.set('.hero__frame-fx', { autoAlpha: 0, scale: 1.05, transformOrigin: '50% 100%' });
    gsap.set('#gem', { autoAlpha: 0, y: -60, scale: 0.5 });
    gsap.set('.hero__tabs', { autoAlpha: 0, y: 24 });
  };
  const playHeroIntro = () => {
    const tl = gsap.timeline({ defaults: { ease: 'expo.out' } });
    tl.to('.hero__frame-fx', { autoAlpha: 1, scale: 1, duration: 1.8 }, 0)
      .to('.hero .eyebrow', { autoAlpha: 1, y: 0, duration: 1 }, 0.15)
      .to('.hero__line-in', { yPercent: 0, duration: 1.3, stagger: 0.12 }, 0.2)
      .to('.hero__sub', { autoAlpha: 1, y: 0, duration: 1 }, 0.6)
      .to('.hero__cta', { autoAlpha: 1, y: 0, duration: 1 }, 0.75)
      .to('#gem', { autoAlpha: 1, y: 0, scale: 1, duration: 1.6, ease: 'back.out(1.4)' }, 0.5)
      .to('.hero__tabs', { autoAlpha: 1, y: 0, duration: 1 }, 1);
    return tl;
  };

  const buildScroll = () => {
    ScrollTrigger.config({ ignoreMobileResize: true });
    const mm = gsap.matchMedia();

    /* Encabezado: sólido al bajar, se oculta al bajar rápido y vuelve al subir; progreso de lectura */
    const header = $('#siteHeader');
    ScrollTrigger.create({
      start: 0, end: 'max',
      onUpdate: (self) => {
        const y = self.scroll();
        header.classList.toggle('is-solid', y > 24);
        header.classList.toggle('is-hidden', self.direction === 1 && y > 520 && !root.classList.contains('menu-open'));
      }
    });
    gsap.to('.progress__bar', { scaleX: 1, ease: 'none', scrollTrigger: { start: 0, end: 'max', scrub: 0.3 } });

    /* Revelado general: bloques que suben suavemente */
    gsap.set('[data-reveal]', { autoAlpha: 0, y: 36 });
    ScrollTrigger.batch('[data-reveal]', {
      start: 'top 90%', once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1.1, stagger: 0.1, ease: 'expo.out' })
    });

    /* Titulares: palabras que suben desde una máscara */
    $$('[data-split]').forEach((h) => {
      const inner = splitWords(h, 'mask');
      gsap.set(inner, { yPercent: 118 });
      ScrollTrigger.create({
        trigger: h, start: 'top 88%', once: true,
        onEnter: () => gsap.to(inner, { yPercent: 0, duration: 1.2, stagger: 0.05, ease: 'expo.out' })
      });
    });

    /* Hero: al bajar, el texto sube más rápido y el marco más lento (profundidad) */
    gsap.to('#heroContent', { yPercent: -14, autoAlpha: 0.15, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });
    gsap.to('.hero__canvas, .hero__rings', { autoAlpha: 0, ease: 'none', scrollTrigger: { trigger: '#inicio', start: '40% top', end: 'bottom top', scrub: true } });
    mm.add('(min-width: 1024px)', () => {
      gsap.to('#heroStage', { yPercent: 7, ease: 'none', scrollTrigger: { trigger: '#inicio', start: 'top top', end: 'bottom top', scrub: true } });
    });

    /* Marquee: velocidad ligada a la velocidad del scroll, dirección según el sentido */
    const track = $('#marqueeTrack');
    if (track) {
      const loop = gsap.to(track, { xPercent: -50, ease: 'none', duration: 38, repeat: -1 });
      let dir = 1, boost = 0;
      ScrollTrigger.create({
        start: 0, end: 'max',
        onUpdate: (s) => { dir = s.direction || dir; boost = Math.min(Math.abs(s.getVelocity()) / 240, 9); }
      });
      gsap.ticker.add(() => { boost *= 0.93; loop.timeScale(dir * (1 + boost)); });
      ScrollTrigger.create({ trigger: '.marquee', start: 'top bottom', end: 'bottom top', onToggle: (s) => (s.isActive ? loop.resume() : loop.pause()) });
    }

    /* Manifiesto: el texto se ilumina palabra por palabra con el scroll */
    const manifesto = $('.manifesto__text');
    if (manifesto) {
      const words = splitWords(manifesto, 'plain');
      gsap.fromTo(words, { opacity: 0.13 }, {
        opacity: 1, ease: 'none', stagger: 0.5, duration: 1,
        scrollTrigger: { trigger: manifesto, start: 'top 80%', end: 'bottom 45%', scrub: true }
      });
    }

    /* Zoom: la foto se abre a pantalla completa mientras el titular se separa */
    const zoom = $('#acabado');
    if (zoom) {
      const media = $('#zoomMedia'), img = $('.zoom__img'), veil = $('.zoom__veil'), caption = $('#zoomCaption');
      const wl = $('.zoom__word--l'), wr = $('.zoom__word--r');
      const small = window.innerWidth < 768;
      const startClip = small ? 'inset(25% 13% 25% 13%)' : 'inset(24% 29% 24% 29%)';
      gsap.set(media, { clipPath: startClip });
      gsap.set(img, { scale: 1.5 });
      gsap.set(veil, { opacity: 0 });
      gsap.set(caption, { autoAlpha: 0, y: 56 });
      const tl = gsap.timeline({
        defaults: { ease: 'none' },
        scrollTrigger: { trigger: zoom, start: 'top top', end: '+=190%', pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true }
      });
      tl.fromTo(media, { clipPath: startClip }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1, ease: 'power2.inOut' }, 0)
        .to(img, { scale: 1, duration: 1 }, 0)
        .to(wl, { xPercent: -115, duration: 0.9, ease: 'power2.in' }, 0.1)
        .to(wr, { xPercent: 115, duration: 0.9, ease: 'power2.in' }, 0.1)
        .to(veil, { opacity: 1, duration: 0.5 }, 0.55)
        .to(caption, { autoAlpha: 1, y: 0, duration: 0.45, ease: 'power2.out' }, 0.75)
        .to({}, { duration: 0.3 });
    }

    /* Materiales: desplazamiento horizontal fijado (escritorio) */
    mm.add('(min-width: 900px)', () => {
      const section = $('#materiales'), track2 = $('#matTrack'), bar = $('#matBar');
      if (!section || !track2) return;
      root.classList.add('has-pan');
      const dist = () => Math.max(0, track2.scrollWidth - window.innerWidth);
      const pan = gsap.to(track2, {
        x: () => -dist(), ease: 'none',
        scrollTrigger: {
          trigger: section, start: 'top top', end: () => '+=' + dist(), pin: true, scrub: 1, anticipatePin: 1, invalidateOnRefresh: true,
          onUpdate: (self) => { bar.style.transform = `scaleX(${self.progress})`; }
        }
      });
      $$('.mat__media img', section).forEach((im) => {
        gsap.fromTo(im, { xPercent: -6 }, {
          xPercent: 6, ease: 'none',
          scrollTrigger: { trigger: im.closest('.mat'), containerAnimation: pan, start: 'left right', end: 'right left', scrub: true }
        });
      });
      $$('.mat', section).forEach((panel) => {
        const items = $$('.mat__title, .mat__lead, .traits li, .uses, .btn', panel);
        gsap.from(items, {
          y: 46, autoAlpha: 0, duration: 1, stagger: 0.07, ease: 'expo.out',
          scrollTrigger: { trigger: panel, containerAnimation: pan, start: 'left 78%', toggleActions: 'play none none reverse' }
        });
      });
      const out = $$('.mat-outro > *', section);
      gsap.from(out, { y: 40, autoAlpha: 0, duration: 1, stagger: 0.1, ease: 'expo.out', scrollTrigger: { trigger: '.mat-outro', containerAnimation: pan, start: 'left 85%', toggleActions: 'play none none reverse' } });
      return () => { root.classList.remove('has-pan'); bar.style.transform = ''; };
    });

    /* Materiales en móvil: tarjetas que se abren al entrar */
    mm.add('(max-width: 899px)', () => {
      $$('.mat').forEach((panel) => {
        const im = $('.mat__media img', panel);
        gsap.fromTo(im, { clipPath: 'inset(100% 0% 0% 0%)', scale: 1.2 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.4, ease: 'expo.out', scrollTrigger: { trigger: panel, start: 'top 80%', once: true } });
        gsap.from($$('.mat__body > *', panel), { y: 36, autoAlpha: 0, duration: 1, stagger: 0.08, ease: 'expo.out', scrollTrigger: { trigger: $('.mat__body', panel), start: 'top 85%', once: true } });
      });
    });

    /* Espacios (bento): cada celda se destapa y su foto se asienta */
    const cells = $$('.bento__cell');
    gsap.set(cells, { clipPath: 'inset(0% 0% 100% 0%)' });
    gsap.set(cells.map((c) => $('img', c)), { scale: 1.3 });
    ScrollTrigger.batch(cells, {
      start: 'top 90%', once: true,
      onEnter: (els) => {
        gsap.fromTo(els, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 1.3, stagger: 0.12, ease: 'expo.out', clearProps: 'clipPath' });
        gsap.to(els.map((c) => $('img', c)), { scale: 1, duration: 1.8, stagger: 0.12, ease: 'expo.out', clearProps: 'transform' });
      }
    });

    /* Proceso: línea que se dibuja y paso activo */
    const stepsEl = $('#steps');
    if (stepsEl) {
      gsap.to('#stepsFill', { scaleY: 1, ease: 'none', scrollTrigger: { trigger: stepsEl, start: 'top 55%', end: 'bottom 60%', scrub: true } });
      const steps = $$('.step', stepsEl);
      const setActive = (i) => steps.forEach((s, k) => s.classList.toggle('is-dim', k !== i));
      setActive(0);
      steps.forEach((s, i) => {
        ScrollTrigger.create({ trigger: s, start: 'top 62%', end: 'bottom 62%', onToggle: (self) => { if (self.isActive) setActive(i); } });
        const im = $('.step__media img', s);
        gsap.fromTo(im, { clipPath: 'inset(0% 0% 100% 0%)', scale: 1.25 }, { clipPath: 'inset(0% 0% 0% 0%)', scale: 1, duration: 1.5, ease: 'expo.out', scrollTrigger: { trigger: s, start: 'top 82%', once: true } });
      });
    }

    /* Galería: fotos que aparecen en cascada */
    const gItems = $$('.g-item');
    gsap.set(gItems, { autoAlpha: 0, y: 40 });
    ScrollTrigger.batch(gItems, {
      start: 'top 94%', once: true,
      onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 1, stagger: 0.07, ease: 'expo.out', clearProps: 'transform' })
    });

    /* Preguntas */
    gsap.set('.faq__item', { autoAlpha: 0, y: 24 });
    ScrollTrigger.batch('.faq__item', { start: 'top 92%', once: true, onEnter: (els) => gsap.to(els, { autoAlpha: 1, y: 0, duration: 0.9, stagger: 0.08, ease: 'expo.out' }) });

    /* Contacto */
    gsap.set('.quote', { autoAlpha: 0, y: 60 });
    ScrollTrigger.create({ trigger: '.quote', start: 'top 88%', once: true, onEnter: () => gsap.to('.quote', { autoAlpha: 1, y: 0, duration: 1.3, ease: 'expo.out' }) });

    /* Pie: la palabra gigante sube desde abajo */
    gsap.fromTo('#footerWord', { yPercent: 85 }, { yPercent: 0, ease: 'none', scrollTrigger: { trigger: '.footer__word', start: 'top 100%', end: 'bottom 98%', scrub: true } });

    /* Botones magnéticos (solo puntero fino) */
    if (finePointer) {
      $$('.btn--magnetic').forEach((btn) => {
        const xTo = gsap.quickTo(btn, 'x', { duration: 0.6, ease: 'power3' });
        const yTo = gsap.quickTo(btn, 'y', { duration: 0.6, ease: 'power3' });
        btn.addEventListener('pointermove', (e) => {
          const r = btn.getBoundingClientRect();
          xTo((e.clientX - (r.left + r.width / 2)) * 0.16);
          yTo((e.clientY - (r.top + r.height / 2)) * 0.26);
        });
        btn.addEventListener('pointerleave', () => { xTo(0); yTo(0); });
      });
    }
  };

  const animatedMode = async () => {
    gsap.registerPlugin(ScrollTrigger);
    initLenis();
    prepareHeroIntro();

    let introDone = false;
    // Seguro: si algo falla, el contenido nunca queda oculto
    setTimeout(() => {
      if (introDone) return;
      introDone = true;
      gsap.set('.hero__line-in, .hero .eyebrow, .hero__sub, .hero__cta, .hero__frame-fx, #gem, .hero__tabs', { clearProps: 'all', autoAlpha: 1 });
      body.classList.remove('is-loading');
      if (lenis) lenis.start();
    }, 14000);

    try { buildScroll(); } catch (err) { console.error('[Mármoles García] Error en animaciones de scroll', err); }

    await runPreloader();
    introDone = true;
    body.classList.remove('is-loading');
    if (lenis) lenis.start();
    playHeroIntro();
    hero.start();
    initParticles();
    ScrollTrigger.refresh();
  };

  /* ==========================================================================
     ARRANQUE
     ========================================================================== */
  const start = () => {
    initWhatsApp();
    initYear();
    initMenu();
    initAnchors();
    initFaq();
    initForm();
    initFab();
    hero.bind();
    initHeroPointer();
    initSpotlights();

    initGallery();
    if (animated) animatedMode().then(fitFooterWord);
    else staticMode();

    window.addEventListener('resize', fitFooterWord);
    if (document.fonts) document.fonts.ready.then(() => { fitFooterWord(); if (animated) ScrollTrigger.refresh(); });
    window.addEventListener('load', () => { fitFooterWord(); if (animated) ScrollTrigger.refresh(); });
  };

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', start);
  else start();
})();
