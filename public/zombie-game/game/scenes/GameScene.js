import { Player }          from '../entities/Player.js';
import { Zombie }          from '../entities/Zombie.js';
import { Structure }       from '../entities/Structure.js';
import { MaterialItem }    from '../entities/MaterialItem.js';
import { Pet }             from '../entities/Pet.js';
import { CameraSystem }    from '../systems/CameraSystem.js';
import { ZombieAISystem }  from '../systems/ZombieAISystem.js';
import { RepairSystem }    from '../systems/RepairSystem.js';
import { LightingSystem }  from '../systems/LightingSystem.js';
import { UISystem }        from '../systems/UISystem.js';
import { randBetween, randItem } from '../utils/MathUtils.js';
import {
  WORLD, HOUSE, ROOMS, INTERIOR_WALLS, INTERIOR_DOORS,
  FURNITURE, MAT_ZONES, STRUCTURE_DEFS, PLAYER_START, SURVIVAL_TIME
} from '../HouseLayout.js';

const MAT_TYPES   = ['wood', 'metal', 'tape'];
const WALL_COLOR  = '#2a4028';
const OUTER_COLOR = '#060a06';

const BULLET_SPEED    = 600;   // world units / second
const MAX_BULLETS     = 20;
const SHOOT_COOLDOWN  = 0.4;   // seconds between shots

export class GameScene {
  constructor(canvas, audio, petData = null) {
    this.canvas    = canvas;
    this.ctx       = canvas.getContext('2d');
    this.audio     = audio;

    this.state     = 'playing';
    this.timer     = SURVIVAL_TIME;
    this.integrity = 100;
    this.killCount = 0;
    this._integrityDamage = 0;
    this._screenFlash     = null;
    this._shakeAmt        = 0;
    this._alertCooldown   = 0;

    this.player     = new Player(PLAYER_START.x, PLAYER_START.y);
    this.zombies    = [];
    this.materials  = [];
    this.structures = STRUCTURE_DEFS.map(def => new Structure(def));

    this.camera   = new CameraSystem(canvas);
    this.camera.setWorldBounds(0, 0, WORLD.width, WORLD.height);
    this.camera.x = PLAYER_START.x;
    this.camera.y = PLAYER_START.y;

    this.zombieAI = new ZombieAISystem();
    this.repair   = new RepairSystem();
    this.lighting = new LightingSystem(canvas);
    this.ui       = new UISystem(canvas);

    this._matSpawnTimer  = 5;
    this._fortifyCooldown = 0;
    for (let i = 0; i < 6; i++) this._spawnMaterial();

    // ── Pet companion ────────────────────────────────────────
    this.pet = petData ? new Pet(petData) : null;

    // ── Gun system ───────────────────────────────────────────
    this.currentWeapon  = 'melee';
    this.bullets        = [];
    this._shootCooldown = 0;
    this._muzzleFlash   = null;   // { x, y, angle, ttl }
    this._effects       = [];     // particle effects
    this._weaponFlash   = 0;      // screen flash on weapon switch
  }

  applyIntegrityDamage(amount) {
    this._integrityDamage += amount;
    if (this._integrityDamage >= 1) {
      this.integrity -= Math.floor(this._integrityDamage);
      this._integrityDamage %= 1;
      this.integrity = Math.max(0, this.integrity);
    }
  }

  update(dt, input) {
    if (this.state !== 'playing') return;

    this.timer -= dt;
    if (this.timer <= 0) {
      this.state = 'victory';
      this.audio.play('victory');
      return;
    }
    if (this.integrity <= 0) {
      this.state = 'gameover';
      this.audio.play('gameover');
      this._shakeAmt = 1;
      return;
    }

    for (const s of this.structures) s.update(dt);

    const broken = this.structures.filter(s => s.isPassable()).length;
    const target = Math.max(0, 100 - broken * 8);
    this.integrity = Math.max(
      this.integrity - Math.max(0, this.integrity - target) * dt * 0.5,
      this.integrity - broken * 2 * dt
    );
    this.integrity = Math.max(0, Math.min(100, this.integrity));

    if (this.integrity < 30 && this._alertCooldown <= 0) {
      this.audio.play('alert');
      this._alertCooldown = 5;
    }
    this._alertCooldown -= dt;

    // ── Weapon toggle (Q) ────────────────────────────────────
    if (input.weaponSwitchJustPressed) {
      input.weaponSwitchJustPressed = false;
      this.currentWeapon = this.currentWeapon === 'melee' ? 'gun' : 'melee';
      this._weaponFlash  = 0.22;
    }
    this._weaponFlash = Math.max(0, this._weaponFlash - dt);

    // ── Gun aim (mouse → world coords) ───────────────────────
    this.player.gunMode = (this.currentWeapon === 'gun');
    if (this.currentWeapon === 'gun') {
      if (this.player.showCrosshair) {
        // Mouse aim
        const wm = this.camera.screenToWorld({ x: input.mouseX, y: input.mouseY });
        const dx = wm.x - this.player.pos.x;
        const dy = wm.y - this.player.pos.y;
        this.player.aimAngle = Math.atan2(dy, dx);
      } else {
        // Mobile: aim in movement facing direction
        this.player.aimAngle = Math.atan2(this.player.facing.y, this.player.facing.x);
      }
      // Prevent melee arc from firing
      input.attackJustPressed = false;
    }

    this.zombieAI.update(dt, this);

    // Apply rabbit speed multiplier from pet
    if (this.pet) this.player._petSpeedMult = this.pet.getSpeedMultiplier();
    else this.player._petSpeedMult = 1;

    this.player.update(dt, input, this);
    this.repair.update(dt, input, this);
    this.ui.update(dt);

    // ── Pet update + zombie collision ────────────────────────
    if (this.pet) {
      this.pet.update(dt, this.player, this);
      // Zombies that reach the pet deal 1 hp of damage
      for (const z of this.zombies) {
        if (z.state === 'dead') continue;
        const dist = Math.hypot(z.pos.x - this.pet.x, z.pos.y - this.pet.y);
        if (dist < 14) {
          this.pet.takeDamage();
          // Scare pet to a far corner
          this.pet.scare(WORLD.width - 40, WORLD.height - 40);
        }
      }
    }

    // ── Gun shoot (held attack in gun mode) ──────────────────
    this._shootCooldown = Math.max(0, this._shootCooldown - dt);
    if (this.currentWeapon === 'gun' && input.attack && this._shootCooldown <= 0) {
      this._tryShoot();
    }

    // ── Bullet + effect update ───────────────────────────────
    this._updateBullets(dt);
    this._updateEffects(dt);
    if (this._muzzleFlash) this._muzzleFlash.ttl -= dt;

    // ── Fortify (F key) ─────────────────────────────────────
    this._fortifyCooldown = Math.max(0, this._fortifyCooldown - dt);
    if (input.fortifyJustPressed && this._fortifyCooldown <= 0) {
      const nearest = this.player.nearestRepairTarget(this.structures);
      if (nearest && this.player.inventory.length > 0) {
        const woodIdx = this.player.inventory.indexOf('wood');
        const matIdx  = woodIdx !== -1 ? woodIdx : 0;
        const matType = this.player.inventory[matIdx];
        this.player.inventory.splice(matIdx, 1);
        nearest.repair(matType);
        this._fortifyCooldown = 1.5;
        this.repair._fortifyCooldown = 1.5;
        this.audio.play('crack');
      }
    }

    this._matSpawnTimer -= dt;
    if (this._matSpawnTimer <= 0 && this.materials.filter(m => !m.collected).length < 10) {
      this._spawnMaterial();
      this._matSpawnTimer = randBetween(6, 12);
    }
    for (const m of this.materials) m.update(dt);

    this.camera.follow(this.player.pos, dt);
    this._shakeAmt *= 0.9;
  }

  // ── Gun methods ─────────────────────────────────────────────

  _tryShoot() {
    if (this.bullets.length >= MAX_BULLETS) return;
    const angle  = this.player.aimAngle ?? 0;
    const cos    = Math.cos(angle);
    const sin    = Math.sin(angle);
    const muzzleOff = 18;
    const bx = this.player.pos.x + cos * muzzleOff;
    const by = this.player.pos.y + sin * muzzleOff;

    this.bullets.push({
      x: bx, y: by,
      vx: cos * BULLET_SPEED,
      vy: sin * BULLET_SPEED,
      trail: [],
      ttl: 2,
    });
    this._shootCooldown = SHOOT_COOLDOWN;
    this._muzzleFlash   = { x: bx, y: by, angle, ttl: 0.08 };
    this.audio.play('crack');
  }

  _updateBullets(dt) {
    for (let i = this.bullets.length - 1; i >= 0; i--) {
      const b = this.bullets[i];

      // Record trail
      b.trail.push({ x: b.x, y: b.y });
      if (b.trail.length > 5) b.trail.shift();

      b.x   += b.vx * dt;
      b.y   += b.vy * dt;
      b.ttl -= dt;

      let remove = false;

      // Out of world bounds or expired
      if (b.x < 0 || b.x > WORLD.width || b.y < 0 || b.y > WORLD.height || b.ttl <= 0) {
        remove = true;
      }

      // Zombie hit
      if (!remove) {
        for (const z of this.zombies) {
          if (z.state === 'dead') continue;
          const dist = Math.hypot(z.pos.x - b.x, z.pos.y - b.y);
          if (dist < 20) {
            z.health  -= 2;
            z.hitFlash = 0.15;
            if (z.health <= 0) {
              z.state    = 'dead';
              z.alpha    = 1;
              this.killCount++;
              if (this.ui) this.ui.onKill();
            }
            this._spawnEffect('blood', b.x, b.y);
            remove = true;
            break;
          }
        }
      }

      // Structure hit (intact wall segments)
      if (!remove) {
        for (const s of this.structures) {
          if (s.isPassable()) continue;
          const hw = s.sw / 2, hh = s.sh / 2;
          if (b.x >= s.cx - hw && b.x <= s.cx + hw &&
              b.y >= s.cy - hh && b.y <= s.cy + hh) {
            this._spawnEffect('spark', b.x, b.y);
            remove = true;
            break;
          }
        }
      }

      if (remove) this.bullets.splice(i, 1);
    }
  }

  _spawnEffect(type, x, y) {
    const count = type === 'blood' ? 6 : 4;
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 60 + Math.random() * 120;
      const ttl   = 0.25 + Math.random() * 0.2;
      this._effects.push({
        type,
        x, y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r:  2 + Math.random() * 2.5,
        ttl,
        maxTtl: ttl,
        color: type === 'blood' ? '#cc1818' : '#ffcc44',
      });
    }
  }

  _updateEffects(dt) {
    for (let i = this._effects.length - 1; i >= 0; i--) {
      const e = this._effects[i];
      e.x   += e.vx * dt;
      e.y   += e.vy * dt;
      e.vy  += 140 * dt;   // gravity
      e.ttl -= dt;
      if (e.ttl <= 0) this._effects.splice(i, 1);
    }
  }

  _renderBullets(ctx) {
    for (const b of this.bullets) {
      // Trail
      if (b.trail.length > 1) {
        ctx.save();
        ctx.strokeStyle = 'rgba(255,220,80,0.45)';
        ctx.lineWidth   = 2;
        ctx.beginPath();
        ctx.moveTo(b.trail[0].x, b.trail[0].y);
        for (const pt of b.trail) ctx.lineTo(pt.x, pt.y);
        ctx.lineTo(b.x, b.y);
        ctx.stroke();
        ctx.restore();
      }
      // Glow halo
      ctx.fillStyle = 'rgba(255,220,80,0.28)';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 7, 0, Math.PI * 2);
      ctx.fill();
      // Core dot
      ctx.fillStyle = '#ffe060';
      ctx.beginPath();
      ctx.arc(b.x, b.y, 3, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  _renderEffects(ctx) {
    for (const e of this._effects) {
      ctx.globalAlpha = Math.max(0, e.ttl / e.maxTtl);
      ctx.fillStyle   = e.color;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  _renderMuzzleFlash(ctx) {
    const f     = this._muzzleFlash;
    const alpha = Math.max(0, f.ttl / 0.08);
    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    // Spiky burst
    ctx.fillStyle = 'rgba(255,255,160,0.9)';
    for (let i = 0; i < 5; i++) {
      ctx.save();
      ctx.rotate(i * Math.PI * 2 / 5 - 0.3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(-3, 8);
      ctx.lineTo(0, 18);
      ctx.lineTo(3, 8);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
    ctx.fillStyle = 'rgba(255,200,60,0.6)';
    ctx.beginPath();
    ctx.arc(0, 0, 10, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // ── Spawn helpers ────────────────────────────────────────────

  _spawnMaterial() {
    const zone = randItem(MAT_ZONES);
    const type = randItem(MAT_TYPES);
    this.materials.push(new MaterialItem(
      type,
      zone.x + randBetween(-zone.r, zone.r),
      zone.y + randBetween(-zone.r, zone.r)
    ));
  }

  // ── Draw ─────────────────────────────────────────────────────

  draw() {
    const ctx = this.ctx;
    const W = this.canvas.width, H = this.canvas.height;

    ctx.save();
    if (this._shakeAmt > 0.01) {
      ctx.translate(
        (Math.random() - 0.5) * this._shakeAmt * 8,
        (Math.random() - 0.5) * this._shakeAmt * 8
      );
    }

    ctx.clearRect(-10, -10, W + 20, H + 20);

    this.camera.begin(ctx);

    // 1. Exterior ground
    ctx.fillStyle = OUTER_COLOR;
    ctx.fillRect(0, 0, WORLD.width, WORLD.height);

    // 2. Room floors with patterns
    for (const room of ROOMS) {
      ctx.fillStyle = room.floor;
      ctx.fillRect(room.x, room.y, room.w, room.h);

      if (room.id === 'kitchen' && room.tileSize > 0) {
        // Checkerboard tiles
        const ts = room.tileSize;
        for (let tx = room.x; tx < room.x + room.w; tx += ts) {
          for (let ty = room.y; ty < room.y + room.h; ty += ts) {
            const col = Math.floor((tx - room.x) / ts);
            const row = Math.floor((ty - room.y) / ts);
            if ((col + row) % 2 === 0) {
              ctx.fillStyle = room.floorAlt;
              ctx.fillRect(
                tx, ty,
                Math.min(ts, room.x + room.w - tx),
                Math.min(ts, room.y + room.h - ty)
              );
            }
          }
        }
      } else if (room.tileSize > 0) {
        // Floor grid lines
        ctx.strokeStyle = room.floorAlt;
        ctx.lineWidth = 1;
        const ts = room.tileSize;
        for (let tx = room.x; tx < room.x + room.w; tx += ts) {
          ctx.beginPath(); ctx.moveTo(tx, room.y); ctx.lineTo(tx, room.y + room.h); ctx.stroke();
        }
        for (let ty = room.y; ty < room.y + room.h; ty += ts) {
          ctx.beginPath(); ctx.moveTo(room.x, ty); ctx.lineTo(room.x + room.w, ty); ctx.stroke();
        }
      }

      // Room label
      ctx.fillStyle = 'rgba(255,255,255,0.07)';
      ctx.font = '14px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(room.label.toUpperCase(), room.x + room.w / 2, room.y + room.h / 2);
    }

    // 3. Exterior zombie silhouettes (before walls)
    for (const z of this.zombies) {
      if (z.state === 'approaching' || z.state === 'attacking') z.draw(ctx);
    }

    // 4. Outer walls
    this._drawOuterWalls(ctx);

    // 5. Interior walls + doors
    this._drawInteriorWalls(ctx);

    // 6. Structures
    for (const s of this.structures) s.draw(ctx);

    // 7. Furniture (brighter)
    for (const f of FURNITURE) this._drawFurniture(ctx, f);

    // 8. Materials
    for (const m of this.materials) m.draw(ctx);

    // 9. Interior zombies
    for (const z of this.zombies) {
      if (z.state !== 'approaching' && z.state !== 'attacking') z.draw(ctx);
    }

    // 10. Player
    this.player.draw(ctx);

    // 10.5. Pet companion (between player and projectiles)
    if (this.pet) this.pet.draw(ctx);

    // 11. Bullets + effects + muzzle flash (world space)
    this._renderBullets(ctx);
    this._renderEffects(ctx);
    if (this._muzzleFlash && this._muzzleFlash.ttl > 0) this._renderMuzzleFlash(ctx);

    // 12. Repair progress bar
    this.repair.draw(ctx, this.camera);

    this.camera.end(ctx);

    // ── Weapon switch screen flash ───────────────────────────
    if (this._weaponFlash > 0) {
      const a = (this._weaponFlash / 0.22) * 0.18;
      ctx.fillStyle = this.currentWeapon === 'gun'
        ? `rgba(61,180,255,${a.toFixed(3)})`
        : `rgba(255,107,0,${a.toFixed(3)})`;
      ctx.fillRect(0, 0, W, H);
    }

    // Screen-space overlays
    this.lighting.draw(ctx, this.camera, this.player);

    // Pass zombieAI ref so UISystem can access wave info
    if (this.state === 'playing') {
      this.ui.draw(ctx, this);
    } else {
      this.ui.drawEndScreen(ctx, this.state, this);
    }

    ctx.restore();
  }

  _drawOuterWalls(ctx) {
    const { x, y, width: w, height: h, wallThick: t } = HOUSE;
    ctx.fillStyle = WALL_COLOR;
    ctx.fillRect(x, y, w, t);           // Top
    ctx.fillRect(x, y + h - t, w, t);   // Bottom
    ctx.fillRect(x, y, t, h);           // Left
    ctx.fillRect(x + w - t, y, t, h);   // Right

    // Inner edge highlight (wall top cap)
    ctx.strokeStyle = 'rgba(61,255,122,0.08)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x + t, y + t, w - 2 * t, h - 2 * t);

    // Punch holes for exterior structures
    for (const s of this.structures) {
      const hw = s.sw / 2 + 2, hh2 = s.sh / 2 + 2;
      ctx.fillStyle = s.isPassable() ? OUTER_COLOR : '#121e10';
      ctx.fillRect(s.cx - hw, s.cy - hh2, hw * 2, hh2 * 2);
    }
  }

  _drawInteriorWalls(ctx) {
    ctx.fillStyle = WALL_COLOR;
    for (const w of INTERIOR_WALLS) ctx.fillRect(w.x, w.y, w.w, w.h);

    // Door openings — slightly lighter, with visible frame
    for (const d of INTERIOR_DOORS) {
      ctx.fillStyle = '#1e3018';
      ctx.fillRect(d.x, d.y, d.w, d.h);
      // Door frame (brown wood)
      ctx.strokeStyle = '#5a3010';
      ctx.lineWidth = 3;
      ctx.strokeRect(d.x, d.y, d.w, d.h);
    }
  }

  _drawFurniture(ctx, f) {
    const { x, y, w, h, type } = f;

    // Brighter furniture fills
    const colorMap = {
      sofa:    '#2a4a60',
      table:   '#4a2a10',
      bed:     '#2a2a4a',
      shelf:   '#2a3a20',
      cabinet: '#2a3a20',
      counter: '#2a4228',
      fridge:  '#3a4040',
      desk:    '#4a2a10',
    };
    const col = colorMap[type] || f.color || '#2a3a28';

    ctx.fillStyle = col;
    ctx.beginPath();
    if (ctx.roundRect) ctx.roundRect(x, y, w, h, 4);
    else ctx.rect(x, y, w, h);
    ctx.fill();

    // Top edge highlight for depth
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.fillRect(x, y, w, 3);

    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    ctx.lineWidth = 1;
    ctx.strokeRect(x, y, w, h);

    // Type details
    switch (type) {
      case 'sofa':
        ctx.fillStyle = 'rgba(255,255,255,0.08)';
        ctx.fillRect(x + w * 0.33, y + 4, 2, h - 8);
        ctx.fillRect(x + w * 0.66, y + 4, 2, h - 8);
        break;
      case 'bed':
        ctx.fillStyle = '#d0d0e8';
        ctx.fillRect(x + 8, y + 8, w - 16, h * 0.45);
        break;
      case 'counter':
        ctx.fillStyle = 'rgba(255,255,255,0.1)';
        ctx.fillRect(x, y, w, 5);
        break;
    }

    // Label
    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.font = '9px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(type, x + w / 2, y + h / 2 + 3);
  }
}
