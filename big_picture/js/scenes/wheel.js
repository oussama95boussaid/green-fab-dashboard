import * as THREE from 'three';
import { PILLARS, SCORE } from '../data.js';
import { band, clamp01, ramp, easeOutBack, makeLabel, setLabel } from '../util.js';

// Green Factory Performance Wheel: one extruded ring sector per pillar, height = score.
// Scores are the illustrative values of the Activity 1 mock-up.

const R_IN = 0.95;
const R_OUT = 2.15;
const GAP = 0.06;

export function createWheel(parent) {
  const group = new THREE.Group();
  group.position.y = 0.15;
  group.visible = false;
  parent.add(group);

  const step = (Math.PI * 2) / PILLARS.length;
  const segments = PILLARS.map((p, i) => {
    // Clockwise from the far side (screen top when seen from the front).
    const aStart = Math.PI / 2 - i * step - GAP / 2;
    const aEnd = Math.PI / 2 - (i + 1) * step + GAP / 2;
    const shape = new THREE.Shape();
    shape.absarc(0, 0, R_OUT, aStart, aEnd, true);
    shape.absarc(0, 0, R_IN, aEnd, aStart, false);
    shape.closePath();

    const height = 0.15 + (p.score / 100) * 1.2;
    const geometry = new THREE.ExtrudeGeometry(shape, {
      depth: height, bevelEnabled: true, bevelSize: 0.02, bevelThickness: 0.02, bevelSegments: 1, curveSegments: 24,
    });
    geometry.rotateX(-Math.PI / 2);
    const mesh = new THREE.Mesh(geometry, new THREE.MeshStandardMaterial({
      color: p.color, roughness: 0.55, metalness: 0.05,
    }));
    mesh.castShadow = mesh.receiveShadow = true;
    group.add(mesh);

    const mid = (aStart + aEnd) / 2;
    const label = makeLabel(`${p.short}<b>${p.score}</b>`, 'lbl lbl--wheel');
    label.element.style.setProperty('--c', p.color);
    label.position.set(Math.cos(mid) * (R_OUT + 0.45), height + 0.25, -Math.sin(mid) * (R_OUT + 0.45));
    group.add(label);
    return { mesh, label, delay: i * 0.08 };
  });

  const disc = new THREE.Mesh(
    new THREE.CylinderGeometry(0.8, 0.8, 0.12, 48),
    new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.6 }),
  );
  disc.position.y = 0.06;
  group.add(disc);
  const center = makeLabel(
    `<b>${SCORE.overall}</b><span>/100</span><em>Maturity ${SCORE.maturity}/5 · ${SCORE.maturityLabel}</em>`,
    'lbl lbl--score',
  );
  center.position.y = 0.7;
  group.add(center);

  function update(t) {
    const w = band(t, 6.8, 7.2, 7.75, 8.05);
    group.visible = w > 0.001;
    if (!group.visible) return;
    segments.forEach((s) => {
      const k = clamp01((w - s.delay) / 0.6);
      s.mesh.scale.y = Math.max(easeOutBack(k), 0.001);
      setLabel(s.label, ramp(k, 0.6, 1));
    });
    disc.scale.setScalar(Math.max(w, 0.001));
    setLabel(center, ramp(w, 0.5, 1));
  }

  return { update };
}
