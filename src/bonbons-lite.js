/* Choc Oh! — лёгкие бонбоны для телефона и компьютеров без WebGL.
   Без 3D-движка: каждый шар — лента кадров WebP из images/bonbons/ (см. tools/sprites.html),
   вращение листается CSS-анимацией steps(), парение — CSS. Листы грузятся, только когда шар у экрана. */
import { DESKTOP, MOBILE } from './layout.js';

const FRAMES = 10, DIR = 'images/bonbons/';
const name = (what) => 'bb-' + what.replace(/\.[a-z]+$/i, '') + '.webp';

function init() {
  const main = document.querySelector('main');
  if (!main) return;
  const mq = matchMedia('(max-width: 1023px)');
  const layer = document.createElement('div');
  layer.className = 'bb-sprites'; layer.setAttribute('aria-hidden', 'true');
  main.prepend(layer);
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting) return;
    const b = e.target, src = DIR + b.dataset.sheet;
    io.unobserve(b);
    const img = new Image(); img.decoding = 'async';
    img.onload = () => { b.style.backgroundImage = `url("${src}")`; b.classList.add('ready'); };
    img.src = src;
  }), { rootMargin: '300px 0px' });

  let items = [], mobile = null;
  function build() {
    mobile = mq.matches;
    layer.textContent = ''; items = [];
    const list = mobile ? MOBILE : DESKTOP;
    list.forEach((cfg, i) => {
      const el = document.createElement('div'); el.className = 'bb-s';
      const fy = document.createElement('i');
      const sp = document.createElement('b'); sp.dataset.sheet = name(cfg[5]);
      const seed = (i * 7919) % 97 / 97;
      el.style.setProperty('--fx', (5 + seed * 3).toFixed(2) + 's');
      el.style.setProperty('--fy', (3.6 + (1 - seed) * 2.4).toFixed(2) + 's');
      el.style.setProperty('--sp', (2.6 + seed * 1.4).toFixed(2) + 's');
      el.style.setProperty('--dl', (-seed * 6).toFixed(2) + 's');
      fy.append(sp); el.append(fy); layer.append(el);
      items.push({ el, cfg });
      io.observe(sp);
    });
    place();
  }
  function place() {
    const W = layer.clientWidth || innerWidth;
    const secs = [...main.querySelectorAll(':scope > section')];
    const top0 = main.getBoundingClientRect().top;
    const k = mobile ? Math.min(Math.max(W / 390, .85), 1.3) : Math.min(Math.max(W / 1440, .75), 1.35);
    items.forEach(({ el, cfg }) => {
      const [sec, yf, xf, size] = cfg, s = secs[sec]; if (!s) return;
      const r = s.getBoundingClientRect(), d = Math.round(size * k);
      el.style.setProperty('--d', d + 'px');
      el.style.left = Math.round(xf * W - d / 2) + 'px';
      el.style.top = Math.round(r.top - top0 + yf * r.height - d / 2) + 'px';
    });
  }
  build();
  let t; const onResize = () => { clearTimeout(t); t = setTimeout(() => (mq.matches !== mobile ? build() : place()), 150); };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(main);
  document.documentElement.classList.add('bb-lite');
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
