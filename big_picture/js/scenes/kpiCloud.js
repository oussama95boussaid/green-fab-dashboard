import * as THREE from 'three';
import { PILLARS, MULTI, FRAMEWORKS, KPI_SAMPLES } from '../data.js';
import { MAP_TOP } from './map.js';
import { makeLabel, setLabel, ramp, band } from '../util.js';

// One particle per raw WP1 indicator (2,710). They start as noise, sort themselves into
// pillar columns, then stream down into the pilot factory.

const CLOUD_CENTER = new THREE.Vector3(0, 6, 0);
const GRID = 6;          // particles per column row = GRID × GRID
const PITCH = 0.17;      // horizontal spacing inside a column
const LAYER = 0.19;      // vertical spacing between rows
const COLUMN_GAP = 2.4;

const vertexShader = /* glsl */ `
  attribute vec3 aChaos;
  attribute vec3 aOrder;
  attribute vec3 aColor;
  attribute float aSeed;
  uniform float uTime, uMix, uLand, uSize;
  uniform vec3 uLandPos;
  varying vec3 vColor;
  varying float vFade;

  void main() {
    float s = aSeed;
    vec3 drift = vec3(sin(uTime * 0.6 + s * 40.0), cos(uTime * 0.5 + s * 23.0), sin(uTime * 0.7 + s * 11.0)) * 0.35;
    float m = smoothstep(0.0, 1.0, clamp(uMix * 1.6 - s * 0.6, 0.0, 1.0));
    vec3 p = mix(aChaos + drift, aOrder + drift * 0.03, m);

    float l = smoothstep(0.0, 1.0, clamp(uLand * 1.6 - s * 0.6, 0.0, 1.0));
    vec3 target = uLandPos + (aChaos - vec3(0.0, 6.0, 0.0)) * 0.02;
    vec3 q = mix(p, target, l);
    q.y += sin(l * 3.14159) * 2.5;

    vFade = 1.0 - smoothstep(0.8, 1.0, l);
    vColor = mix(vec3(0.16, 0.15, 0.22), aColor, m);

    vec4 mv = modelViewMatrix * vec4(q, 1.0);
    gl_PointSize = uSize * (1.0 + (1.0 - m) * 0.5) / -mv.z;
    gl_Position = projectionMatrix * mv;
  }
`;

const fragmentShader = /* glsl */ `
  uniform float uOpacity;
  varying vec3 vColor;
  varying float vFade;
  void main() {
    float d = length(gl_PointCoord - 0.5);
    float a = smoothstep(0.5, 0.0, d);
    gl_FragColor = vec4(vColor, smoothstep(0.0, 0.35, a) * 0.85 * uOpacity * vFade);
    #include <colorspace_fragment>
  }
`;

function randomInCloud() {
  const r = 9 * Math.cbrt(Math.random());
  const th = Math.random() * Math.PI * 2;
  const ph = Math.acos(2 * Math.random() - 1);
  return [
    CLOUD_CENTER.x + r * Math.sin(ph) * Math.cos(th),
    CLOUD_CENTER.y + r * Math.cos(ph) * 0.55,
    CLOUD_CENTER.z + r * Math.sin(ph) * Math.sin(th),
  ];
}

export function createKpiCloud(scene, landPos, pixelRatio) {
  const groups = [...PILLARS, MULTI];
  const total = groups.reduce((s, p) => s + p.count, 0);
  const chaos = new Float32Array(total * 3);
  const order = new Float32Array(total * 3);
  const color = new Float32Array(total * 3);
  const seed = new Float32Array(total);

  const col = new THREE.Color();
  const columns = [];
  let i = 0;
  groups.forEach((p, c) => {
    col.set(p.color);
    const cx = (c - (groups.length - 1) / 2) * COLUMN_GAP;
    for (let k = 0; k < p.count; k++, i++) {
      const idx = k % (GRID * GRID);
      const layer = Math.floor(k / (GRID * GRID));
      chaos.set(randomInCloud(), i * 3);
      order.set([
        cx + ((idx % GRID) - (GRID - 1) / 2) * PITCH,
        MAP_TOP + 0.25 + layer * LAYER,
        (Math.floor(idx / GRID) - (GRID - 1) / 2) * PITCH,
      ], i * 3);
      color.set([col.r, col.g, col.b], i * 3);
      seed[i] = Math.random();
    }
    const top = MAP_TOP + 0.25 + Math.ceil(p.count / (GRID * GRID)) * LAYER;
    const label = makeLabel(`${p.name}<b>${p.count.toLocaleString('en')}</b>`, 'lbl lbl--col');
    label.element.style.setProperty('--c', p.color);
    label.position.set(cx, top + 0.6, 0);
    scene.add(label);
    columns.push(label);
  });

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute('position', new THREE.BufferAttribute(order, 3)); // for bounds only
  geometry.setAttribute('aChaos', new THREE.BufferAttribute(chaos, 3));
  geometry.setAttribute('aOrder', new THREE.BufferAttribute(order, 3));
  geometry.setAttribute('aColor', new THREE.BufferAttribute(color, 3));
  geometry.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));

  const uniforms = {
    uTime: { value: 0 }, uMix: { value: 0 }, uLand: { value: 0 }, uOpacity: { value: 0 },
    uSize: { value: 110 * pixelRatio }, uLandPos: { value: landPos },
  };
  const points = new THREE.Points(geometry, new THREE.ShaderMaterial({
    uniforms, vertexShader, fragmentShader,
    transparent: true, depthWrite: false,
  }));
  points.frustumCulled = false;
  scene.add(points);

  // Floating framework acronyms and real KPI names: the "noise" an SME faces.
  const tags = [...FRAMEWORKS.map((f) => [f, 'lbl lbl--tag']), ...KPI_SAMPLES.map((k) => [k, 'lbl lbl--kpi'])]
    .map(([text, cls], i, all) => {
      // Golden-angle spiral: evenly spread, no overlaps, same layout on every visit.
      const k = (i + 0.5) / all.length;
      const r = 2.2 + 5.8 * Math.sqrt(k);
      const a = i * 2.39996;
      const base = new THREE.Vector3(
        CLOUD_CENTER.x + Math.cos(a) * r,
        CLOUD_CENTER.y + (((i * 7) % 11) / 10 - 0.5) * 4.5,
        CLOUD_CENTER.z + Math.sin(a) * r * 0.6,
      );
      const label = makeLabel(text, cls);
      label.position.copy(base);
      scene.add(label);
      return { label, base, phase: Math.random() * 10 };
    });

  function update(t, time) {
    points.visible = t > 0.45 && t < 3.6;
    uniforms.uTime.value = time;
    uniforms.uOpacity.value = ramp(t, 0.5, 1.0);
    uniforms.uMix.value = ramp(t, 1.65, 2.45);
    uniforms.uLand.value = ramp(t, 2.75, 3.45);

    const tagAlpha = band(t, 0.75, 1.15, 1.7, 2.0);
    tags.forEach((g) => {
      g.label.position.set(
        g.base.x + Math.sin(time * 0.3 + g.phase) * 0.4,
        g.base.y + Math.cos(time * 0.25 + g.phase) * 0.3,
        g.base.z,
      );
      setLabel(g.label, tagAlpha);
    });
    const colAlpha = band(t, 2.3, 2.55, 2.75, 2.9);
    columns.forEach((c) => setLabel(c, colAlpha));
  }

  function setPixelRatio(pr) { uniforms.uSize.value = 110 * pr; }

  return { update, setPixelRatio };
}
