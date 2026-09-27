import * as THREE from 'three';
import { CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';
import { PILLARS, MULTI, METZ } from './data.js';
import { geo, easeInOutCubic, clamp01 } from './util.js';
import { createMap, MAP_TOP } from './scenes/map.js';
import { createKpiCloud } from './scenes/kpiCloud.js';
import { createFactory } from './scenes/factory.js';
import { createConveyor } from './scenes/conveyor.js';
import { createWheel } from './scenes/wheel.js';

const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Renderer ----------
const container = document.getElementById('scene');
const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
renderer.toneMapping = THREE.NeutralToneMapping;
renderer.setClearColor(0x000000, 0); // the sky is a CSS gradient behind the canvas
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
container.appendChild(renderer.domElement);

const labelRenderer = new CSS2DRenderer();
labelRenderer.domElement.className = 'labels';
container.appendChild(labelRenderer.domElement);

const scene = new THREE.Scene();
const duskSky = document.querySelector('.sky--dusk');
const camera = new THREE.PerspectiveCamera(40, 1, 0.05, 400);

// ---------- World ----------
const m = geo(...METZ);
const FACTORY = new THREE.Vector3(m.x, MAP_TOP, m.z);

scene.add(new THREE.HemisphereLight('#ffffff', '#b9b4cc', 1.1));
const sun = new THREE.DirectionalLight('#fff6ec', 2.0);
sun.position.copy(FACTORY).add(new THREE.Vector3(6, 10, 5));
sun.target.position.copy(FACTORY);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -5, right: 5, top: 5, bottom: -5, near: 1, far: 30 });
sun.shadow.bias = -0.0005;
sun.shadow.normalBias = 0.02;
scene.add(sun, sun.target);
const rim = new THREE.DirectionalLight('#c9c3e6', 0.6);
rim.position.set(-8, 6, -10);
scene.add(rim);

const map = createMap(scene);
const cloud = createKpiCloud(scene, FACTORY.clone().setY(FACTORY.y + 0.6), renderer.getPixelRatio());
const factory = createFactory(scene, FACTORY, { onSelect: openPillar });
const conveyor = createConveyor(factory.group);
const wheel = createWheel(factory.group);

// ---------- Camera path: one key per chapter, reached mid-chapter ----------
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const F = (x, y, z) => FACTORY.clone().add(V(x, y, z));
const KEYS = [
  { pos: V(4, 30, 38), look: V(0, 0, 1) },            // 0 Greater Region
  { pos: V(0, 13, 24), look: V(0, 5.5, 0) },          // 1 The challenge
  { pos: V(0, 8.5, 21.5), look: V(0, 3.8, 0) },       // 2 Five pillars
  { pos: F(3.8, 3.4, 6.2), look: F(0, 0.5, 0) },      // 3 One SME
  { pos: F(0.5, 5.4, 7.2), look: F(0, 1.5, 0) },      // 4 Strategic vision
  { pos: F(2.2, 6.8, 8.8), look: F(0, 0.6, 0.3) },    // 5 Operational pillars
  { pos: F(-0.2, 2.9, 8.6), look: F(0.3, 0.4, 2.0) },  // 6 Customisation path
  { pos: F(0, 7.2, 5.6), look: F(0, 0.5, 0) },        // 7 Performance wheel
  { pos: V(9, 24, 32), look: V(1, 0, 2) },            // 8 Roadmap
];

const camPos = new THREE.Vector3();
const camLook = new THREE.Vector3();
const pointer = new THREE.Vector2(0, 0);
const parallax = new THREE.Vector2(0, 0);

function updateCamera(t, time) {
  const u = Math.min(Math.max(t - 0.5, 0), KEYS.length - 1);
  const i = Math.min(Math.floor(u), KEYS.length - 2);
  const f = easeInOutCubic(clamp01(u - i));
  camPos.lerpVectors(KEYS[i].pos, KEYS[i + 1].pos, f);
  camLook.lerpVectors(KEYS[i].look, KEYS[i + 1].look, f);

  // Gentle drift on the opening shot.
  if (!reduceMotion) {
    const drift = 1 - clamp01((t - 0.5) / 0.5);
    const a = Math.sin(time * 0.12) * 0.12 * drift;
    const dx = camPos.x - camLook.x, dz = camPos.z - camLook.z;
    camPos.x = camLook.x + dx * Math.cos(a) - dz * Math.sin(a);
    camPos.z = camLook.z + dx * Math.sin(a) + dz * Math.cos(a);
  }

  parallax.lerp(pointer, 0.05);
  const d = camPos.distanceTo(camLook) * 0.025;
  camera.position.set(camPos.x + parallax.x * d, camPos.y + parallax.y * d * 0.5, camPos.z);
  camera.lookAt(camLook);
}

// ---------- Scroll → story time ----------
const chapters = [...document.querySelectorAll('.chapter')];
let tops = [];
let heights = [];
function measure() {
  tops = chapters.map((c) => c.offsetTop);
  heights = chapters.map((c) => c.offsetHeight);
}
function scrollT() {
  const y = scrollY + innerHeight * 0.5;
  for (let i = chapters.length - 1; i >= 0; i--) {
    if (y >= tops[i]) return Math.min(i + (y - tops[i]) / heights[i], chapters.length - 0.001);
  }
  return 0;
}

// ---------- Layout ----------
function resize() {
  const w = innerWidth, h = innerHeight;
  renderer.setSize(w, h);
  labelRenderer.setSize(w, h);
  camera.aspect = w / h;
  // Portrait screens: widen the lens so the same shots still fit horizontally.
  camera.fov = camera.aspect < 1 ? Math.min(70, 40 / Math.pow(camera.aspect, 0.55)) : 40;
  // Shift the 3D content away from the text column (right on desktop, up on mobile).
  const wide = w > 900;
  camera.setViewOffset(w, h, wide ? -Math.min(240, w * 0.16) : 0, wide ? 0 : h * 0.22, w, h);
  camera.updateProjectionMatrix();
  cloud.setPixelRatio(renderer.getPixelRatio());
  measure();
}
addEventListener('resize', resize);
resize();

// ---------- UI: rail, legend, pillar buttons, drawer ----------
const rail = document.querySelector('.rail');
const railButtons = chapters.map((c, i) => {
  const b = document.createElement('button');
  b.innerHTML = `<span>${c.dataset.title}</span>`;
  b.setAttribute('aria-label', c.dataset.title);
  b.addEventListener('click', () => scrollTo({ top: tops[i] + (i === 0 ? 0 : heights[i] * 0.5 - innerHeight * 0.5), behavior: 'smooth' }));
  rail.appendChild(b);
  return b;
});

document.querySelector('[data-legend]').innerHTML = [...PILLARS, MULTI]
  .map((p) => `<li style="--c:${p.color}"><i></i>${p.name}<b>${p.count.toLocaleString('en')}</b></li>`).join('');

document.querySelector('[data-pillar-buttons]').innerHTML = PILLARS
  .map((p) => `<button type="button" data-pillar="${p.id}" style="--c:${p.color}"><i></i>${p.name}</button>`).join('');
document.querySelectorAll('[data-pillar]').forEach((b) => b.addEventListener('click', () => openPillar(b.dataset.pillar)));

const drawer = document.getElementById('drawer');
const drawerBody = drawer.querySelector('.drawer__body');
function openPillar(id) {
  const p = PILLARS.find((x) => x.id === id);
  drawer.style.setProperty('--c', p.color);
  drawerBody.innerHTML = `
    <p class="eyebrow">Pillar · ${p.count.toLocaleString('en')} raw indicators in WP1</p>
    <h3 id="drawer-title">${p.name}</h3>
    <p class="drawer__tagline">${p.tagline}</p>
    <div class="drawer__subs">
      ${p.subs.map((s) => `<section><h4>${s.name}</h4><ul>${s.kpis.map((k) => `<li>${k}</li>`).join('')}</ul></section>`).join('')}
    </div>
    <p class="drawer__refs"><span>Frameworks</span>${p.refs.map((r) => `<em>${r}</em>`).join('')}</p>`;
  drawer.classList.add('is-open');
  drawer.setAttribute('aria-hidden', 'false');
  factory.setSelected(id);
  drawer.querySelector('.drawer__close').focus({ preventScroll: true });
}
function closePillar() {
  drawer.classList.remove('is-open');
  drawer.setAttribute('aria-hidden', 'true');
  factory.setSelected(null);
}
drawer.querySelector('.drawer__close').addEventListener('click', closePillar);
addEventListener('keydown', (e) => { if (e.key === 'Escape') closePillar(); });

// ---------- Pointer: parallax + building picking ----------
const raycaster = new THREE.Raycaster();
let hoveredPillar = null;
addEventListener('pointermove', (e) => {
  pointer.set((e.clientX / innerWidth) * 2 - 1, -(e.clientY / innerHeight) * 2 + 1);
  if (e.target !== renderer.domElement) return setHover(null);
  raycaster.setFromCamera(pointer, camera);
  setHover(factory.pick(raycaster, t));
});
renderer.domElement.addEventListener('click', () => { if (hoveredPillar) openPillar(hoveredPillar); });
function setHover(id) {
  if (id === hoveredPillar) return;
  hoveredPillar = id;
  factory.setHovered(id);
  renderer.domElement.style.cursor = id ? 'pointer' : '';
}

// ---------- Deep link: ?at=5.3 opens the story at chapter 5, 30 % in ----------
const at = parseFloat(new URLSearchParams(location.search).get('at'));
if (at >= 0) {
  const i = Math.min(Math.floor(at), chapters.length - 1);
  document.documentElement.style.scrollBehavior = 'auto';
  scrollTo(0, tops[i] + (at - i) * heights[i] - innerHeight * 0.5);
}

// ---------- Loop ----------
let t = scrollT();
let activeChapter = -1;
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = Math.min(clock.getDelta(), 0.05);
  const time = clock.elapsedTime;
  t += (scrollT() - t) * (1 - Math.exp(-dt * (reduceMotion ? 20 : 5)));

  updateCamera(t, time);
  map.update(t, time);
  cloud.update(t, time);
  factory.update(t, time);
  conveyor.update(t, time);
  wheel.update(t);

  // Dusk sky for the opening, daylight for the story.
  duskSky.style.opacity = (1 - clamp01((t - 0.55) / 0.6)).toFixed(3);
  document.body.classList.toggle('is-dusk', t < 0.9);

  const chapter = Math.min(Math.floor(t), chapters.length - 1);
  if (chapter !== activeChapter) {
    activeChapter = chapter;
    railButtons.forEach((b, i) => b.classList.toggle('is-active', i === chapter));
    if (chapter !== 5) closePillar();
  }

  renderer.render(scene, camera);
  labelRenderer.render(scene, camera);
});

requestAnimationFrame(() => document.body.classList.add('is-ready'));
