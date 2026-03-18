import { Vector2 } from '../utils/Vector2.js';
import { clamp, lerp } from '../utils/MathUtils.js';

const LERP_SPEED = 6;
const MIN_ZOOM = 0.8, MAX_ZOOM = 1.2;

export class CameraSystem {
  constructor(canvas) {
    this.canvas = canvas;
    this.x    = 0;
    this.y    = 0;
    this.zoom = 1.0;
    this._targetX = 0;
    this._targetY = 0;
  }

  follow(worldPos, dt) {
    this._targetX = worldPos.x;
    this._targetY = worldPos.y;
    this.x = lerp(this.x, this._targetX, LERP_SPEED * dt);
    this.y = lerp(this.y, this._targetY, LERP_SPEED * dt);
    // Clamp so we don't show beyond world edges
    const hw = (this.canvas.width  / 2) / this.zoom;
    const hh = (this.canvas.height / 2) / this.zoom;
    // world bounds set in GameScene via setWorldBounds
    if (this._wBounds) {
      this.x = clamp(this.x, this._wBounds.x + hw, this._wBounds.x + this._wBounds.w - hw);
      this.y = clamp(this.y, this._wBounds.y + hh, this._wBounds.y + this._wBounds.h - hh);
    }
  }

  setWorldBounds(x, y, w, h) { this._wBounds = { x, y, w, h }; }

  begin(ctx) {
    ctx.save();
    ctx.translate(this.canvas.width / 2, this.canvas.height / 2);
    ctx.scale(this.zoom, this.zoom);
    ctx.translate(-this.x, -this.y);
  }

  end(ctx) { ctx.restore(); }

  worldToScreen(worldPos) {
    return new Vector2(
      (worldPos.x - this.x) * this.zoom + this.canvas.width  / 2,
      (worldPos.y - this.y) * this.zoom + this.canvas.height / 2,
    );
  }

  screenToWorld(screenPos) {
    return new Vector2(
      (screenPos.x - this.canvas.width  / 2) / this.zoom + this.x,
      (screenPos.y - this.canvas.height / 2) / this.zoom + this.y,
    );
  }
}
