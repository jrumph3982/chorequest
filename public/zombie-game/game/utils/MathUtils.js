export const clamp      = (v, mn, mx) => Math.min(mx, Math.max(mn, v));
export const lerp       = (a, b, t)   => a + (b - a) * t;
export const randBetween= (a, b)      => a + Math.random() * (b - a);
export const randInt    = (a, b)      => Math.floor(randBetween(a, b + 1));
export const randItem   = arr         => arr[Math.floor(Math.random() * arr.length)];
export const degToRad   = d           => d * Math.PI / 180;
export const smoothstep = (a, b, t)   => { const x = clamp((t-a)/(b-a),0,1); return x*x*(3-2*x); };

export function rectContains(r, x, y) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
export function rectsOverlap(a, b) {
  return a.x < b.x+b.w && a.x+a.w > b.x && a.y < b.y+b.h && a.y+a.h > b.y;
}
