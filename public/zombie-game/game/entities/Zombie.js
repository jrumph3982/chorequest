import { Vector2 } from '../utils/Vector2.js';
import { randBetween } from '../utils/MathUtils.js';
import { HOUSE, INTERIOR_WALLS, INTERIOR_DOORS } from '../HouseLayout.js';

export class Zombie {
  constructor(x, y, type = 'walker') {
    this.pos       = new Vector2(x, y);
    this.vel       = new Vector2(0, 0);
    this.type      = type;
    this.state     = 'approaching';
    this.target    = null;
    this.health    = type === 'brute' ? 6 : type === 'runner' ? 2 : 3;
    this.maxHealth = this.health;
    this.speed     = type === 'runner' ? 120 : type === 'brute' ? 52 : 72;
    this.damage    = type === 'brute' ? 18 : type === 'runner' ? 6 : 10;
    this._phase      = randBetween(0, Math.PI * 2);
    this._entryTimer = 0;
    this._walkAnim   = 0;
    this.alpha       = 1;
    this.hitFlash    = 0;   // seconds remaining of white flash
    this.attackers   = [];  // unused but expected by some systems
  }

  update(dt, game) {
    if (this.state === 'dead') {
      this.alpha = Math.max(0, this.alpha - dt * 4);
      return;
    }

    this._phase    += dt * (this.type === 'runner' ? 3.5 : 1.8);
    this._walkAnim += dt * (this.type === 'runner' ? 12 : 7);
    if (this.hitFlash > 0) this.hitFlash -= dt;

    switch (this.state) {
      case 'approaching': this._stateApproach(dt); break;
      case 'attacking':   this._stateAttack(dt, game); break;
      case 'entering':    this._stateEnter(dt, game); break;
      case 'inside':
      case 'chasing':     this._stateChase(dt, game); break;
    }
  }

  _stateApproach(dt) {
    if (!this.target) return;
    const dest = new Vector2(this.target.cx, this.target.cy);
    const dir  = dest.sub(this.pos).normalize();
    const wobble = Math.sin(this._phase) * 14;
    const perp = new Vector2(-dir.y, dir.x).scale(wobble * dt * 0.3);
    this.pos.addSelf(dir.scale(this.speed * dt)).addSelf(perp);
    if (this.pos.distanceTo(dest) < 34) this.state = 'attacking';
  }

  _stateAttack(dt, game) {
    if (!this.target) { this.state = 'approaching'; return; }
    if (this.target.isPassable()) {
      this.state = 'entering';
      this._entryTimer = 1.2;
      return;
    }
    const dest = new Vector2(this.target.cx, this.target.cy);
    const dist = this.pos.distanceTo(dest);
    if (dist > 42) this.pos.addSelf(dest.sub(this.pos).normalize().scale(this.speed * 0.5 * dt));
    this.target.takeDamage(this.damage * dt);
    if (dist < 38 && Math.random() < dt * 3) {
      game.audio.play(this.target.type === 'window' ? 'scratch' : 'bang');
    }
  }

  _stateEnter(dt, game) {
    this._entryTimer -= dt;
    if (this.target) {
      const dest = new Vector2(this.target.cx, this.target.cy);
      const inside = new Vector2(
        this.target.facing === 'left'   ? dest.x + 70 :
        this.target.facing === 'right'  ? dest.x - 70 : dest.x,
        this.target.facing === 'top'    ? dest.y + 70 :
        this.target.facing === 'bottom' ? dest.y - 70 : dest.y,
      );
      this.pos.addSelf(inside.sub(this.pos).normalize().scale(90 * dt));
    }
    if (this._entryTimer <= 0) {
      this.state = 'inside';
      game.audio.play('entry');
    }
  }

  _stateChase(dt, game) {
    this.state = 'chasing';
    if (!game.player) return;
    const dir = game.player.pos.sub(this.pos).normalize();
    const wobble = Math.sin(this._phase * 1.5) * 9;
    const perp = new Vector2(-dir.y, dir.x).scale(wobble);
    const spd = this.speed * 1.1;
    const nx = this.pos.x + dir.x * spd * dt + perp.x * dt * 0.25;
    const ny = this.pos.y + dir.y * spd * dt + perp.y * dt * 0.25;
    if (this._canWalk(nx, this.pos.y, 14)) this.pos.x = nx;
    if (this._canWalk(this.pos.x, ny, 14)) this.pos.y = ny;
  }

  _canWalk(x, y, r) {
    const wt = HOUSE.wallThick;
    if (x < HOUSE.x + wt + r || x > HOUSE.x + HOUSE.width  - wt - r ||
        y < HOUSE.y + wt + r || y > HOUSE.y + HOUSE.height - wt - r) return false;
    for (const wall of INTERIOR_WALLS) {
      if (x >= wall.x && x <= wall.x + wall.w && y >= wall.y && y <= wall.y + wall.h) {
        for (const door of INTERIOR_DOORS) {
          if (x >= door.x && x <= door.x + door.w && y >= door.y && y <= door.y + door.h) return true;
        }
        return false;
      }
    }
    return true;
  }

  draw(ctx) {
    const { x, y } = this.pos;
    const isOutside = this.state === 'approaching' || this.state === 'attacking';
    const lean = Math.sin(this._walkAnim) * 0.18;

    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(lean);
    ctx.globalAlpha = this.alpha * (isOutside ? 0.8 : 1);

    // Hit flash: overlay white
    const flashing = this.hitFlash > 0;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.35)';
    ctx.beginPath();
    ctx.ellipse(0, 20, 11, 4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Type-specific colors
    let bodyColor, headColor, eyeColor, headR;
    if (this.type === 'brute') {
      bodyColor = isOutside ? '#2a2a18' : '#4a3828';
      headColor = isOutside ? '#2a2818' : '#6a5840';
      eyeColor  = '#cc2020';
      headR     = 13;
    } else if (this.type === 'runner') {
      bodyColor = isOutside ? '#182a18' : '#283a28';
      headColor = isOutside ? '#1a2a1a' : '#5a7a52';
      eyeColor  = '#40cc40';
      headR     = 7;
    } else {
      bodyColor = isOutside ? '#282e22' : '#3a4a32';
      headColor = isOutside ? '#2a3022' : '#6a8a52';
      eyeColor  = '#c8c020';
      headR     = 9;
    }

    if (flashing) {
      bodyColor = 'rgba(255,255,255,0.9)';
      headColor = 'rgba(255,255,255,0.9)';
    }

    // Legs (animated)
    const legSwing = Math.sin(this._walkAnim) * 7;
    const legColor = flashing ? 'rgba(255,255,255,0.9)' : (isOutside ? '#181a14' : '#2a2a1a');
    ctx.fillStyle = legColor;
    ctx.fillRect(-7, 9, 8, 14 + legSwing);
    ctx.fillRect(-1, 9, 8, 14 - legSwing);
    // Feet
    ctx.fillStyle = flashing ? 'rgba(255,255,255,0.9)' : '#111';
    ctx.fillRect(-8, 22 + legSwing, 9, 4);
    ctx.fillRect(-1, 22 - legSwing, 9, 4);

    // Body
    const bw = this.type === 'brute' ? 24 : this.type === 'runner' ? 14 : 17;
    ctx.fillStyle = bodyColor;
    ctx.fillRect(-bw/2, -9, bw, 20);
    // Shoulder pads for brute
    if (this.type === 'brute' && !flashing) {
      ctx.fillStyle = '#3a3020';
      ctx.fillRect(-bw/2 - 5, -8, 7, 9);
      ctx.fillRect(bw/2 - 2, -8, 7, 9);
    }

    // Reaching arms (more animated)
    const armRot = Math.sin(this._walkAnim * 0.6) * 22 - 28;
    ctx.save();
    ctx.translate(-bw/2 - 3, 1);
    ctx.rotate(armRot * Math.PI / 180);
    ctx.fillStyle = headColor;
    ctx.fillRect(-4, 0, 7, 17);
    ctx.restore();
    ctx.save();
    ctx.translate(bw/2 + 3, 1);
    ctx.rotate(-armRot * Math.PI / 180);
    ctx.fillStyle = headColor;
    ctx.fillRect(-3, 0, 7, 17);
    ctx.restore();

    // Head
    const headY = this.type === 'brute' ? -20 : this.type === 'runner' ? -17 : -19;
    // Brute heavy brow
    if (this.type === 'brute' && !flashing) {
      ctx.fillStyle = '#3a3018';
      ctx.fillRect(-headR - 2, headY - 5, (headR + 2) * 2, 5);
    }
    ctx.fillStyle = headColor;
    ctx.beginPath();
    ctx.arc(2, headY, headR, 0, Math.PI * 2);
    ctx.fill();

    // Eyes — glowing
    if (!isOutside) {
      ctx.fillStyle = eyeColor;
      ctx.shadowColor = eyeColor;
      ctx.shadowBlur = 4;
      ctx.beginPath(); ctx.arc(-2, headY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6,  headY, 2.5, 0, Math.PI * 2); ctx.fill();
      ctx.shadowBlur = 0;
    } else {
      ctx.fillStyle = `rgba(200,50,50,0.6)`;
      ctx.beginPath(); ctx.arc(-2, headY, 2, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(6,  headY, 2, 0, Math.PI * 2); ctx.fill();
    }

    // HP bar (only when damaged, only inside)
    if (!isOutside && this.health < this.maxHealth) {
      const barW = 22, barH = 3;
      const barX = -barW / 2;
      const barY = headY - headR - 8;
      ctx.fillStyle = '#3a0808';
      ctx.fillRect(barX, barY, barW, barH);
      ctx.fillStyle = '#ff3030';
      ctx.fillRect(barX, barY, barW * (this.health / this.maxHealth), barH);
    }

    ctx.restore();
  }
}
