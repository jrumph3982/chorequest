import { Vector2 } from '../utils/Vector2.js';
import { clamp } from '../utils/MathUtils.js';
import { HOUSE, INTERIOR_WALLS, INTERIOR_DOORS } from '../HouseLayout.js';

const SPEED        = 220;
const RADIUS       = 14;
const PICKUP_DIST  = 44;
const MAX_INV      = 3;
const ATK_RANGE    = 56;
const ATK_COOLDOWN = 0.35;

export class Player {
  constructor(x, y) {
    this.pos        = new Vector2(x, y);
    this.vel        = new Vector2(0, 0);
    this.facing     = new Vector2(1, 0);
    this.facingX    = 1;
    this.inventory  = [];
    this.alive      = true;

    // HP system
    this.hp         = 10;
    this.maxHp      = 10;
    this.iFrames    = 0;   // invincibility frames (seconds)

    // Animation
    this._walkAnim  = 0;
    this._walkPhase = 0;

    // Attack
    this._atkTimer   = 0;
    this._atkPressed = false;
    this._atkFlash   = 0;

    // Avatar state
    this.skinColor   = '#c89060';
    this.hairColor   = '#3a2010';
    this.jacketColor = '#2a4a2a';
    this.pantsColor  = '#3a2a5a';

    // Gun system
    this.gunMode      = false;
    this.aimAngle     = 0;          // radians, world space
    this.showCrosshair = false;     // true when mouse has moved

    // Pet speed multiplier (set each frame by GameScene)
    this._petSpeedMult = 1;
  }

  update(dt, input, game) {
    // ── Movement ─────────────────────────────────────────────
    const move = new Vector2(
      (input.right ? 1 : 0) - (input.left  ? 1 : 0),
      (input.down  ? 1 : 0) - (input.up    ? 1 : 0),
    );
    const moving = move.length() > 0;
    if (moving) {
      this.facing = move.normalize();
      if (input.right)      this.facingX =  1;
      else if (input.left)  this.facingX = -1;
      this._walkAnim += dt * 9;
    } else {
      this._walkAnim *= 0.85;
    }

    if (moving) {
      const norm  = move.normalize();
      const spd   = SPEED * (this._petSpeedMult ?? 1);
      const nx = this.pos.x + norm.x * spd * dt;
      const ny = this.pos.y + norm.y * spd * dt;
      if (this._canWalk(nx, this.pos.y)) this.pos.x = nx;
      if (this._canWalk(this.pos.x, ny)) this.pos.y = ny;
    }

    // ── Melee attack (single-fire, disabled in gun mode) ─────
    this._atkTimer = Math.max(0, this._atkTimer - dt);
    this.iFrames   = Math.max(0, this.iFrames - dt);

    if (!this.gunMode && input.attackJustPressed && this._atkTimer <= 0) {
      input.attackJustPressed = false;
      this._atkTimer  = ATK_COOLDOWN;
      this._atkFlash  = 8;

      let hit = false;
      for (const z of game.zombies) {
        if (z.state === 'dead' || z.state === 'approaching') continue;
        const dist = Math.hypot(z.pos.x - this.pos.x, z.pos.y - this.pos.y);
        const faceAlign = this.facing.dot
          ? this.facing.dot(
              new Vector2(z.pos.x - this.pos.x, z.pos.y - this.pos.y).normalize()
            )
          : 1;
        if (dist < ATK_RANGE && faceAlign > 0.1) {
          z.health -= 1;
          z.hitFlash = 0.15;
          hit = true;
          if (z.health <= 0) {
            z.state = 'dead';
            z.alpha = 1;
            game.killCount = (game.killCount || 0) + 1;
            if (game.ui) game.ui.onKill();
          }
        }
      }
      if (hit) game.audio.play('scratch');
    }

    // Decay attack arc
    if (this._atkFlash > 0) this._atkFlash--;

    // ── Pick up materials ─────────────────────────────────────
    if (this.inventory.length < MAX_INV) {
      for (const m of game.materials) {
        if (m.collected) continue;
        const dist = Math.hypot(m.x - this.pos.x, m.y - this.pos.y);
        if (dist < PICKUP_DIST) {
          m.collected = true;
          this.inventory.push(m.type);
          game.audio.play('pickup');
          break;
        }
      }
    }

    // ── Zombie contact damage ─────────────────────────────────
    for (const z of game.zombies) {
      if (z.state !== 'inside' && z.state !== 'chasing') continue;
      const dist = Math.hypot(z.pos.x - this.pos.x, z.pos.y - this.pos.y);
      if (dist < RADIUS + 18 && this.iFrames <= 0) {
        this.hp = Math.max(0, this.hp - 1);
        this.iFrames = 0.8;
        game._screenFlash = { color: 'rgba(255,0,0,0.25)', ttl: 0.3 };
        if (this.hp <= 0) {
          this.alive = false;
          game.state = 'gameover';
          game.audio.play('gameover');
        }
      }
    }
  }

  _canWalk(x, y) {
    const wt = HOUSE.wallThick;
    if (x < HOUSE.x + wt + RADIUS || x > HOUSE.x + HOUSE.width  - wt - RADIUS ||
        y < HOUSE.y + wt + RADIUS || y > HOUSE.y + HOUSE.height - wt - RADIUS) return false;
    for (const wall of INTERIOR_WALLS) {
      if (x >= wall.x && x <= wall.x + wall.w &&
          y >= wall.y && y <= wall.y + wall.h) {
        for (const door of INTERIOR_DOORS) {
          if (x >= door.x && x <= door.x + door.w &&
              y >= door.y && y <= door.y + door.h) return true;
        }
        return false;
      }
    }
    return true;
  }

  nearestRepairTarget(structures) {
    let best = null, bestDist = 90;
    for (const s of structures) {
      if (s.state === 'intact') continue;
      const dist = Math.hypot(s.cx - this.pos.x, s.cy - this.pos.y);
      if (dist < bestDist) { bestDist = dist; best = s; }
    }
    return best;
  }

  draw(ctx) {
    const { x, y } = this.pos;
    const walk = Math.sin(this._walkAnim) * 5;

    // ── Gun mode: update facingX from aim angle ───────────────
    if (this.gunMode) {
      this.facingX = Math.cos(this.aimAngle) >= 0 ? 1 : -1;
    }

    // ── Melee attack arc ──────────────────────────────────────
    if (!this.gunMode && this._atkFlash > 0) {
      const angles = {
        right: [-Math.PI / 3, Math.PI / 3],
        left:  [Math.PI * 2 / 3, Math.PI * 4 / 3],
        down:  [Math.PI / 6, Math.PI * 5 / 6],
        up:    [-Math.PI * 5 / 6, -Math.PI / 6],
      };
      let dir = 'right';
      if (Math.abs(this.facing.x) > Math.abs(this.facing.y)) {
        dir = this.facing.x > 0 ? 'right' : 'left';
      } else {
        dir = this.facing.y > 0 ? 'down' : 'up';
      }
      const [sa, ea] = angles[dir];
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.arc(x, y, 56, sa, ea);
      ctx.closePath();
      const opacity = 0.4 * (this._atkFlash / 8);
      ctx.fillStyle = `rgba(255,200,50,${opacity})`;
      ctx.fill();
    }

    // ── Crosshair reticle (gun mode, desktop) ─────────────────
    if (this.gunMode && this.showCrosshair) {
      const cr = 80;
      const cx2 = x + Math.cos(this.aimAngle) * cr;
      const cy2 = y + Math.sin(this.aimAngle) * cr;
      ctx.save();
      ctx.strokeStyle = 'rgba(61,180,255,0.9)';
      ctx.lineWidth   = 1.5;
      // Crosshair ring
      ctx.beginPath();
      ctx.arc(cx2, cy2, 8, 0, Math.PI * 2);
      ctx.stroke();
      // Cross lines
      const gap = 4;
      const arm = 12;
      ctx.beginPath();
      ctx.moveTo(cx2 - arm, cy2); ctx.lineTo(cx2 - gap, cy2);
      ctx.moveTo(cx2 + gap, cy2); ctx.lineTo(cx2 + arm, cy2);
      ctx.moveTo(cx2, cy2 - arm); ctx.lineTo(cx2, cy2 - gap);
      ctx.moveTo(cx2, cy2 + gap); ctx.lineTo(cx2, cy2 + arm);
      ctx.stroke();
      // Aim line (dotted)
      ctx.setLineDash([4, 6]);
      ctx.globalAlpha = 0.3;
      ctx.strokeStyle = '#3db4ff';
      ctx.beginPath();
      ctx.moveTo(x + Math.cos(this.aimAngle) * 20, y + Math.sin(this.aimAngle) * 20);
      ctx.lineTo(cx2 - Math.cos(this.aimAngle) * 14, cy2 - Math.sin(this.aimAngle) * 14);
      ctx.stroke();
      ctx.setLineDash([]);
      ctx.globalAlpha = 1;
      ctx.restore();
    }

    ctx.save();
    ctx.translate(x, y);

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.4)';
    ctx.beginPath();
    ctx.ellipse(0, 18, 13, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // ── Gun rendered before flip (world-space rotation) ───────
    if (this.gunMode) {
      ctx.save();
      ctx.rotate(this.aimAngle);
      // Arm
      ctx.fillStyle = this.skinColor;
      ctx.fillRect(10, -3, 10, 6);
      // Gun body
      ctx.fillStyle = '#4a4a5a';
      ctx.fillRect(18, -4, 22, 8);
      // Barrel
      ctx.fillStyle = '#2a2a3a';
      ctx.fillRect(38, -2.5, 10, 5);
      // Grip (handle going "down" relative to aim direction)
      ctx.fillStyle = '#3a3a4a';
      ctx.fillRect(22, 4, 8, 10);
      // Trigger guard
      ctx.strokeStyle = '#555566';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.arc(27, 6, 5, 0, Math.PI);
      ctx.stroke();
      ctx.restore();
    }

    // Flip for left movement / aim direction
    ctx.scale(this.facingX, 1);

    // Invincibility flicker
    if (this.iFrames > 0 && Math.floor(this.iFrames * 10) % 2 === 0) {
      ctx.globalAlpha = 0.4;
    }

    // Legs (animated)
    ctx.fillStyle = this.pantsColor;
    ctx.fillRect(-7, 4, 10, 14 + walk);
    ctx.fillRect(-3, 4, 10, 14 - walk);
    // Boots
    ctx.fillStyle = '#1a1008';
    ctx.fillRect(-8, 16 + walk, 12, 5);
    ctx.fillRect(-4, 16 - walk, 12, 5);

    // Torso
    ctx.fillStyle = this.jacketColor;
    ctx.fillRect(-10, -11, 20, 19);
    // Jacket top edge (lighter)
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.fillRect(-10, -11, 20, 3);
    // Belt
    ctx.fillStyle = '#2a1a08';
    ctx.fillRect(-10, 6, 20, 3);

    // Arms with swing
    const armSwing = Math.cos(this._walkAnim) * 7;
    if (!this.gunMode) {
      // Melee: show arms + bat
      ctx.fillStyle = this.skinColor;
      ctx.fillRect(-14, -9 + armSwing, 6, 14);
      ctx.fillRect(8,   -9 - armSwing, 6, 14);
      // Weapon in right hand: small bat
      ctx.fillStyle = '#6a3a10';
      ctx.save();
      ctx.translate(14, -9 - armSwing);
      ctx.rotate(this._atkFlash > 0 ? -0.8 : 0.2);
      ctx.fillRect(-2, -14, 4, 16);
      // Spikes
      ctx.fillStyle = '#aaaaaa';
      ctx.fillRect(-3, -12, 2, 3);
      ctx.fillRect(-3, -8, 2, 3);
      ctx.restore();
    } else {
      // Gun mode: left arm hangs, right arm is drawn before flip (gun)
      ctx.fillStyle = this.skinColor;
      ctx.fillRect(-14, -9 + armSwing, 6, 14);
    }

    // Head
    ctx.fillStyle = this.skinColor;
    ctx.beginPath();
    ctx.arc(0, -16, 10, 0, Math.PI * 2);
    ctx.fill();
    // Darker chin shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.arc(0, -12, 10, 0.2, Math.PI - 0.2);
    ctx.fill();
    // Hair
    ctx.fillStyle = this.hairColor;
    ctx.fillRect(-10, -26, 20, 11);
    ctx.beginPath();
    ctx.arc(0, -26, 10, Math.PI, 0);
    ctx.fill();
    // Eye
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(3, -18, 4, 3);
    // Highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(4, -19, 2, 2);
    // Flashlight beam
    ctx.strokeStyle = 'rgba(255,240,180,0.5)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(8, -16);
    ctx.lineTo(20, -16);
    ctx.stroke();

    ctx.globalAlpha = 1;
    ctx.restore();
  }
}
