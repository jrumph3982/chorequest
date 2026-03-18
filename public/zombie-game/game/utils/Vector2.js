export class Vector2 {
  constructor(x = 0, y = 0) { this.x = x; this.y = y; }
  add(v)        { return new Vector2(this.x + v.x, this.y + v.y); }
  addSelf(v)    { this.x += v.x; this.y += v.y; return this; }
  sub(v)        { return new Vector2(this.x - v.x, this.y - v.y); }
  scale(s)      { return new Vector2(this.x * s, this.y * s); }
  scaleSelf(s)  { this.x *= s; this.y *= s; return this; }
  length()      { return Math.sqrt(this.x * this.x + this.y * this.y); }
  lengthSq()    { return this.x * this.x + this.y * this.y; }
  normalize()   { const l = this.length() || 1; return new Vector2(this.x / l, this.y / l); }
  dot(v)        { return this.x * v.x + this.y * v.y; }
  distanceTo(v) { const dx = this.x - v.x, dy = this.y - v.y; return Math.sqrt(dx*dx + dy*dy); }
  distanceSqTo(v){ const dx = this.x - v.x, dy = this.y - v.y; return dx*dx + dy*dy; }
  clone()       { return new Vector2(this.x, this.y); }
  set(x, y)     { this.x = x; this.y = y; return this; }
  lerp(v, t)    { return new Vector2(this.x + (v.x - this.x) * t, this.y + (v.y - this.y) * t); }
  static fromAngle(a) { return new Vector2(Math.cos(a), Math.sin(a)); }
  static zero()       { return new Vector2(0, 0); }
}
