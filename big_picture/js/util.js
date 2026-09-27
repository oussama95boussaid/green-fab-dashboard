import { CSS2DObject } from 'three/addons/renderers/CSS2DRenderer.js';

export const clamp01 = (v) => Math.min(1, Math.max(0, v));
export const lerp = (a, b, t) => a + (b - a) * t;

// 0 → 1 while t goes from a to b.
export const ramp = (t, a, b) => clamp01((t - a) / (b - a));
// Rises a → b, holds, falls c → d.
export const band = (t, a, b, c, d) => Math.min(ramp(t, a, b), 1 - ramp(t, c, d));

export const easeInOutCubic = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
export const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
export const easeOutBack = (t) => {
  const c1 = 1.4, c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};

// Equirectangular projection of the Greater Region into scene units (1 unit ≈ 10 km).
export function geo(lon, lat) {
  return { x: (lon - 5.9) * 7.2, z: -(lat - 49.4) * 11.1 };
}

export function makeLabel(html, className) {
  const el = document.createElement('div');
  el.className = className;
  el.innerHTML = html;
  el.style.opacity = '0';
  const obj = new CSS2DObject(el);
  obj.visible = false;
  return obj;
}

export function setLabel(obj, alpha) {
  const visible = alpha > 0.01;
  if (obj.visible !== visible) obj.visible = visible;
  if (visible) obj.element.style.opacity = alpha.toFixed(3);
}
