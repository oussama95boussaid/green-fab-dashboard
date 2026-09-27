import * as THREE from 'three';
import { STEPS } from '../data.js';
import { band, clamp01, easeOutCubic, makeLabel, setLabel } from '../util.js';

// Layer 3: the customisation path as a production line. Each box is a company going through
// the five steps; it turns greener at every station it passes.

const LENGTH = 4.8;
const SPACING = 0.95;
const GREY = new THREE.Color('#b7b5c2');
const GREEN = new THREE.Color('#2e9d66');
const BOXES = 10;

export function createConveyor(parent) {
  const group = new THREE.Group();
  group.position.z = 2.45;
  group.visible = false;
  parent.add(group);

  const frameMat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 });
  const beltMat = new THREE.MeshStandardMaterial({ color: '#2a2833', roughness: 0.9 });
  const add = (geometry, material, x, y, z) => {
    const m = new THREE.Mesh(geometry, material);
    m.position.set(x, y, z);
    m.castShadow = m.receiveShadow = true;
    group.add(m);
    return m;
  };

  add(new THREE.BoxGeometry(LENGTH, 0.05, 0.34), beltMat, 0, 0.22, 0);
  add(new THREE.BoxGeometry(LENGTH, 0.07, 0.03), frameMat, 0, 0.22, 0.19);
  add(new THREE.BoxGeometry(LENGTH, 0.07, 0.03), frameMat, 0, 0.22, -0.19);
  for (let x = -LENGTH / 2 + 0.2; x <= LENGTH / 2; x += 0.8) {
    add(new THREE.BoxGeometry(0.04, 0.2, 0.3), frameMat, x, 0.1, 0);
  }

  const stationX = STEPS.map((_, i) => (i - (STEPS.length - 1) / 2) * SPACING);
  const labels = STEPS.map((step, i) => {
    const c = GREY.clone().lerp(GREEN, i / (STEPS.length - 1));
    const mat = new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.15, roughness: 0.5 });
    const x = stationX[i];
    add(new THREE.BoxGeometry(0.035, 0.5, 0.035), mat, x, 0.25, 0.23);
    add(new THREE.BoxGeometry(0.035, 0.5, 0.035), mat, x, 0.25, -0.23);
    add(new THREE.BoxGeometry(0.035, 0.035, 0.5), mat, x, 0.5, 0);
    const label = makeLabel(`<b>${i + 1}</b>${step}`, 'lbl lbl--step');
    label.position.set(x, 0.78, 0);
    group.add(label);
    return label;
  });

  const boxGeo = new THREE.BoxGeometry(0.16, 0.14, 0.16);
  const boxes = Array.from({ length: BOXES }, () => {
    const m = add(boxGeo, new THREE.MeshStandardMaterial({ color: GREY.clone(), roughness: 0.6 }), 0, 0.315, 0);
    return m;
  });

  function update(t, time) {
    const v = band(t, 5.95, 6.3, 6.75, 7.0);
    group.visible = v > 0.001;
    if (!group.visible) return;
    group.scale.y = Math.max(easeOutCubic(v), 0.001);
    labels.forEach((l) => setLabel(l, v));

    boxes.forEach((b, k) => {
      const f = (time * 0.07 + k / BOXES) % 1;
      const x = -LENGTH / 2 + f * LENGTH;
      const passed = stationX.filter((sx) => sx < x).length;
      b.position.x = x;
      b.material.color.copy(GREY).lerp(GREEN, passed / STEPS.length);
      b.scale.setScalar(Math.max(clamp01(f / 0.05) * clamp01((1 - f) / 0.05), 0.001));
    });
  }

  return { update };
}
