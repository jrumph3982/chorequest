import { randBetween } from '../utils/MathUtils.js';

const COLORS = { wood: '#8a6020', metal: '#6a7a8a', tape: '#c8a030' };
const LABELS = { wood: 'PLANK', metal: 'METAL', tape: 'TAPE' };
const GLOWS  = { wood: '#c89040', metal: '#90b0d0', tape: '#f0d060' };

export class MaterialItem {
  constructor(type, x, y) {
    this.type      = type;
    this.x         = x;
    this.y         = y;
    this.collected = false;
    this.bobPhase  = randBetween(0, Math.PI * 2);
    this.pulse     = 0;
  }

  update(dt) {
    this.bobPhase += dt * 1.8;
    this.pulse = Math.sin(this.bobPhase) * 0.5 + 0.5;
  }

  draw(ctx) {
    if (this.collected) return;
    const bob = Math.sin(this.bobPhase) * 3;
    const y   = this.y + bob;
    const r   = 12;

    // Glow ring
    ctx.save();
    ctx.globalAlpha = 0.25 + this.pulse * 0.25;
    ctx.fillStyle = GLOWS[this.type];
    ctx.beginPath(); ctx.arc(this.x, y, r + 6, 0, Math.PI * 2); ctx.fill();
    ctx.globalAlpha = 1;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.3)';
    ctx.beginPath(); ctx.ellipse(this.x, this.y + r + 2, r * 0.8, 4, 0, 0, Math.PI * 2); ctx.fill();

    // Body
    ctx.fillStyle = COLORS[this.type];
    ctx.beginPath(); ctx.arc(this.x, y, r, 0, Math.PI * 2); ctx.fill();

    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.2)';
    ctx.beginPath(); ctx.arc(this.x - 3, y - 4, r * 0.4, 0, Math.PI * 2); ctx.fill();

    // Label
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(LABELS[this.type], this.x, y);

    ctx.restore();
  }
}
