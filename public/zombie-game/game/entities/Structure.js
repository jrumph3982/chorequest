import { clamp } from '../utils/MathUtils.js';

// Window states: intact → cracked → shattered → boarded
// Door states:   intact → damaged → broken → barricaded
const WINDOW_THRESHOLDS = { cracked: 70, shattered: 0 };
const DOOR_THRESHOLDS   = { damaged: 60, broken: 0 };
const MAX_HEALTH = 100;

export class Structure {
  constructor(def) {
    Object.assign(this, def);  // id, type, facing, cx, cy, sw, sh
    this.health    = MAX_HEALTH;
    this.state     = 'intact';
    this.attackers = [];       // zombie refs currently attacking this
    this.flashTimer= 0;        // red flash on attack
  }

  // Called by zombies each frame they are attacking
  takeDamage(amount) {
    if (this.isPassable()) return;
    this.health    = clamp(this.health - amount, 0, MAX_HEALTH);
    this.flashTimer= 0.18;
    this._updateState();
  }

  // Returns material cost and health restored
  repair(material) {
    if (this.state === 'intact') return false;
    const restore = material === 'tape' ? 25 : material === 'wood' ? 40 : 55;
    this.health = clamp(this.health + restore, 0, MAX_HEALTH);
    this._updateState();
    // Boarded / barricaded bonus state
    if (this.health >= MAX_HEALTH && material === 'wood') {
      this.state = this.type === 'window' ? 'boarded' : 'barricaded';
    }
    return true;
  }

  isPassable() {
    return this.state === 'shattered' || this.state === 'broken';
  }

  _updateState() {
    if (this.state === 'boarded' || this.state === 'barricaded') {
      if (this.health < MAX_HEALTH) this.state = this.type === 'window' ? 'cracked' : 'damaged';
      return;
    }
    if (this.type === 'window') {
      if      (this.health <= 0)                          this.state = 'shattered';
      else if (this.health < WINDOW_THRESHOLDS.cracked)  this.state = 'cracked';
      else                                                this.state = 'intact';
    } else {
      if      (this.health <= 0)                        this.state = 'broken';
      else if (this.health < DOOR_THRESHOLDS.damaged)  this.state = 'damaged';
      else                                              this.state = 'intact';
    }
  }

  update(dt) {
    this.flashTimer = Math.max(0, this.flashTimer - dt);
  }

  draw(ctx) {
    const { cx, cy, sw, sh, type, state, flashTimer } = this;
    const hw = sw / 2, hh = sh / 2;

    // --- Opening (hole in wall) ---
    // Drawn first; wall draws over it so this acts as transparency
    ctx.fillStyle = '#050805';
    ctx.fillRect(cx - hw - 2, cy - hh - 2, sw + 4, sh + 4);

    if (state === 'shattered' || state === 'broken') {
      // Open hole — draw broken edge fragments
      ctx.strokeStyle = '#2a1a0a';
      ctx.lineWidth = 2;
      if (type === 'window') {
        // glass shards
        ctx.strokeStyle = '#4a6a7a';
        for (let i = 0; i < 5; i++) {
          const ax = cx - hw + Math.random() * sw;
          ctx.beginPath(); ctx.moveTo(ax, cy - hh); ctx.lineTo(cx - hw + Math.random() * sw, cy + hh); ctx.stroke();
        }
      }
      return;
    }

    // --- Frame ---
    const frameColor = state === 'boarded' || state === 'barricaded' ? '#5a3a10' : '#1a2a1a';
    ctx.fillStyle = frameColor;
    ctx.fillRect(cx - hw - 3, cy - hh - 3, sw + 6, sh + 6);

    // --- Glass / Door face ---
    if (type === 'window') {
      if (state === 'cracked') {
        ctx.fillStyle = 'rgba(100,140,160,0.35)';
        ctx.fillRect(cx - hw, cy - hh, sw, sh);
        // crack lines
        ctx.strokeStyle = 'rgba(220,220,220,0.7)';
        ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - hw + 4, cy - hh + 4); ctx.lineTo(cx, cy + hh - 4); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(cx, cy - hh + 6); ctx.lineTo(cx + hw - 4, cy + hh - 2); ctx.stroke();
      } else if (state === 'boarded') {
        // Wood boards
        const nh = sh > sw ? 3 : 2;
        const bh = sh / nh;
        ctx.fillStyle = '#7a5020';
        for (let i = 0; i < nh; i++) {
          ctx.fillRect(cx - hw + 1, cy - hh + i * bh + 1, sw - 2, bh - 2);
          ctx.fillStyle = '#5a3810';
        }
        // nail dots
        ctx.fillStyle = '#2a1808';
        [[-hw+4, 0],[hw-4, 0]].forEach(([ox,oy]) => {
          ctx.beginPath(); ctx.arc(cx+ox, cy+oy, 2.5, 0, Math.PI*2); ctx.fill();
        });
      } else {
        // intact glass
        ctx.fillStyle = 'rgba(100,160,200,0.25)';
        ctx.fillRect(cx - hw, cy - hh, sw, sh);
        // sheen
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(cx - hw + 2, cy - hh + 2, 4, sh - 4);
      }
    } else {
      // Door
      const doorColor = state === 'damaged' ? '#2a1a0a' : state === 'barricaded' ? '#7a5020' : '#1e1408';
      ctx.fillStyle = doorColor;
      ctx.fillRect(cx - hw, cy - hh, sw, sh);
      if (state === 'damaged') {
        ctx.strokeStyle = '#5a3010'; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(cx - 4, cy - hh + 4); ctx.lineTo(cx + 2, cy + hh - 4); ctx.stroke();
      }
      if (state === 'barricaded') {
        ctx.fillStyle = '#9a6820';
        ctx.fillRect(cx - hw + 2, cy - hh + 4, sw - 4, 6);
        ctx.fillRect(cx - hw + 2, cy + hh - 10, sw - 4, 6);
      }
    }

    // Health bar (visible when damaged)
    if (state !== 'intact' && state !== 'boarded' && state !== 'barricaded') {
      const bw = sw + 4, bh2 = 4;
      const bx = cx - bw / 2, by = cy - hh - 10;
      ctx.fillStyle = '#1a0a0a'; ctx.fillRect(bx, by, bw, bh2);
      const pct = this.health / MAX_HEALTH;
      ctx.fillStyle = pct > 0.5 ? '#22c55e' : pct > 0.25 ? '#f59e0b' : '#ef4444';
      ctx.fillRect(bx, by, bw * pct, bh2);
    }

    // Attack flash
    if (flashTimer > 0) {
      ctx.fillStyle = `rgba(255,50,50,${flashTimer / 0.18 * 0.4})`;
      ctx.fillRect(cx - hw - 3, cy - hh - 3, sw + 6, sh + 6);
    }

    // Attacker count badge
    if (this.attackers.length > 0 && !this.isPassable()) {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`⚠ ${this.attackers.length}`, cx, cy - hh - 14);
    }
  }
}
