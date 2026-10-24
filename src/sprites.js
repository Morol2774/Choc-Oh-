/* Choc Oh! — генератор спрайтов бонбонов для телефона (и для компьютеров без WebGL).
   Рендерит каждый шар тем же материалом, что и 3D-сцена, в ленту из FRAMES кадров (WebP с прозрачностью).
   Шар — геодезическая сфера с осью симметрии 5-го порядка, поэтому поворот на 72° повторяет форму,
   а роспись повторяется 5 раз по кругу: 12 кадров дают бесшовную плавную петлю.
   Запуск: npm run sprites:build, затем откройте tools/sprites.html через локальный сервер. */
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { DESKTOP, MOBILE } from './layout.js';
import { BRAND, paint, bonbonPicture, glassVS, glassFS, photoURL } from './materials.js';

export const FRAMES = 10, SIZE = 112, QUALITY = .62;

function periodicGeometry() {
  const t = (1 + Math.sqrt(5)) / 2;
  const geo = new THREE.IcosahedronGeometry(1, 1);
  geo.applyQuaternion(new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, t).normalize(), new THREE.Vector3(0, 1, 0)));
  const p = geo.attributes.position, uv = geo.attributes.uv;
  for (let f = 0; f < p.count; f += 3) {
    const u = [], v = [];
    for (let k = 0; k < 3; k++) {
      const x = p.getX(f + k), y = p.getY(f + k), z = p.getZ(f + k);
      u.push(Math.abs(y) > .9999 ? NaN : Math.atan2(z, x) / (2 * Math.PI) + .5);
      v.push(1 - Math.acos(Math.max(-1, Math.min(1, y))) / Math.PI);
    }
    const ok = u.filter(x => !isNaN(x));
    if (Math.max(...ok) - Math.min(...ok) > .5) for (let k = 0; k < 3; k++) if (u[k] < .5) u[k] += 1;
    const avg = u.filter(x => !isNaN(x)).reduce((a, b) => a + b, 0) / ok.length;
    for (let k = 0; k < 3; k++) uv.setXY(f + k, isNaN(u[k]) ? avg : u[k], v[k]);
  }
  uv.needsUpdate = true;
  return geo;
}

export function kinds() {
  const seen = new Map();
  [...DESKTOP, ...MOBILE].forEach(([, , , , type, what]) => seen.set(type + ':' + what, [type, what]));
  return [...seen.values()];
}
export const spriteName = (what) => 'bb-' + what.replace(/\.[a-z]+$/i, '') + '.webp';

export async function renderSprites({ size = SIZE, frames = FRAMES, quality = QUALITY, onProgress } = {}) {
  const canvas = document.createElement('canvas');
  const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(1); renderer.setSize(size, size, false);
  renderer.setClearColor(0, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.05;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  const scene = new THREE.Scene();
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), .04).texture;
  const key = new THREE.DirectionalLight(0xffe2c4, 2.2); key.position.set(-4, 6, 6); scene.add(key);
  const rim = new THREE.DirectionalLight(0xf2b8c4, 1.1); rim.position.set(5, -2, 3); scene.add(rim);
  const camera = new THREE.PerspectiveCamera(20, 1, .1, 20); camera.position.z = 6.4;
  const geo = periodicGeometry();
  const tilt = new THREE.Group(); tilt.rotation.set(.55, 0, -.35); scene.add(tilt);
  const loader = new THREE.TextureLoader(); loader.setCrossOrigin('anonymous');
  const out = [];
  const list = kinds();
  for (let n = 0; n < list.length; n++) {
    const [type, what] = list[n];
    let mat;
    if (type === 'p') {
      const { map, metal } = paint(what, 11 + ['rasp', 'pist', 'gold', 'caramel'].indexOf(what) * 7, 256);
      [map, metal].forEach(t => { t.wrapS = THREE.RepeatWrapping; t.repeat.x = 5; });
      mat = new THREE.MeshPhysicalMaterial({ map, metalnessMap: metal, metalness: 1, roughness: what === 'gold' ? .22 : .3, clearcoat: .85, clearcoatRoughness: .08, flatShading: true, envMapIntensity: .55 });
    } else {
      let tex;
      try { tex = await loader.loadAsync(photoURL(what)); tex.minFilter = THREE.LinearFilter; } catch (e) { tex = bonbonPicture(n); }
      mat = new THREE.ShaderMaterial({ vertexShader: glassVS, fragmentShader: glassFS, transparent: true,
        uniforms: { uMap: { value: tex }, uRasp: { value: new THREE.Color(BRAND.rasp).toArray() }, uPist: { value: new THREE.Color(BRAND.pist).toArray() }, uRefr: { value: .16 } } });
    }
    const mesh = new THREE.Mesh(geo, mat); tilt.add(mesh);
    const strip = document.createElement('canvas'); strip.width = size * frames; strip.height = size;
    const g = strip.getContext('2d');
    for (let f = 0; f < frames; f++) {
      mesh.rotation.y = -f / frames * (2 * Math.PI / 5);
      renderer.render(scene, camera);
      g.drawImage(canvas, f * size, 0);
    }
    tilt.remove(mesh);
    const blob = await new Promise(res => strip.toBlob(res, 'image/webp', quality));
    out.push({ name: spriteName(what), blob, preview: strip.toDataURL('image/webp', quality) });
    onProgress && onProgress(n + 1, list.length);
  }
  renderer.dispose();
  return out;
}

window.ChocSprites = { renderSprites, kinds, spriteName, FRAMES, SIZE };
