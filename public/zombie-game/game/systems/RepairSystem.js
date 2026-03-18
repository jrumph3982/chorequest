import { Vector2 } from '../utils/Vector2.js';

const REPAIR_TIME = 2.0;  // seconds
const MAT_PRIORITY = ['tape', 'metal', 'wood']; // repair order preference

export class RepairSystem {
  constructor() {
    this.active           = false;
    this.progress         = 0;
    this.target           = null;
    this._wasEDown        = false;
    this._cooldown        = 0;
    this._fortifyCooldown = 0;
  }

  update(dt, input, game) {
    const player  = game.player;
    const eDown   = !!input.interact;
    const nearest = player.nearestRepairTarget(game.structures);

    // Start repair
    if (eDown && !this._wasEDown && nearest && player.inventory.length > 0 && !this.active) {
      // Find best material
      const mat = this._chooseMaterial(player.inventory, nearest);
      if (mat !== null) {
        this.active   = true;
        this.progress = 0;
        this.target   = nearest;
        this._matIdx  = player.inventory.indexOf(mat);
        this._matType = mat;
        game.audio.play('repair');
      }
    }

    // Progress repair
    if (this.active) {
      // Cancel if E released or player moved too far
      const dist = player.pos.distanceTo(new Vector2(this.target.cx, this.target.cy));
      if (!eDown || dist > 90) {
        this._cancel();
      } else {
        this.progress += dt / REPAIR_TIME;
        if (this.progress >= 1) {
          // Complete
          player.inventory.splice(this._matIdx, 1);
          this.target.repair(this._matType);
          game.audio.play('crack'); // sound of repair finishing
          this._cooldown = 0.5;
          this._cancel();
        }
      }
    }

    this._wasEDown        = eDown;
    this._cooldown        = Math.max(0, this._cooldown - dt);
    this._fortifyCooldown = Math.max(0, this._fortifyCooldown - dt);
  }

  _chooseMaterial(inventory, structure) {
    // Try to use tape first for temporary, else wood for board, metal for reinforce
    for (const m of MAT_PRIORITY) {
      const idx = inventory.indexOf(m);
      if (idx !== -1) return m;
    }
    return null;
  }

  _cancel() {
    this.active   = false;
    this.progress = 0;
    this.target   = null;
  }

  draw(ctx, camera) {
    if (!this.active || !this.target) return;

    // Progress bar above target structure (world space)
    const { cx, cy, sw } = this.target;
    const bw = Math.max(60, sw + 20), bh = 8;
    const bx = cx - bw / 2, by = cy - 50;

    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    ctx.fillRect(bx - 2, by - 2, bw + 4, bh + 4);
    ctx.fillStyle = '#22c55e';
    ctx.fillRect(bx, by, bw * this.progress, bh);
    ctx.strokeStyle = '#3dff7a';
    ctx.lineWidth = 1;
    ctx.strokeRect(bx, by, bw, bh);

    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('REPAIRING...', cx, by - 4);
  }
}
