import * as THREE from 'three';
import { COUNTRIES, CITIES, LINKS } from '../data.js';
import { geo, makeLabel, setLabel, ramp, clamp01, easeOutCubic } from '../util.js';

export const MAP_TOP = 0.44; // extrusion depth + bevel

const arcVertex = /* glsl */ `
  varying vec2 vUv;
  void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }
`;
const arcFragment = /* glsl */ `
  uniform float uTime, uOpacity, uOffset;
  uniform vec3 uColor;
  varying vec2 vUv;
  void main() {
    float head = fract(vUv.x - uTime * 0.35 - uOffset);
    float pulse = smoothstep(0.8, 1.0, head);
    vec3 col = mix(uColor, vec3(0.23, 0.36, 1.0), pulse);
    gl_FragColor = vec4(col, (0.35 + 0.65 * pulse) * uOpacity);
    #include <colorspace_fragment>
  }
`;

export function createMap(scene) {
  const group = new THREE.Group();
  scene.add(group);

  // The map floats in the sky gradient: no ground, only a faint survey grid.
  const grid = new THREE.GridHelper(120, 40, '#ffffff', '#ffffff');
  grid.material.transparent = true;
  grid.material.opacity = 0.14;
  grid.material.depthWrite = false;
  group.add(grid);

  const edgeMat = new THREE.LineBasicMaterial({ color: '#000000', transparent: true, opacity: 0.22 });
  const countries = COUNTRIES.map((c, i) => {
    // Shape y = -z so that, after rotateX(-90°), north points to -z.
    const shape = new THREE.Shape(c.poly.map(([lon, lat]) => {
      const p = geo(lon, lat);
      return new THREE.Vector2(p.x, -p.z);
    }));
    const g = new THREE.ExtrudeGeometry(shape, {
      depth: 0.4, bevelEnabled: true, bevelSize: 0.06, bevelThickness: 0.04, bevelSegments: 1,
    });
    g.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ color: c.color, roughness: 0.9, flatShading: true }));
    mesh.castShadow = mesh.receiveShadow = true;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(g, 30), edgeMat);
    const holder = new THREE.Group();
    holder.add(mesh, edges);
    group.add(holder);

    const lp = geo(...c.label);
    const label = makeLabel(`${c.name}<span>${c.code}</span>`, 'lbl lbl--region');
    label.position.set(lp.x, MAP_TOP + 0.3, lp.z);
    group.add(label);
    return { holder, label, delay: 0.15 * i };
  });

  const dotMat = new THREE.MeshBasicMaterial({ color: '#000000' });
  const hubMat = new THREE.MeshBasicMaterial({ color: '#001489' });
  const ringGeo = new THREE.RingGeometry(0.18, 0.24, 32).rotateX(-Math.PI / 2);
  const cities = CITIES.map((c) => {
    const p = geo(c.lon, c.lat);
    const pin = new THREE.Group();
    pin.position.set(p.x, MAP_TOP + 0.02, p.z);
    const dot = new THREE.Mesh(new THREE.SphereGeometry(c.hub ? 0.16 : 0.1, 16, 12), c.hub ? hubMat : dotMat);
    dot.position.y = 0.12;
    const ringMat = new THREE.MeshBasicMaterial({
      color: '#001489', transparent: true, side: THREE.DoubleSide, depthWrite: false,
    });
    const ring = new THREE.Mesh(ringGeo, ringMat);
    ring.position.y = 0.02;
    pin.add(dot, ring);
    group.add(pin);

    const label = makeLabel(c.name, `lbl lbl--city${c.hub ? ' lbl--hub' : ''}`);
    label.position.set(p.x, MAP_TOP + 0.6, p.z);
    group.add(label);
    return { ...c, pin, ring, ringMat, label, phase: Math.random() };
  });

  const byName = Object.fromEntries(cities.map((c) => [c.name, c]));
  const arcMats = LINKS.map(([a, b], i) => {
    const A = byName[a].pin.position.clone().setY(MAP_TOP + 0.14);
    const B = byName[b].pin.position.clone().setY(MAP_TOP + 0.14);
    const mid = A.clone().add(B).multiplyScalar(0.5);
    mid.y += A.distanceTo(B) * 0.3 + 0.3;
    const mat = new THREE.ShaderMaterial({
      transparent: true, depthWrite: false,
      uniforms: {
        uTime: { value: 0 }, uOpacity: { value: 1 }, uOffset: { value: i * 0.137 },
        uColor: { value: new THREE.Color('#001489') },
      },
      vertexShader: arcVertex, fragmentShader: arcFragment,
    });
    group.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(A, mid, B), 64, 0.025, 6, false), mat));
    return mat;
  });

  function update(t, time) {
    countries.forEach((c) => {
      c.holder.scale.y = Math.max(0.02, easeOutCubic(clamp01((time - c.delay) / 1.2)));
    });

    // Map annotations belong to the overview shots: the opening and the closing roadmap.
    const overview = Math.max(1 - ramp(t, 0.6, 1.1), ramp(t, 7.6, 8.2));
    const intro = ramp(time, 1.2, 2.0);
    countries.forEach((c) => setLabel(c.label, overview * intro));

    cities.forEach((c) => {
      // The Metz pin gives way to the pilot factory from chapter 3 on.
      const show = c.hub ? 1 - ramp(t, 2.8, 3.0) : Math.max(1 - ramp(t, 2.6, 3.0), ramp(t, 7.6, 8.2));
      const s = show * easeOutCubic(ramp(time, 1.4 + c.phase * 0.6, 1.9 + c.phase * 0.6));
      c.pin.visible = s > 0.001;
      c.pin.scale.setScalar(Math.max(s, 0.001));
      const pulse = (time * 0.6 + c.phase) % 1;
      c.ring.scale.setScalar(1 + pulse * 2.5);
      c.ringMat.opacity = (1 - pulse) * 0.5;
      setLabel(c.label, overview * intro * show);
    });

    arcMats.forEach((m) => {
      m.uniforms.uTime.value = time;
      m.uniforms.uOpacity.value = Math.max(overview, 0.3 * (1 - ramp(t, 2.6, 3.0))) * intro;
    });
  }

  return { group, update };
}
