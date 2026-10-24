/* Choc Oh! — парящие гранёные бонбоны (three.js 0.160)
   Два слоя: .bb-back (под матовым стеклом и контентом) и .bb-front (перед карточками, только десктоп).
   Шары привязаны к секциям: [секция, доля высоты (0..1, 1 = стык со следующей), доля ширины,
   диаметр px (при 1440 / 390), тип, вкус|фото, слой, скорость параллакса].
   Пересборка: npx esbuild bonbons.js --bundle --format=iife --minify --alias:three/addons=three/examples/jsm --outfile=bonbons.bundle.js */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';

import { DESKTOP, MOBILE } from './layout.js';
import { BRAND, hasGL, rng, paint, bonbonPicture, glassVS, glassFS, photoURL } from './materials.js';

const FOV = 35, CAMZ = 10;

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
