import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { PILLARS, VISION } from '../data.js';
import { ramp, band, easeOutBack, easeInOutCubic, makeLabel, setLabel } from '../util.js';

// The pilot SME: one building per pillar on a shared site. It starts as a neutral "clay"
// model, takes its pillar colours in chapter 5, and explodes so each pillar can be explored.

const V2 = (x, y) => new THREE.Vector2(x, y);
const CLAY = new THREE.Color('#f6f6f8'); // architectural-model white
const PLATFORM_TOP = 0.14;
const EXPLODE_DISTANCE = 1.3;

const MAT = {
  glass: new THREE.MeshStandardMaterial({ color: '#1c2a5e', emissive: '#001489', emissiveIntensity: 0.4, roughness: 0.15, metalness: 0.2 }),
  warm: new THREE.MeshStandardMaterial({ color: '#3a2a1a', emissive: '#ffc98a', emissiveIntensity: 0.9 }),
  panel: new THREE.MeshStandardMaterial({ color: '#23285a', roughness: 0.3, metalness: 0.5 }),
  white: new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
  dark: new THREE.MeshStandardMaterial({ color: '#2a2833', roughness: 0.8 }),
  site: new THREE.MeshStandardMaterial({ color: '#dcdae3', roughness: 0.9 }),
  crate: new THREE.MeshStandardMaterial({ color: '#c9b79a', roughness: 0.9 }),
  leaf: new THREE.MeshStandardMaterial({ color: '#7fae8f', roughness: 0.9, flatShading: true }),
  trunk: new THREE.MeshStandardMaterial({ color: '#8a7f75', roughness: 1 }),
  led: new THREE.MeshBasicMaterial({ color: '#001489' }),
};

function mesh(geometry, material) {
  const m = new THREE.Mesh(geometry, material);
  m.castShadow = m.receiveShadow = true;
  return m;
}

function box(w, h, d, material, x = 0, y = h / 2, z = 0) {
  const m = mesh(new THREE.BoxGeometry(w, h, d), material);
  m.position.set(x, y, z);
  return m;
}

// Triangular prism extruded along z (gable roofs, saw-tooth sheds).
function prism(points, depth, material) {
  const g = new THREE.ExtrudeGeometry(new THREE.Shape(points), { depth, bevelEnabled: false });
  g.translate(0, 0, -depth / 2);
  return mesh(g, material);
}

function tree(x, z, s = 1) {
  const g = new THREE.Group();
  g.add(mesh(new THREE.CylinderGeometry(0.02 * s, 0.03 * s, 0.14 * s, 6), MAT.trunk).translateY(0.07 * s));
  g.add(mesh(new THREE.IcosahedronGeometry(0.15 * s, 0), MAT.leaf).translateY(0.24 * s));
  g.position.set(x, PLATFORM_TOP, z);
  return g;
}

// ---- Buildings (local origin = ground centre of the building) ----

function buildTechnological(body) {
  const g = new THREE.Group();
  g.add(box(2.0, 0.55, 1.1, body));
  for (let i = 0; i < 4; i++) {
    const x = -1 + i * 0.5;
    g.add(prism([V2(0, 0), V2(0.5, 0), V2(0, 0.26)], 1.1, body).translateX(x).translateY(0.55));
    const pane = new THREE.Mesh(new THREE.PlaneGeometry(1.04, 0.22), MAT.glass);
    pane.rotation.y = -Math.PI / 2;
    pane.position.set(x - 0.003, 0.68, 0);
    g.add(pane);
  }
  g.add(box(0.34, 0.3, 0.02, MAT.dark, -0.5, 0.15, 0.56));
  g.add(box(0.34, 0.3, 0.02, MAT.dark, 0.3, 0.15, 0.56));
  g.add(mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.5, 6), MAT.white).translateX(0.85).translateY(1.05));
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.03, 10, 8), MAT.led);
  led.position.set(0.85, 1.32, 0);
  g.add(led);
  return { g, h: 0.81, led };
}

function buildEnvironmental(body) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.45, 0.9, body));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      const p = box(0.24, 0.02, 0.34, MAT.panel, -0.28 + c * 0.28, 0.52, -0.2 + r * 0.4);
      p.rotation.x = 0.35;
      g.add(p);
    }
  }
  // Wind turbine
  const turbine = new THREE.Group();
  turbine.position.set(-0.35, 0, 0.78);
  turbine.add(mesh(new THREE.CylinderGeometry(0.02, 0.035, 1.5, 8), MAT.white).translateY(0.75));
  turbine.add(box(0.08, 0.06, 0.14, MAT.white, 0, 1.5, 0));
  const rotor = new THREE.Group();
  rotor.position.set(0, 1.5, 0.08);
  for (let k = 0; k < 3; k++) {
    const pivot = new THREE.Group();
    pivot.rotation.z = (k * Math.PI * 2) / 3;
    pivot.add(box(0.035, 0.55, 0.01, MAT.white, 0, 0.29, 0));
    rotor.add(pivot);
  }
  turbine.add(rotor);
  g.add(turbine);
  return { g, h: 0.55, rotor };
}

function buildSocial(body) {
  const g = new THREE.Group();
  g.add(box(0.9, 0.6, 0.8, body));
  for (let r = 0; r < 2; r++) {
    for (let c = 0; c < 3; c++) {
      g.add(box(0.16, 0.12, 0.01, MAT.warm, -0.28 + c * 0.28, 0.2 + r * 0.22, 0.405));
    }
  }
  g.add(box(0.5, 0.03, 0.18, MAT.white, 0, 0.62, 0.3));
  return { g, h: 0.63 };
}

function buildEconomic(body) {
  const g = new THREE.Group();
  g.add(box(0.8, 0.4, 0.7, body));
  g.add(prism([V2(-0.42, 0), V2(0.42, 0), V2(0, 0.18)], 0.72, body).translateY(0.4));
  g.add(box(0.26, 0.24, 0.02, MAT.dark, 0, 0.12, 0.355));
  [[0.25, 0.45], [0.41, 0.45], [0.33, 0.45, 1]].forEach(([x, z, up]) => {
    g.add(box(0.14, 0.14, 0.14, MAT.crate, x, 0.07 + (up ? 0.14 : 0), z));
  });
  return { g, h: 0.58 };
}

function buildLegal(body) {
  const g = new THREE.Group();
  g.add(box(0.5, 0.8, 0.5, body));
  g.add(prism([V2(-0.3, 0), V2(0.3, 0), V2(0, 0.16)], 0.54, body).translateY(0.8));
  for (let i = 0; i < 4; i++) {
    g.add(mesh(new THREE.CylinderGeometry(0.022, 0.022, 0.36, 8), MAT.white).translateX(-0.18 + i * 0.12).translateY(0.18).translateZ(0.33));
  }
  g.add(box(0.5, 0.04, 0.14, MAT.white, 0, 0.38, 0.32));
  return { g, h: 0.96 };
}

const LAYOUT = {
  environmental: { home: [-1.45, 0.55], dir: [-1, 0.35, 0.25], build: buildEnvironmental },
  social: { home: [1.45, 0.55], dir: [1, 0.35, 0.25], build: buildSocial },
  economic: { home: [0.45, 1.05], dir: [0.45, 0.35, 1], build: buildEconomic },
  legal: { home: [-0.45, 1.05], dir: [-0.25, 0.35, 1], build: buildLegal },
  technological: { home: [0, -0.7], dir: [0, 0.35, -1], build: buildTechnological },
};

// Digital layer: technology links to every pillar, plus a ring along the front.
const NETWORK = [
  ['technological', 'environmental'], ['technological', 'social'], ['technological', 'economic'],
  ['technological', 'legal'], ['environmental', 'legal'], ['legal', 'economic'], ['economic', 'social'],
];

export function createFactory(scene, position, { onSelect }) {
  const group = new THREE.Group();
  group.position.copy(position);
  group.visible = false;
  scene.add(group);

  const platform = mesh(new RoundedBoxGeometry(4.4, PLATFORM_TOP, 3.6, 2, 0.05), MAT.site);
  platform.position.y = PLATFORM_TOP / 2;
  group.add(platform);
  [[-2.0, -1.45], [-1.7, -1.55, 0.8], [2.0, -1.45], [1.95, -0.35, 0.85], [2.0, 1.5], [-1.3, 1.5, 0.8], [1.3, 1.55, 0.7]]
    .forEach(([x, z, s]) => group.add(tree(x, z, s)));

  let hovered = null;
  let selected = null;

  const buildings = PILLARS.map((p) => {
    const L = LAYOUT[p.id];
    const body = new THREE.MeshStandardMaterial({ color: CLAY.clone(), roughness: 0.7, flatShading: true });
    const { g, h, rotor, led } = L.build(body);
    const home = new THREE.Vector3(L.home[0], PLATFORM_TOP, L.home[1]);
    g.position.copy(home);
    g.userData.pillar = p.id;
    group.add(g);

    const label = makeLabel(`<i></i>${p.name}`, 'lbl lbl--pillar');
    label.element.style.setProperty('--c', p.color);
    label.element.setAttribute('role', 'button');
    label.element.tabIndex = 0;
    label.element.addEventListener('click', () => onSelect(p.id));
    label.element.addEventListener('keydown', (e) => { if (e.key === 'Enter') onSelect(p.id); });
    label.position.set(0, h + 0.45, 0);
    g.add(label);

    return {
      id: p.id, g, body, h, rotor, led, home, label, glow: 0,
      dir: new THREE.Vector3(...L.dir).normalize(), color: new THREE.Color(p.color),
    };
  });
  const byId = Object.fromEntries(buildings.map((b) => [b.id, b]));

  // ---- Layer 1: strategic vision halo ----
  const vision = new THREE.Group();
  vision.position.y = 2.3;
  group.add(vision);
  const haloMat = new THREE.MeshBasicMaterial({ color: '#001489', transparent: true, depthWrite: false });
  const halo = new THREE.Mesh(new THREE.TorusGeometry(2.3, 0.018, 8, 160), haloMat);
  halo.rotation.x = Math.PI / 2;
  const innerHalo = new THREE.Mesh(new THREE.TorusGeometry(1.5, 0.01, 8, 120), haloMat);
  innerHalo.rotation.x = Math.PI / 2;
  const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.5, 12), haloMat);
  beam.position.y = -0.75;
  vision.add(halo, innerHalo, beam);
  const spokePts = [];
  const visionLabels = VISION.map((text, i) => {
    const a = (i / VISION.length) * Math.PI * 2 + Math.PI / 4;
    const p = new THREE.Vector3(Math.cos(a) * 2.3, 0, Math.sin(a) * 2.3);
    spokePts.push(new THREE.Vector3(), p);
    const label = makeLabel(text, 'lbl lbl--vision');
    label.position.copy(p).setY(0.2);
    vision.add(label);
    return label;
  });
  vision.add(new THREE.LineSegments(new THREE.BufferGeometry().setFromPoints(spokePts), haloMat));

  // ---- Digital layer network ----
  const netPos = new Float32Array(NETWORK.length * 6);
  const netGeo = new THREE.BufferGeometry();
  netGeo.setAttribute('position', new THREE.BufferAttribute(netPos, 3));
  const netMat = new THREE.LineBasicMaterial({ color: '#001489', transparent: true, opacity: 0, depthWrite: false });
  const netLines = new THREE.LineSegments(netGeo, netMat);
  netLines.frustumCulled = false;
  group.add(netLines);
  const pulseMat = new THREE.MeshBasicMaterial({ color: '#3a5cff', transparent: true, depthWrite: false });
  const pulses = NETWORK.map(() => {
    const m = new THREE.Mesh(new THREE.SphereGeometry(0.045, 10, 8), pulseMat);
    group.add(m);
    return m;
  });
  const netLabel = makeLabel('Digital layer · connects every pillar', 'lbl lbl--digital');
  group.add(netLabel);

  const nodeA = new THREE.Vector3();
  const nodeB = new THREE.Vector3();
  const node = (b, out) => out.copy(b.g.position).setY(b.g.position.y + b.h * b.g.scale.y + 0.15);

  function update(t, time) {
    const rise = ramp(t, 2.95, 3.5);
    group.visible = rise > 0;
    if (!group.visible) return;
    group.scale.setScalar(Math.max(easeOutBack(rise), 0.001));

    const colorAmt = ramp(t, 4.85, 5.25);
    const explode = easeInOutCubic(band(t, 4.95, 5.35, 5.8, 6.1));
    const sink = band(t, 6.75, 7.1, 7.75, 8.05);

    buildings.forEach((b) => {
      b.g.position.copy(b.home).addScaledVector(b.dir, EXPLODE_DISTANCE * explode);
      b.g.scale.y = Math.max(1 - sink, 0.001);
      b.g.visible = sink < 0.99;
      b.body.color.copy(CLAY).lerp(b.color, colorAmt);
      const focus = (b.id === hovered || b.id === selected) && explode > 0.3 ? 1 : 0;
      b.glow += (focus - b.glow) * 0.15;
      b.body.emissive.copy(b.color);
      b.body.emissiveIntensity = b.glow * 0.3;
      setLabel(b.label, explode);
      if (b.rotor) b.rotor.rotation.z = time * 1.6;
      if (b.led) b.led.visible = (time * 1.5) % 1 < 0.6;
    });

    const v = band(t, 3.75, 4.15, 4.8, 5.0);
    vision.visible = v > 0.01;
    haloMat.opacity = 0.85 * v;
    vision.rotation.y = time * 0.12;
    visionLabels.forEach((l) => setLabel(l, v));

    const n = ramp(explode, 0.5, 1);
    netLines.visible = n > 0.01;
    netMat.opacity = 0.9 * n;
    pulseMat.opacity = n;
    NETWORK.forEach(([a, b], i) => {
      node(byId[a], nodeA);
      node(byId[b], nodeB);
      netPos.set([nodeA.x, nodeA.y, nodeA.z, nodeB.x, nodeB.y, nodeB.z], i * 6);
      pulses[i].visible = n > 0.01;
      pulses[i].position.lerpVectors(nodeA, nodeB, (time * 0.45 + i * 0.21) % 1);
    });
    netGeo.attributes.position.needsUpdate = true;
    node(byId.technological, nodeA);
    netLabel.position.copy(nodeA).setY(nodeA.y + 0.9);
    setLabel(netLabel, n);
  }

  // Returns the pillar id under the ray, if the pillars are currently explorable.
  function pick(raycaster, t) {
    if (!(t > 5.0 && t < 6.0)) return null;
    const hit = raycaster.intersectObjects(buildings.map((b) => b.g), true)[0];
    let o = hit?.object;
    while (o && !o.userData.pillar) o = o.parent;
    return o ? o.userData.pillar : null;
  }

  return {
    group, update, pick,
    setHovered: (id) => { hovered = id; },
    setSelected: (id) => { selected = id; },
  };
}
