/* Choc Oh! Toronto — фото, меню, форма, пружинные карточки, загрузка 3D */
(() => {
  const IMG_DIR = 'images/';
  // Stock photos (Unsplash License). Replace a URL — or delete the line to use images/<file> instead.
  const PHOTOS = {
    'hero.jpg': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=1800',
    'tile-1.jpg': 'https://images.unsplash.com/photo-1638194645412-1d0b4c53ffed?auto=format&fit=crop&q=80&w=700',
    'tile-2.jpg': 'https://images.unsplash.com/photo-1481391319762-47dff72954d9?auto=format&fit=crop&q=80&w=700',
    'tile-3.jpg': 'https://images.unsplash.com/photo-1610670444950-0b29430891b4?auto=format&fit=crop&q=80&w=700',
    'gallery-01.jpg': 'https://images.unsplash.com/photo-1689150831245-267e43023a70?auto=format&fit=crop&q=80&w=600',
    'gallery-02.jpg': 'https://images.unsplash.com/photo-1583338917451-face2751d8d5?auto=format&fit=crop&q=80&w=600',
    'gallery-03.jpg': 'https://images.unsplash.com/photo-1682120501920-7ce18b00237a?auto=format&fit=crop&q=80&w=600',
    'gallery-04.jpg': 'https://images.unsplash.com/photo-1534432182912-63863115e106?auto=format&fit=crop&q=80&w=600',
    'gallery-05.jpg': 'https://images.unsplash.com/photo-1656821991459-ae723d90d648?auto=format&fit=crop&q=80&w=600',
    'gallery-06.jpg': 'https://images.unsplash.com/photo-1711672284661-bd70e38f31b2?auto=format&fit=crop&q=80&w=600',
    'gallery-07.jpg': 'https://images.unsplash.com/photo-1657502096852-340a75dc56f7?auto=format&fit=crop&q=80&w=600',
    'gallery-08.jpg': 'https://images.unsplash.com/photo-1610450949065-1f2841536c88?auto=format&fit=crop&q=80&w=600',
    'gallery-09.jpg': 'https://images.unsplash.com/photo-1646303339019-a57056b180ae?auto=format&fit=crop&q=80&w=600',
    'bonbons-bg.jpg': 'https://images.unsplash.com/photo-1549007994-cb92caebd54b?auto=format&fit=crop&q=80&w=1600',
    'card-1.jpg': 'https://images.unsplash.com/photo-1526823127573-0fda76b6c24f?auto=format&fit=crop&q=80&w=900',
    'card-2.jpg': 'https://images.unsplash.com/photo-1720029106261-0d0396bb270d?auto=format&fit=crop&q=80&w=900',
    'card-3.jpg': 'https://images.unsplash.com/photo-1639158924965-7be3bb57506b?auto=format&fit=crop&q=80&w=900',
    'card-4.jpg': 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&q=80&w=900',
    'services-bg.jpg': 'https://images.unsplash.com/photo-1566565286951-f81c7ba5619d?auto=format&fit=crop&q=80&w=1600',
    'cake-bg.jpg': 'https://images.unsplash.com/photo-1602351447937-745cb720612f?auto=format&fit=crop&q=80&w=1600',
    'cake-1.jpg': 'https://images.unsplash.com/photo-1604413191066-4dd20bedf486?auto=format&fit=crop&q=80&w=700',
    'cake-2.jpg': 'https://images.unsplash.com/photo-1606890737304-57a1ca8a5b62?auto=format&fit=crop&q=80&w=700',
    'cake-3.jpg': 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?auto=format&fit=crop&q=80&w=700',
    'story.jpg': 'https://images.unsplash.com/photo-1545015451-f05567aa6bcc?auto=format&fit=crop&q=80&w=1800',
    'contact-bg.jpg': 'https://images.unsplash.com/photo-1626263468007-a9e0cf83f1ac?auto=format&fit=crop&q=80&w=1800'
  };
 
  // Build gallery marquee rows (content duplicated for seamless loop)
  document.querySelectorAll('.track[data-row]').forEach(track => {
    const ids = track.dataset.row.split(',');
    const tones = ['1','2','3','4','5'];
    const html = ids.map((n, i) => {
      const f = 'gallery-' + String(n).padStart(2,'0') + '.jpg';
      return `<div class="ph" data-img="${f}" data-tone="${tones[(+n + i) % 5]}"></div>`;
    }).join('');
    track.innerHTML = html + html + html + html;
  });
 
  // Load photos into slots; keep gradient + label if the file is missing
  const cache = {};
  const lazy = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { loadPh(e.target); lazy.unobserve(e.target); } }), { rootMargin: '800px 800px' });
  document.querySelectorAll('.ph[data-img]').forEach(el => {
    const file = el.dataset.img;
    const label = document.createElement('span');
    label.className = 'ph-label';
    label.textContent = file;
    el.appendChild(label);
    el._src = PHOTOS[file] || IMG_DIR + file;
    lazy.observe(el);
  });
  function loadPh(el) {
    const src = el._src; if (!src || el._req) return; el._req = 1;
    if (!cache[src]) cache[src] = new Promise(res => { const i = new Image(); i.decoding = 'async'; i.onload = () => res(true); i.onerror = () => res(false); i.src = src; });
    cache[src].then(ok => { if (ok) { el.style.backgroundImage = `url("${src}")`; el.classList.add('loaded'); } });
  }
 
  // Hero video: remove if not provided
  document.querySelectorAll('.hero-video').forEach(v => v.addEventListener('error', () => v.remove(), true));
  document.querySelectorAll('.hero-video').forEach(v => { v.onerror = () => v.remove(); v.querySelector && v.play && v.play().catch(()=>{}); });
 
  // Reveal on scroll
  const io = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } }), { threshold: .25 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));
 
  // Mobile menu
  const burger = document.querySelector('.burger'), mm = document.getElementById('mmenu');
  burger.addEventListener('click', () => { const o = mm.classList.toggle('open'); burger.setAttribute('aria-expanded', o); });
  mm.querySelectorAll('a,button').forEach(a => a.addEventListener('click', () => { mm.classList.remove('open'); burger.setAttribute('aria-expanded', false); }));
 
  // Contact modal
  const modal = document.getElementById('contact');
  const open = () => { loadPh(modal.querySelector('.ph')); modal.classList.add('open'); document.body.style.overflow = 'hidden'; fab && fab.classList.remove('show'); if (matchMedia('(hover:hover)').matches) setTimeout(() => modal.querySelector('#f-name').focus(), 350); };
  const close = () => { modal.classList.remove('open'); document.body.style.overflow = ''; setNav(); };
  document.querySelectorAll('[data-open-contact]').forEach(b => b.addEventListener('click', () => { if (b.classList.contains('card')) { const sel = document.getElementById('f-type'); sel.value = 'Chocolates / bonbons'; const m = document.getElementById('f-msg'); if (!m.value) m.value = 'Interested in: ' + b.getAttribute('aria-label').replace(' bonbon', ''); } open(); }));
  modal.querySelector('.close').addEventListener('click', close);
  modal.querySelector('.wrap').addEventListener('click', e => { if (e.target === e.currentTarget) close(); });
  document.addEventListener('click', e => { if (mm.classList.contains('open') && !mm.contains(e.target) && !burger.contains(e.target)) { mm.classList.remove('open'); burger.setAttribute('aria-expanded', false); } });
  document.addEventListener('keydown', e => { if (e.key === 'Escape') close(); });
 
  // Form → opens email client with the order details (swap for Formspree/Netlify later)
  document.getElementById('orderForm').addEventListener('submit', e => {
    e.preventDefault();
    const f = e.target, d = Object.fromEntries(new FormData(f));
    if (!d.name || !d.email) { f.querySelector(d.name ? '#f-email' : '#f-name').focus(); return; }
    const body = `Name: ${d.name}\nEmail: ${d.email}\nLooking for: ${d.type}\nDate: ${d.date || '-'}\n\n${d.message || ''}`;
    location.href = `mailto:hello@chocohtoronto.com?subject=${encodeURIComponent('Order enquiry — ' + d.type)}&body=${encodeURIComponent(body)}`;
    f.querySelector('.thanks').style.display = 'block';
  });
 
  // Header nav colour follows the section under it
  const header = document.querySelector('.header');
  const navSections = [...document.querySelectorAll('main section, .footer')];
  const setNav = () => {
    const y = header.offsetHeight / 2;
    const cur = navSections.find(s => { const r = s.getBoundingClientRect(); return r.top <= y && r.bottom > y; });
    header.classList.toggle('on-dark', !!cur && cur.dataset.nav === 'dark');
    fab && fab.classList.toggle('show', scrollY > innerHeight * .6 && !modal.classList.contains('open'));
  };
  const fab = document.querySelector('.order-fab');
  addEventListener('scroll', setNav, { passive: true }); setNav();
 
  // ── Spring cards (doc 10): hover tilt + glare, grab & throw, springs back. Mouse/pen only.
  const fine = matchMedia('(hover:hover) and (pointer:fine)').matches;
  const still = matchMedia('(prefers-reduced-motion:reduce)').matches;
  if (fine) {
    const SP = { pos: [300, 26], scale: [420, 28], tilt: [220, 20] };
    const spring = (v, [k, c]) => ({ v, t: v, vel: 0, k, c });
    const items = [...document.querySelectorAll('.tiles .tile, .float-wrap .card')].map(el => {
      const baseY = el.matches('.tiles .tile:nth-child(2)') ? 24 : 0;
      return { el, baseX: 0, baseY, x: spring(0, SP.pos), y: spring(baseY, SP.pos), s: spring(1, SP.scale),
        rx: spring(0, SP.tilt), ry: spring(0, SP.tilt), rz: spring(0, SP.tilt), hover: false, grab: null };
    });
    let raf = 0, last = 0;
    const step = (sp, dt) => { sp.vel += (-sp.k * (sp.v - sp.t) - sp.c * sp.vel) * dt; sp.v += sp.vel * dt; };
    const atRest = sp => Math.abs(sp.v - sp.t) < .01 && Math.abs(sp.vel) < .01;
    const apply = it => { it.el.style.transform = `perspective(900px) translate3d(${it.x.v.toFixed(2)}px,${it.y.v.toFixed(2)}px,0) rotateX(${it.rx.v.toFixed(2)}deg) rotateY(${it.ry.v.toFixed(2)}deg) rotateZ(${it.rz.v.toFixed(2)}deg) scale(${it.s.v.toFixed(4)})`; };
    const tick = now => {
      const dt = Math.min((now - last) / 1000, 1 / 30) / 3; last = now; let moving = false;
      items.forEach(it => {
        const sps = it.grab ? [it.s, it.rx, it.ry, it.rz] : [it.x, it.y, it.s, it.rx, it.ry, it.rz];
        for (let i = 0; i < 3; i++) sps.forEach(sp => step(sp, dt));
        if (still) [it.x, it.y, it.s, it.rx, it.ry, it.rz].forEach(sp => { sp.v = sp.t; sp.vel = 0; });
        if (it.grab || ![it.x, it.y, it.s, it.rx, it.ry, it.rz].every(atRest)) moving = true;
        apply(it);
      });
      raf = moving ? requestAnimationFrame(tick) : 0;
    };
    const wake = () => { if (!raf) { last = performance.now(); raf = requestAnimationFrame(tick); } };
    let suppressClick = null;
    document.addEventListener('click', e => { if (suppressClick && suppressClick.contains(e.target)) { e.preventDefault(); e.stopImmediatePropagation(); suppressClick = null; } }, true);
    items.forEach(it => {
      const el = it.el; let rect;
      el.addEventListener('pointerenter', e => { if (e.pointerType === 'touch') return; it.hover = true; rect = el.getBoundingClientRect(); el.classList.add('is-hover'); if (!it.grab) it.s.t = 1.03; wake(); });
      el.addEventListener('pointerleave', () => { it.hover = false; el.classList.remove('is-hover'); if (!it.grab) { it.s.t = 1; it.rx.t = it.ry.t = 0; } wake(); });
      el.addEventListener('pointermove', e => {
        if (e.pointerType === 'touch') return;
        if (it.grab) {
          const g = it.grab, now = performance.now(), dtm = Math.max((now - g.t) / 1000, 1 / 240);
          const nx = it.baseX + it.px + e.clientX - g.sx, ny = it.baseY + it.py + e.clientY - g.sy;
          g.vx = g.vx * .6 + (nx - it.x.v) / dtm * .4; g.vy = g.vy * .6 + (ny - it.y.v) / dtm * .4; g.t = now;
          it.x.v = nx; it.y.v = ny;
          if (Math.hypot(e.clientX - g.sx, e.clientY - g.sy) > 5) g.moved = true;
          const cl = (v, m) => Math.max(-m, Math.min(m, v));
          it.rz.t = cl(g.vx * .006, 8); it.ry.t = cl(g.vx * .004, 10); it.rx.t = cl(-g.vy * .004, 10);
        } else if (rect) {
          const px = (e.clientX - rect.left) / rect.width, py = (e.clientY - rect.top) / rect.height;
          it.ry.t = (px - .5) * 20; it.rx.t = -(py - .5) * 20;
          el.style.setProperty('--gx', (px * 100).toFixed(1) + '%'); el.style.setProperty('--gy', (py * 100).toFixed(1) + '%');
        }
        wake();
      });
      el.addEventListener('pointerdown', e => {
        if (e.pointerType === 'touch' || e.button !== 0 || still) return;
        el.setPointerCapture(e.pointerId);
        it.grab = { sx: e.clientX, sy: e.clientY, vx: 0, vy: 0, t: performance.now(), moved: false };
        it.s.t = 1.06; el.classList.add('is-grab'); wake();
      });
      const release = e => {
        if (!it.grab) return;
        const g = it.grab; it.grab = null; el.classList.remove('is-grab');
        if (el.hasPointerCapture && el.hasPointerCapture(e.pointerId)) el.releasePointerCapture(e.pointerId);
        it.x.vel = g.vx; it.y.vel = g.vy; it.x.t = it.baseX + it.px; it.y.t = it.baseY + it.py;
        it.rz.t = 0; it.rx.t = it.ry.t = 0; it.s.t = it.hover ? 1.03 : 1;
        if (g.moved) suppressClick = el;
        wake();
      };
      el.addEventListener('pointerup', release); el.addEventListener('pointercancel', release);
      el.addEventListener('dragstart', e => e.preventDefault());
      it.px = 0; it.py = 0;
    });
    // bonbon cards still drift gently with the cursor — now as spring targets
    const fw = document.querySelector('.float-wrap');
    if (fw && !still) {
      const cards = items.filter(it => it.el.classList.contains('card')), depth = [18, -12, 22, -16];
      fw.addEventListener('mousemove', e => {
        const r = fw.getBoundingClientRect(), dx = (e.clientX - r.left) / r.width - .5, dy = (e.clientY - r.top) / r.height - .5;
        cards.forEach((it, i) => { it.px = dx * depth[i]; it.py = dy * depth[i]; if (!it.grab) { it.x.t = it.baseX + it.px; it.y.t = it.baseY + it.py; } });
        wake();
      });
      fw.addEventListener('mouseleave', () => { cards.forEach(it => { it.px = it.py = 0; if (!it.grab) { it.x.t = it.baseX; it.y.t = it.baseY; } }); wake(); });
    }
    items.forEach(apply);
  }

  // ── 3D bonbons: load the local bundle after the page has painted (keeps first screen fast)
  window.CHOC_PHOTOS = PHOTOS;
  const loadBonbons = () => { const sc = document.createElement('script'); sc.src = 'js/bonbons.bundle.js'; sc.async = true; document.body.appendChild(sc); };
  const idle = window.requestIdleCallback || (fn => setTimeout(fn, 200));
  if (document.readyState === 'complete') idle(loadBonbons); else addEventListener('load', () => idle(loadBonbons));

  document.querySelectorAll('[data-open-contact][tabindex]').forEach(c => c.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); c.click(); } }));
 
  const t = new Date(); document.getElementById('f-date').min = new Date(t - t.getTimezoneOffset()*6e4).toISOString().slice(0,10);
  document.getElementById('yr').textContent = t.getFullYear();
})();
