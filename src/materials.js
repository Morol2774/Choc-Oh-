/* Choc Oh! — материалы бонбонов: роспись, стекло с фото внутри. Общие для 3D и генератора спрайтов. */
import * as THREE from 'three';

export const BRAND = { rasp: '#B8445C', pist: '#A9B388', gold: '#D4A44C' };

export function hasGL() {
  try { const c = document.createElement('canvas'); return !!c.getContext('webgl2'); } catch (e) { return false; }
}

export function rng(seed) { // mulberry32
  return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; };
}

/* ── Роспись бонбона: карта цвета + карта металла (золото), развёртка 1024×512 ── */
export function paint(flavor, seed, W = 1024) {
  const H = 512, r = rng(seed), K = W / 1024; // K: доля полной развёртки (для периодичной росписи)
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
  const dust = (col, n, metal) => { n = Math.round(n * K) || 1; for (let i = 0; i < n; i++) { const x = r() * W, y = H * (.15 + r() * .7), s = .6 + r() * 2.2; blob(g, x, y, s, col, .5 + r() * .5); if (metal) blob(mg, x, y, s, '#fff'); } };
  const gold = (x, y, s) => { // кусочек сусального золота
    const pts = []; const k = 5 + (r() * 4 | 0);
    for (let i = 0; i < k; i++) { const a = i / k * 6.28 + r() * .5, d = s * (.5 + r() * .7); pts.push([x + Math.cos(a) * d, y + Math.sin(a) * d * .7]); }
    [g, mg].forEach((ctx, j) => wrap(o => { ctx.globalAlpha = 1; ctx.fillStyle = j ? '#fff' : (r() > .5 ? '#e2bb63' : '#c9963e'); ctx.beginPath(); pts.forEach(([px, py], i) => i ? ctx.lineTo(px + o, py) : ctx.moveTo(px + o, py)); ctx.closePath(); ctx.fill(); }));
  };
  if (flavor === 'rasp') {
    air(W * .3, H * .45, 260 * Math.max(K, .5), BRAND.rasp, .55); air(W * .78, H * .5, 200 * Math.max(K, .5), '#e2788c', .4);
    for (let i = 0; i < Math.max(1, Math.round(4 * K)); i++) splatter(r() * W, H * (.3 + r() * .4), 30 + r() * 40, i % 2 ? BRAND.rasp : '#d8667d', 14);
    dust('#f6e3d3', 260, false);
  } else if (flavor === 'pist') {
    g.globalAlpha = 1;
    for (let i = 0; i < 3; i++) wrap(o => { g.strokeStyle = i === 1 ? '#c7cf9f' : BRAND.pist; g.lineWidth = 46 - i * 12; g.lineCap = 'round'; g.beginPath(); const y0 = H * (.35 + i * .12); g.moveTo(o - 20, y0); for (let x = 0; x <= W + 40; x += 16) g.lineTo(o + x, y0 + Math.sin(x / W * 6.2832 * Math.max(1, Math.round(1.36 * K)) + i) * 34); g.stroke(); });
    air(W * .6, H * .7, 220, '#7f8d5a', .35);
    dust('#e2bb63', 320, true);
  } else if (flavor === 'gold') {
    air(W * .5, H * .5, 380, '#5a2a18', .45);
    for (let i = 0; i < Math.max(3, Math.round(14 * K)); i++) gold(r() * W, H * (.25 + r() * .5), 18 + r() * 34);
    dust('#f0cf7a', 220, true);
  } else { // caramel: окунутая половинка + полоски
    g.globalAlpha = 1; g.fillStyle = '#b97a41';
    wrap(o => { g.beginPath(); g.moveTo(o, H); for (let x = 0; x <= W; x += 8) g.lineTo(o + x, H * .56 + Math.sin(x / W * 6.2832 * Math.max(1, Math.round(2.33 * K))) * 14 + Math.sin(x / W * 6.2832 * Math.max(1, Math.round(7.1 * K))) * 5); g.lineTo(o + W, H); g.fill(); });
    air(W * .4, H * .8, 260, '#e7b77a', .35);
    g.strokeStyle = '#fff2e0'; g.lineWidth = 3; g.globalAlpha = .9;
    for (let i = 0; i < 9; i++) wrap(o => { g.beginPath(); const y0 = H * (.18 + i * .035); g.moveTo(o, y0); for (let x = 0; x <= W; x += 10) g.lineTo(o + x, y0 + Math.sin(x / W * 6.2832 * Math.max(1, Math.round(1.8 * K)) + i * 1.7) * 18); g.stroke(); });
  }
  g.globalAlpha = 1;
  const map = new THREE.CanvasTexture(c); map.colorSpace = THREE.SRGBColorSpace; map.anisotropy = 4;
  const metal = new THREE.CanvasTexture(m);
  return { map, metal };
}

/* Заглушка для стеклянного шара, пока грузится фото (или если фото недоступно) */
export function bonbonPicture(seed) {
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
export const glassVS = `
varying vec3 vView; varying vec3 vCenter; varying float vRad;
void main(){
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vView = mv.xyz;
  vCenter = (modelViewMatrix * vec4(0.0, 0.0, 0.0, 1.0)).xyz;
  vRad = length((modelViewMatrix * vec4(1.0, 0.0, 0.0, 0.0)).xyz);
  gl_Position = projectionMatrix * mv;
}`;
export const glassFS = `
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

export function photoURL(key) {
  const src = (window.CHOC_PHOTOS && window.CHOC_PHOTOS[key]) || ('images/' + key);
  return /images\.unsplash\.com/.test(src) ? src.replace(/w=\d+/, 'w=512&h=512') : src;
}
