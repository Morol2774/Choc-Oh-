/* Choc Oh! — парящие гранёные бонбоны (three.js 0.160)
   Два слоя: .bb-back (под матовым стеклом и контентом) и .bb-front (перед карточками, только десктоп).
   Шары привязаны к секциям: [секция, доля высоты (0..1, 1 = стык со следующей), доля ширины,
   диаметр px (при 1440 / 390), тип, вкус|фото, слой, скорость параллакса].
   Пересборка: npx esbuild bonbons.js --bundle --format=iife --minify --alias:three/addons=three/examples/jsm --outfile=bonbons.bundle.js */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

// p = расписной бонбон (вкус), g = стеклянный шар с фото конфеты внутри
const DESKTOP = [
  // 1 · hero — один акцент
  [0, .22, .41, 70, 'p', 'rasp', 'b', 1.10],
  // стык hero → галерея: главный стеклянный + маленький
  [0, 1.0, .44, 150, 'g', 'card-1.jpg', 'f', 1.0],
  [1, .03, .80, 60, 'p', 'rasp', 'f', 1.08],
  // 2 · галерея — без шаров (там бегущая лента)
  // стык галерея → бонбоны: главный расписной
  [1, 1.0, .36, 110, 'p', 'rasp', 'f', 1.0],
  // 3 · бонбоны — два шара под матовым стеклом (не трогаем) + один между карточками
  [2, .14, .12, 64, 'p', 'pist', 'b', .95],
  [2, .84, .22, 92, 'g', 'card-2.jpg', 'b', 1.05],
  [2, .52, .655, 56, 'p', 'gold', 'f', 1.15],
  // стык бонбоны → услуги: главный стеклянный
  [2, 1.0, .72, 128, 'g', 'card-4.jpg', 'f', 1.0],
  // 4 · что мы делаем — один акцент
  [3, .30, .86, 84, 'p', 'rasp', 'f', 1.10],
  // стык услуги → торты: главный расписной + маленький
  [3, 1.0, .90, 112, 'p', 'caramel', 'f', 1.0],
  [4, .03, .40, 56, 'p', 'pist', 'b', .90],
  // 5 · торты — один акцент
  [4, .78, .40, 64, 'p', 'gold', 'f', 1.05],
  // стык торты → история: главный стеклянный
  [4, 1.0, .62, 116, 'g', 'tile-3.jpg', 'f', 1.0],
  // 6 · why — шар под матовой вуалью (не трогаем) + один акцент
  [5, .50, .44, 90, 'p', 'pist', 'b', 1.0],
  [5, .30, .78, 70, 'p', 'gold', 'f', 1.08],
];
const MOBILE = [
  [0, .98, .10, 78, 'g', 'card-1.jpg', 'b', 1.0],
  [1, 1.0, .88, 64, 'p', 'caramel', 'b', 1.0],
  [2, .12, .90, 64, 'g', 'card-2.jpg', 'b', 1.05], // под матовым стеклом
  [2, 1.0, .86, 62, 'p', 'rasp', 'b', 1.0],
  [3, 1.0, .14, 78, 'g', 'card-4.jpg', 'b', 1.0],
  [4, 1.0, .88, 58, 'p', 'gold', 'b', 1.0],
  [5, .86, .90, 72, 'g', 'tile-2.jpg', 'b', 1.0],
];

const FOV = 35, CAMZ = 10;
const BRAND = { rasp: '#B8445C', pist: '#A9B388', gold: '#D4A44C' };

function hasGL() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; }
}

function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ── Роспись бонбона: карта цвета + карта металла (золото), развёртка 1024×512 ── */
function paint(flavor, seed) {
  const W = 1024, H = 512, r = rng(seed);
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const m = document.createElement('canvas'); m.width = W; m.height = H;
  const g = c.getContext('2d'), mg = m.getContext('2d');
  const base = g.createLinearGradient(0, 0, 0, H);
  base.addColorStop(0, '#3a1d10'); base.addColorStop(.5, '#2a130a'); base.addColorStop(1, '#1d0c05');
  g.fillStyle = base; g.fillRect(0, 0, W, H);
  mg.fillStyle = '#000'; mg.fillRect(0, 0, W, H);
  const wrap = (fn) => { fn(0); fn(-W); fn(W); };
  const blob = (ctx, x, y, rad, col, a = 1) => wrap(o => { ctx.globalAlpha = a; ctx.fillStyle = col; ctx.beginPath(); ctx.arc(x + o, y, rad, 0, 7); ctx.fill(); });
  const air = (x, y, rad, col, a) => wrap(o => { const gr = g.createRadialGradient(x + o, y, 0, x + o, y, rad); gr.addColorStop(0, col); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.globalAlpha = a; g.fillStyle = gr; g.fillRect(x + o - rad, y - rad, rad * 2, rad * 2); });
  const splatter = (x, y, size, col, n) => {
    blob(g, x, y, size, col);
    for (let i = 0; i < n; i++) { const a = r() * 6.28, d = size * (0.8 + r() * 1.8); blob(g, x + Math.cos(a) * d, y + Math.sin(a) * d * .6, size * (0.06 + r() * 0.3), col); }
  };
  const dust = (col, n, metal) => { for (let i = 0; i < n; i++) { const x = r() * W, y = H * (.15 + r() * .7), s = .6 + r() * 2.2; blob(g, x, y, s, col, .5 + r() * .5); if (metal) blob(mg, x, y, s, '#fff'); } };
  const gold = (x, y, s) => { // кусочек сусального золота
    const pts = []; const k = 5 + (r() * 4 | 0);
    for (let i = 0; i < k; i++) { const a = i / k * 6.28 + r() * .5, d = s * (.5 + r() * .7); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * .7]); }
    [g, mg].forEach((ctx, j) => wrap(o => { ctx.globalAlpha = 1; ctx.fillStyle = j ? '#fff' : (r() > .5 ? '#e2bb63' : '#c9963e'); ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px + o, py) : ctx.moveTo(px + o, py)); ctx.closePath(); ctx.fill(); }));
  };
  if (flavor === 'rasp') {
    air(W * .3, H * .45, 260, BRAND.rasp, .55); air(W * .78, H * .5, 200, '#e2788c', .4);
    for (let i = 0; i < 4; i++) splatter(r() * W, H * (.3 + r() * .4), 30 + r() * 40, i % 2 ? BRAND.rasp : '#d8667d', 14);
    dust('#f6e3d3', 260, false);
  } else if (flavor === 'pist') {
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) wrap(o => { g.strokeStyle = i === 1 ? '#c7cf9f' : BRAND.pist; g.lineWidth = 46 - i * 12; g.lineCap = 'round'; g.beginPath(); const y0 = H * (.35 + i * .12); g.moveTo(o - 20, y0); for (let x = 0; x <= W + 40; x += 64) g.lineTo(o + x, y0 + Math.sin(x / 120 + i) * 34); g.stroke(); });
    air(W * .6, H * .7, 220, '#7f8d5a', .35);
    dust('#e2bb63', 320, true);
  } else if (flavor === 'gold') {
    air(W * .5, H * .5, 380, '#5a2a18', .45);
    for (let i = 0; i < 14; i++) gold(r() * W, H * (.25 + r() * .5), 18 + r() * 34);
    dust('#f0cf7a', 220, true);
  } else { // caramel: окунутая половинка + полоски
    g.globalAlpha = 1; g.fillStyle = '#b97a41';
    wrap(o => { g.beginPath(); g.moveTo(o, H); for (let x = 0; x <= W; x += 32) g.lineTo(o + x, H * .56 + Math.sin(x / 70) * 14 + Math.sin(x / 23) * 5); g.lineTo(o + W, H); g.fill(); });
    air(W * .4, H * .8, 260, '#e7b77a', .35);
    g.strokeStyle = '#fff2e0'; g.lineWidth = 3; g.globalAlpha = .9;
    for (let i = 0; i < 9; i++) wrap(o => { g.beginPath(); const y0 = H * (.18 + i * .035); g.moveTo(o, y0); for (let x = 0; x <= W; x += 40) g.lineTo(o + x, y0 + Math.sin(x / 90 + i * 1.7) * 18); g.stroke(); });
  }
  g.globalAlpha = 1;
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const metal = new THREE.CanvasTexture(m);
  return { map, metal };
}

/* Заглушка для стеклянного шара, пока грузится фото (или если фото недоступно) */
function bonbonPicture(seed) {
  const s = 512, c = document.createElement('canvas'); c.width = c.height = s;
  const g = c.getContext('2d'), r = rng(seed);
  const bg = g.createRadialGradient(s * .5, s * .45, 20, s * .5, s * .5, s * .7);
  bg.addColorStop(0, '#5a3322'); bg.addColorStop(1, '#1a0b05'); g.fillStyle = bg; g.fillRect(0, 0, s, s);
  const b = g.createRadialGradient(s * .42, s * .38, 10, s * .5, s * .5, s * .26);
  b.addColorStop(0, '#d8667d'); b.addColorStop(.55, '#8f3a4d'); b.addColorStop(1, '#2e1418');
  g.fillStyle = b; g.beginPath(); g.arc(s * .5, s * .5, s * .26, 0, 7); g.fill();
  g.fillStyle = '#f6e3d3'; for (let i = 0; i < 120; i++) { const a = r() * 6.28, d = r() * s * .24; g.globalAlpha = r(); g.beginPath(); g.arc(s * .5 + Math.cos(a) * d, s * .5 + Math.sin(a) * d, 1 + r() * 2, 0, 7); g.fill(); }
  g.globalAlpha = .6; g.fillStyle = '#fff'; g.beginPath(); g.ellipse(s * .42, s * .38, 26, 14, -.6, 0, 7); g.fill();
  return new THREE.CanvasTexture(c);
}

/* ── Стекло: гранёная оболочка, фото конфеты внутри преломляется гранями,
      по краям граней фирменная кайма (малина ↔ фисташка) вместо радуги ── */
const glassVS = `
varying vec3 vView; varying vec3 vCenter; varying float vRad;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vRad = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  gl_Position = projectionMatrix * mv;
}`;
const glassFS = `
uniform sampler2D uMap; uniform vec3 uRasp; uniform vec3 uPist; uniform float uRefr;
varying vec3 vView; varying vec3 vCenter; varying float vRad;
float lum(vec3 c){ return dot(c, vec3(.299, .587, .114)); }
void main(){
  vec3 n = normalize(cross(dFdx(vView), dFdy(vView)));
  vec3 v = normalize(-vView);
  if (dot(n, v) < 0.0) n = -n;
  vec2 p = (vView.xy - vCenter.xy) / vRad;
  vec2 base = 0.5 + p * 0.34;
  vec2 off = n.xy * uRefr;
  vec3 s1 = texture2D(uMap, base - off * 0.84).rgb;
  vec3 s2 = texture2D(uMap, base - off).rgb;
  vec3 s3 = texture2D(uMap, base - off * 1.16).rgb;
  float d = lum(s1) - lum(s3);
  vec3 col = s2 + uRasp * max(d, 0.0) * 1.8 + uPist * max(-d, 0.0) * 1.8;
  float mask = 1.0 - smoothstep(0.28, 0.45, length(base - off - 0.5));
  float fres = pow(1.0 - max(dot(n, v), 0.0), 2.4);
  vec3 L1 = normalize(vec3(-.5, .8, .6)), L2 = normalize(vec3(.7, -.25, .65));
  float sp = pow(max(dot(reflect(-L1, n), v), 0.0), 56.0) * .8 + pow(max(dot(reflect(-L2, n), v), 0.0), 22.0) * .3;
  col = mix(vec3(.96, .91, .87), col * vec3(1.03, .99, .95), mask);
  float a = mix(0.16, 1.0, mask);
  col = mix(col, vec3(1.0, .97, .94), fres * .55) + sp;
  a = clamp(a + fres * .6 + sp, 0.0, 1.0);
  gl_FragColor = vec4(col, a);
}`;

function photoURL(key) {
  const src = (window.CHOC_PHOTOS && window.CHOC_PHOTOS[key]) || ('images/' + key);
  return /images\.unsplash\.com/.test(src) ? src.replace(/w=\d+/, 'w=512&h=512') : src;
}

function init() {
  const back = document.querySelector('.bb-back'), front = document.querySelector('.bb-front');
  if (!back || !hasGL() || (navigator.connection && navigator.connection.saveData)) { document.documentElement.classList.add('bb-off'); return; }

  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mq = matchMedia('(max-width: 1023px)');
  const geo = new THREE.IcosahedronGeometry(1, 1); // 80 граней: шар, но грани читаются
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const brand = (h) => new THREE.Color(h).toArray();

  // материалы расписных бонбонов (общие для обоих слоёв)
  const painted = {};
  ['rasp', 'pist', 'gold', 'caramel'].forEach((f, i) => {
    const { map, metal } = paint(f, 11 + i * 7);
    painted[f] = new THREE.MeshPhysicalMaterial({
      map, metalnessMap: metal, metalness: 1, roughness: f === 'gold' ? .22 : .3,
      clearcoat: .85, clearcoatRoughness: .08, flatShading: true, envMapIntensity: .55,
    });
  });
  const glassMats = {};
  const glassMat = (key, seed) => {
    if (glassMats[key]) return glassMats[key];
    const mat = new THREE.ShaderMaterial({
      vertexShader: glassVS, fragmentShader: glassFS, transparent: true,
      uniforms: { uMap: { value: bonbonPicture(seed) }, uRasp: { value: brand(BRAND.rasp) }, uPist: { value: brand(BRAND.pist) }, uRefr: { value: .16 } },
    });
    loader.load(photoURL(key), (t) => { t.minFilter = THREE.LinearFilter; mat.uniforms.uMap.value = t; });
    return (glassMats[key] = mat);
  };

  const layers = {};
  function makeLayer(canvas, mobile) {
    const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: !mobile, powerPreference: 'high-performance' });
    renderer.setClearColor(0x000000, 0);
    renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    const scene = new THREE.Scene();
    const pmrem = new THREE.PMREMGenerator(renderer);
    scene.environment = pmrem.fromScene(new RoomEnvironment(renderer), .04).texture;
    const key = new THREE.DirectionalLight(0xffe2c4, 2.2); key.position.set(-4, 6, 6); scene.add(key);
    const rim = new THREE.DirectionalLight(0xf2b8c4, 1.1); rim.position.set(5, -2, 3); scene.add(rim);
    const camera = new THREE.PerspectiveCamera(FOV, 1, .1, 60); camera.position.z = CAMZ;
    return { renderer, scene, camera, canvas, balls: [], shown: false };
  }

  let balls = [], isMobile = mq.matches, W = 0, H = 0;
  const tanH = Math.tan(THREE.MathUtils.degToRad(FOV / 2));

  function build() {
    balls.forEach(b => b.layer.scene.remove(b.mesh)); balls = [];
    isMobile = mq.matches;
    const list = isMobile ? MOBILE : DESKTOP;
    if (!layers.b) layers.b = makeLayer(back, isMobile);
    if (!isMobile && front && !layers.f) layers.f = makeLayer(front, false);
    if (front) front.style.display = isMobile ? 'none' : '';
    const r = rng(7);
    list.forEach((cfg, i) => {
      const [sec, yf, xf, size, type, what, layerKey, speed] = cfg;
      const layer = layers[layerKey] || layers.b;
      const mesh = new THREE.Mesh(geo, type === 'g' ? glassMat(what, i) : painted[what]);
      mesh.rotation.set(r() * 6, r() * 6, r() * 6);
      layer.scene.add(mesh);
      const axis = new THREE.Vector3(r() - .5, r() - .5, r() - .5).normalize();
      balls.push({
        sec, yf, xf, size0: size, speed, layer, mesh, axis,
        z: layerKey === 'f' ? 1 + r() * 1.5 : -2 + r() * 2,
        spin: .15 + r() * .25, amp: 8 + r() * 10,
        w1: .25 + r() * .25, w2: .35 + r() * .3, p1: r() * 6.28, p2: r() * 6.28,
        ox: 0, oy: 0, ax: 0, ay: 0, size: size,
      });
    });
    measure();
  }

  function measure() {
    W = innerWidth; H = innerHeight;
    const dpr = Math.min(devicePixelRatio || 1, isMobile ? 1.5 : 2);
    Object.values(layers).forEach(L => { L.renderer.setPixelRatio(dpr); L.renderer.setSize(W, H, false); L.camera.aspect = W / H; L.camera.updateProjectionMatrix(); });
    const secs = [...document.querySelectorAll('main > section')];
    const k = isMobile ? Math.min(Math.max(W / 390, .85), 1.3) : Math.min(Math.max(W / 1440, .75), 1.35);
    balls.forEach(b => {
      const s = secs[b.sec]; if (!s) return;
      const rc = s.getBoundingClientRect();
      b.ay = rc.top + scrollY + b.yf * rc.height; b.ax = b.xf * W; b.size = b.size0 * k;
    });
  }

  // мышь: шары мягко отплывают
  let mx = -9999, my = -9999;
  addEventListener('pointermove', e => { if (e.pointerType === 'mouse') { mx = e.clientX; my = e.clientY; } }, { passive: true });
  document.addEventListener('mouseleave', () => { mx = my = -9999; });

  let last = performance.now(), lastScroll = scrollY, boost = 0, acc = 0, dirty = true;
  addEventListener('scroll', () => { dirty = true; }, { passive: true });
  const q = new THREE.Quaternion();

  function frame(now) {
    requestAnimationFrame(frame);
    let dt = Math.min((now - last) / 1000, 1 / 20); last = now;
    if (isMobile) { acc += dt; if (acc < 1 / 30) return; dt = acc; acc = 0; } // телефон: 30 кадров
    if (document.body.style.overflow === 'hidden') return; // открыт заказ
    if (reduce && !dirty) return;
    dirty = false;
    const t = now / 1000, sc = scrollY;
    const vel = (sc - lastScroll) / Math.max(dt, 1e-3); lastScroll = sc;
    boost += (Math.min(Math.abs(vel) * .003, 4) - boost) * Math.min(dt * 4, 1);
    Object.values(layers).forEach(L => { L.visible = false; });
    for (const b of balls) {
      let sy = H / 2 + (b.ay - sc - H / 2) * b.speed, sx = b.ax;
      if (!reduce) { sx += b.amp * Math.sin(t * b.w1 + b.p1); sy += b.amp * .8 * Math.sin(t * b.w2 + b.p2); }
      const dx = sx - mx, dy = sy - my, d = Math.hypot(dx, dy) || 1, R = b.size * 1.2 + 70;
      const push = d < R && !reduce ? (1 - d / R) ** 2 * 46 : 0;
      b.ox += (dx / d * push - b.ox) * Math.min(dt * 5, 1); b.oy += (dy / d * push - b.oy) * Math.min(dt * 5, 1);
      sx += b.ox; sy += b.oy;
      const vis = sy + b.size > -40 && sy - b.size < H + 40;
      b.mesh.visible = vis; if (!vis) continue;
      b.layer.visible = true;
      const px2w = 2 * tanH * (CAMZ - b.z) / H;
      b.mesh.position.set((sx - W / 2) * px2w, -(sy - H / 2) * px2w, b.z);
      b.mesh.scale.setScalar(b.size / 2 * px2w);
      if (!reduce) { q.setFromAxisAngle(b.axis, b.spin * (1 + boost) * dt + push * .0006); b.mesh.quaternion.premultiply(q); }
    }
    Object.values(layers).forEach(L => {
      if (L.visible || L.shown) { L.renderer.render(L.scene, L.camera); L.shown = L.visible; }
    });
  }

  build();
  let rt; const onResize = () => { clearTimeout(rt); rt = setTimeout(() => { if (mq.matches !== isMobile) build(); else measure(); dirty = true; }, 120); };
  addEventListener('resize', onResize);
  new ResizeObserver(onResize).observe(document.querySelector('main'));
  requestAnimationFrame(frame);
  requestAnimationFrame(() => document.documentElement.classList.add('bb-on'));
}

if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
