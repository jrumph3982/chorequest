// ── Pet canvas entity ──────────────────────────────────────────────────────────
// Follows the player with smooth easing. Each pet type has a passive ability.

function hexToRgb(hex) {
  const n = parseInt((hex || '#c87a3a').replace('#', ''), 16);
  return { r: (n >> 16) & 0xff, g: (n >> 8) & 0xff, b: n & 0xff };
}

function darkenHex(hex, pct) {
  const { r, g, b } = hexToRgb(hex);
  const d = Math.round(2.55 * pct);
  const clamp = (v) => Math.max(0, v - d).toString(16).padStart(2, '0');
  return '#' + clamp(r) + clamp(g) + clamp(b);
}

export class Pet {
  constructor(petData) {
    this.name      = petData.name  || 'Buddy';
    this.type      = (petData.type  || 'dog').toLowerCase();
    this.color     = petData.color || '#c87a3a';
    this.darkColor = darkenHex(this.color, 15);

    // World-space position (starts off-screen; snaps to player on first frame)
    this.x = -9999;
    this.y = -9999;

    // Health
    this.hp    = 3;
    this.maxHp = 3;

    // Walk animation
    this._walkT    = 0;
    this._idleT    = 0;
    this._emotes   = [];  // { text, x, y, ttl, maxTtl }

    // Passive ability timers
    this._abilityTimer = 0;

    // Scared state
    this._scared     = false;
    this._scaredTimer = 0;
    this._cornerX    = 0;
    this._cornerY    = 0;

    // Dog-bark state
    this._barkRings  = [];  // { r, maxR, alpha }

    // Parrot warning state
    this._warningArrows = []; // { angle, ttl }

    // Hamster scrap target
    this._scrapTarget = null;
  }

  // ── Update ──────────────────────────────────────────────────────────────────

  update(dt, player, scene) {
    if (this.hp <= 0) return;

    this._walkT  += dt;
    this._idleT  += dt;
    this._abilityTimer = Math.max(0, this._abilityTimer - dt);

    // Snap to player on first frame
    if (this.x === -9999) {
      this.x = player.pos.x;
      this.y = player.pos.y;
    }

    // Target: offset from player (right side, slight behind)
    const offsetX = player.facing.x >= 0 ? 22 : -22;
    const targetX = player.pos.x + offsetX;
    const targetY = player.pos.y + 8;

    if (this._scared && this._scaredTimer > 0) {
      // Run to corner
      this._scaredTimer -= dt;
      this.x += (this._cornerX - this.x) * Math.min(1, dt * 3);
      this.y += (this._cornerY - this.y) * Math.min(1, dt * 3);
    } else {
      this._scared = false;
      this.x += (targetX - this.x) * Math.min(1, dt * 6);
      this.y += (targetY - this.y) * Math.min(1, dt * 6);
    }

    // Emotes
    for (const e of this._emotes) {
      e.ttl -= dt;
      e.y  -= 12 * dt;
    }
    this._emotes = this._emotes.filter((e) => e.ttl > 0);

    // Bark rings (dog)
    for (const ring of this._barkRings) {
      ring.r     += 60 * dt;
      ring.alpha -= dt * 1.5;
    }
    this._barkRings = this._barkRings.filter((ring) => ring.alpha > 0);

    // Warning arrows (parrot)
    for (const a of this._warningArrows) a.ttl -= dt;
    this._warningArrows = this._warningArrows.filter((a) => a.ttl > 0);

    // Passive abilities
    this._updatePassive(dt, scene);
  }

  _updatePassive(dt, scene) {
    if (!scene || this.hp <= 0) return;

    switch (this.type) {
      case 'dog':
        // Bark: slow zombies within 80px every 8s
        if (this._abilityTimer <= 0) {
          let barked = false;
          for (const z of scene.zombies) {
            const dx = z.pos.x - this.x, dy = z.pos.y - this.y;
            if (Math.hypot(dx, dy) < 80) {
              z._slowTimer = Math.max(z._slowTimer || 0, 2);
              barked = true;
            }
          }
          if (barked) {
            this._abilityTimer = 8;
            this._barkRings.push({ r: 8, maxR: 80, alpha: 0.8 });
            this.emote('WOOF!');
          }
        }
        break;

      case 'cat':
        // Distract: every 12s make a nearby zombie stand still for 2s
        if (this._abilityTimer <= 0) {
          const nearby = scene.zombies
            .filter((z) => {
              const dx = z.pos.x - this.x, dy = z.pos.y - this.y;
              return Math.hypot(dx, dy) < 100 && z.state === 'wandering';
            })
            .sort((a, b) => {
              const da = Math.hypot(a.pos.x - this.x, a.pos.y - this.y);
              const db = Math.hypot(b.pos.x - this.x, b.pos.y - this.y);
              return da - db;
            });
          if (nearby.length > 0) {
            nearby[0]._distractTimer = 2;
            this._abilityTimer = 12;
            this.emote('😼');
          }
        }
        break;

      case 'rabbit':
        // Speed boost: handled externally in Player via scene.pet
        // Emit a twinkle emote occasionally
        if (this._idleT > 8) {
          this._idleT = 0;
          this.emote('✨');
        }
        break;

      case 'hamster':
        // Auto-collect scrap within 30px
        if (!this._scrapTarget) {
          for (const m of scene.materials) {
            if (m.collected) continue;
            const dx = m.x - this.x, dy = m.y - this.y;
            if (Math.hypot(dx, dy) < 30) {
              m.collected = true;
              scene.player.inventory.push(m.type);
              this._scrapTarget = null;
              this.emote('🔩');
              break;
            }
          }
        }
        break;

      case 'parrot':
        // Warn 2s before zombies enter house from off-screen
        if (this._abilityTimer <= 0) {
          for (const z of scene.zombies) {
            if (z.state === 'approaching') {
              const angle = Math.atan2(z.pos.y - this.y, z.pos.x - this.x);
              this._warningArrows.push({ angle, ttl: 2 });
              this.emote('SQUAWK!');
              this._abilityTimer = 4;
              break;
            }
          }
        }
        break;
    }
  }

  // Call this when zombie attacks pet
  takeDamage() {
    if (this.hp <= 0) return;
    this.hp--;
    this.emote('💢');
    if (this.hp <= 0) this.emote('😵');
  }

  scare(cornerX, cornerY) {
    if (this._scared) return;
    this._scared      = true;
    this._scaredTimer = 4;
    this._cornerX     = cornerX;
    this._cornerY     = cornerY;
    this.emote('!');
  }

  emote(text) {
    this._emotes.push({ text, x: this.x, y: this.y - 18, ttl: 1.8, maxTtl: 1.8 });
  }

  // Speed boost multiplier for rabbit
  getSpeedMultiplier() {
    if (this.type === 'rabbit' && this.hp > 0) return 1.08;
    return 1.0;
  }

  // ── Draw ────────────────────────────────────────────────────────────────────

  draw(ctx) {
    if (this.hp <= 0) return;

    const x = Math.round(this.x);
    const y = Math.round(this.y);

    ctx.save();

    // Bark rings (dog)
    for (const ring of this._barkRings) {
      ctx.strokeStyle = `rgba(255,200,50,${ring.alpha.toFixed(2)})`;
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(x, y, ring.r, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Warning arrows (parrot)
    for (const arrow of this._warningArrows) {
      const ttlFrac = arrow.ttl / 2;
      const pulse   = 0.5 + 0.5 * Math.sin(arrow.ttl * 8);
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(arrow.angle);
      ctx.fillStyle = `rgba(255,80,80,${(ttlFrac * 0.9 * pulse).toFixed(2)})`;
      ctx.beginPath();
      ctx.moveTo(30, 0);
      ctx.lineTo(20, -7);
      ctx.lineTo(20, 7);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }

    // Walk bob (only when close to player, i.e. moving)
    const bobY = Math.sin(this._walkT * 6) * 1.5;

    ctx.translate(x, y + bobY);
    ctx.scale(0.55, 0.55);

    this._drawBody(ctx);

    ctx.restore();

    // HP hearts (above pet)
    this._drawHp(ctx, x, y + bobY - 22);

    // Emotes
    for (const e of this._emotes) {
      const alpha = Math.min(1, e.ttl / 0.4);
      ctx.save();
      ctx.globalAlpha = alpha;
      ctx.font = '10px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = '#fff';
      ctx.fillText(e.text, Math.round(e.x), Math.round(e.y));
      ctx.restore();
    }
  }

  _drawHp(ctx, x, y) {
    const size = 5;
    const gap  = 7;
    const startX = x - ((this.maxHp - 1) * gap) / 2;
    for (let i = 0; i < this.maxHp; i++) {
      ctx.fillStyle = i < this.hp ? '#ff4a4a' : '#1a0808';
      ctx.strokeStyle = '#aa2020';
      ctx.lineWidth = 0.8;
      const hx = startX + i * gap;
      // Simple heart: two circles + triangle
      ctx.beginPath();
      ctx.arc(hx - 1.2, y, 2, Math.PI, 0);
      ctx.arc(hx + 1.2, y, 2, Math.PI, 0);
      ctx.lineTo(hx + 3, y + 1);
      ctx.lineTo(hx, y + 4.5);
      ctx.lineTo(hx - 3, y + 1);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
    }
  }

  // Each type drawn in a ~40×40 unit box centred at 0,0 (scaled 0.55 externally)
  _drawBody(ctx) {
    const c  = this.color;
    const dk = this.darkColor;

    switch (this.type) {
      case 'dog':     this._drawDog(ctx, c, dk);     break;
      case 'cat':     this._drawCat(ctx, c, dk);     break;
      case 'rabbit':  this._drawRabbit(ctx, c, dk);  break;
      case 'hamster': this._drawHamster(ctx, c, dk); break;
      case 'parrot':  this._drawParrot(ctx, c, dk);  break;
      case 'drone':   this._drawDrone(ctx);          break;
      case 'raccoon': this._drawRaccoon(ctx, c, dk); break;
      default:        this._drawDog(ctx, c, dk);     break;
    }
  }

  // ── Pet body drawing methods (canvas 2D, centred at 0,0) ──────────────────

  _drawDog(ctx, c, dk) {
    // Body
    this._ellipse(ctx, c, 0, 8, 13, 9);
    // Head
    this._circle(ctx, c, 0, -4, 9);
    // Ears
    ctx.save(); ctx.translate(-8, -6); ctx.rotate(-0.26);
    this._ellipse(ctx, dk, 0, 0, 5, 7); ctx.restore();
    ctx.save(); ctx.translate(8, -6); ctx.rotate(0.26);
    this._ellipse(ctx, dk, 0, 0, 5, 7); ctx.restore();
    // Eyes
    this._circle(ctx, '#fff', -4, -5, 2.5);
    this._circle(ctx, '#fff', 4, -5, 2.5);
    this._circle(ctx, '#1a0e06', -3, -5, 1.5);
    this._circle(ctx, '#1a0e06', 5, -5, 1.5);
    // Nose
    this._ellipse(ctx, '#1a0e06', 0, -1, 3, 2);
    // Tongue
    ctx.beginPath(); ctx.moveTo(-3, 1); ctx.quadraticCurveTo(0, 5, 3, 1);
    ctx.fillStyle = '#ff9090'; ctx.fill();
    // Tail
    ctx.beginPath(); ctx.moveTo(13, 5); ctx.quadraticCurveTo(18, -1, 15, 8);
    ctx.strokeStyle = c; ctx.lineWidth = 3.5; ctx.lineCap = 'round'; ctx.stroke();
    // Legs
    [[-8, 14], [-3, 14], [3, 14], [8, 14]].forEach(([lx, ly]) =>
      this._roundRect(ctx, dk, lx - 2, ly, 4, 5, 2)
    );
  }

  _drawCat(ctx, c, dk) {
    this._ellipse(ctx, c, 0, 8, 11, 8);
    this._circle(ctx, c, 0, -3, 8);
    // Ears
    ctx.fillStyle = c;
    ctx.beginPath(); ctx.moveTo(-8, -9); ctx.lineTo(-12, -18); ctx.lineTo(-3, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(8, -9);  ctx.lineTo(12, -18);  ctx.lineTo(3, -12);  ctx.fill();
    ctx.fillStyle = '#ffb0c0';
    ctx.beginPath(); ctx.moveTo(-7.5, -10); ctx.lineTo(-10.5, -16); ctx.lineTo(-4, -12); ctx.fill();
    ctx.beginPath(); ctx.moveTo(7.5, -10);  ctx.lineTo(10.5, -16);  ctx.lineTo(4, -12);  ctx.fill();
    // Eyes (slit pupils)
    this._ellipse(ctx, '#60c060', -4, -4, 3, 2.5);
    this._ellipse(ctx, '#60c060', 4, -4, 3, 2.5);
    this._roundRect(ctx, '#1a0e06', -5, -5.5, 2, 3, 1);
    this._roundRect(ctx, '#1a0e06', 3, -5.5, 2, 3, 1);
    // Nose
    ctx.fillStyle = '#ff9090';
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-1.5, 1.5); ctx.lineTo(1.5, 1.5); ctx.fill();
    // Tail
    ctx.beginPath(); ctx.moveTo(11, 6); ctx.bezierCurveTo(18, -4, 16, 14, 11, 12);
    ctx.strokeStyle = c; ctx.lineWidth = 3; ctx.lineCap = 'round'; ctx.stroke();
    // Legs
    [[-7, 13], [-2, 13], [2, 13], [7, 13]].forEach(([lx, ly]) =>
      this._roundRect(ctx, dk, lx - 2, ly, 4, 5, 2)
    );
  }

  _drawRabbit(ctx, c, dk) {
    this._ellipse(ctx, c, 0, 9, 10, 9);
    this._circle(ctx, c, 0, -2, 8);
    // Tall ears
    this._roundRect(ctx, c, -8, -20, 5, 16, 2.5);
    this._roundRect(ctx, c, 3, -20, 5, 16, 2.5);
    this._roundRect(ctx, '#ffb0c0', -7, -19, 3, 13, 1.5);
    this._roundRect(ctx, '#ffb0c0', 4, -19, 3, 13, 1.5);
    // Eyes
    this._circle(ctx, '#1a0e06', -4, -3, 2.5);
    this._circle(ctx, '#1a0e06', 4, -3, 2.5);
    this._circle(ctx, '#fff', -3, -3.7, 0.8);
    this._circle(ctx, '#fff', 5, -3.7, 0.8);
    // Nose
    this._circle(ctx, '#ff9090', 0, 1, 2);
    // White tail
    this._circle(ctx, '#fff', 10, 11, 3.5);
    // Legs
    [[-6, 15], [-1, 15], [1, 15], [6, 15]].forEach(([lx, ly]) =>
      this._roundRect(ctx, dk, lx - 2, ly, 4, 4, 2)
    );
  }

  _drawHamster(ctx, c, dk) {
    this._ellipse(ctx, c, 0, 9, 13, 10);
    this._circle(ctx, c, 0, -3, 11);
    // Chubby cheeks
    const lt = this._lighten(c, 20);
    this._circle(ctx, lt, -9, 0, 5);
    this._circle(ctx, lt, 9, 0, 5);
    // Ears
    this._circle(ctx, dk, -8, -11, 4);
    this._circle(ctx, dk, 8, -11, 4);
    this._circle(ctx, '#ffb0c0', -8, -11, 2.5);
    this._circle(ctx, '#ffb0c0', 8, -11, 2.5);
    // Eyes
    this._circle(ctx, '#1a0e06', -4, -4, 2.5);
    this._circle(ctx, '#1a0e06', 4, -4, 2.5);
    this._circle(ctx, '#fff', -3, -4.7, 0.8);
    this._circle(ctx, '#fff', 5, -4.7, 0.8);
    // Nose
    this._ellipse(ctx, '#1a0e06', 0, 1, 2, 1.5);
    // Tiny legs
    this._roundRect(ctx, dk, -6, 17, 4, 3, 1.5);
    this._roundRect(ctx, dk, 2, 17, 4, 3, 1.5);
  }

  _drawParrot(ctx, c, dk) {
    // Tail feathers
    [[-6, 13], [0, 14], [6, 13]].forEach(([px, py], i) => {
      ctx.fillStyle = i === 1 ? c : dk;
      ctx.beginPath(); ctx.moveTo(px - 2, py); ctx.lineTo(px, py + 8); ctx.lineTo(px + 2, py); ctx.fill();
    });
    this._ellipse(ctx, c, 0, 6, 10, 10);
    this._ellipse(ctx, dk, -6, 7, 5, 8);
    this._circle(ctx, c, 0, -5, 9);
    // Crest
    [[-5, -13], [0, -15], [5, -13]].forEach(([px, py], i) => {
      ctx.fillStyle = i === 1 ? c : dk;
      ctx.beginPath(); ctx.moveTo(px - 2, -12); ctx.lineTo(px, py); ctx.lineTo(px + 2, -12); ctx.fill();
    });
    // Eye
    this._circle(ctx, '#fff', -3, -6, 3);
    this._circle(ctx, '#1a0e06', -3, -6, 2);
    this._circle(ctx, '#fff', -2.5, -6.5, 0.7);
    // Beak
    ctx.fillStyle = '#f29d26';
    ctx.beginPath(); ctx.moveTo(2, -7); ctx.lineTo(7, -5); ctx.lineTo(2, -3); ctx.fill();
  }

  _drawDrone(ctx) {
    const c = '#6a8a9a', dk = '#3a5a6a';
    this._roundRect(ctx, c, -10, -1, 20, 10, 4);
    this._roundRect(ctx, dk, -6, -4, 12, 6, 3);
    this._circle(ctx, '#3db4ff', 0, -1, 3);
    this._ellipse(ctx, dk, -12, -2, 7, 2.5);
    this._ellipse(ctx, dk, 12, -2, 7, 2.5);
    this._circle(ctx, '#3db4ff', -12, -2, 1.5);
    this._circle(ctx, '#3db4ff', 12, -2, 1.5);
  }

  _drawRaccoon(ctx, c, dk) {
    this._ellipse(ctx, c, 0, 8, 11, 8);
    this._circle(ctx, c, 0, -3, 8);
    this._ellipse(ctx, dk, -8, -7, 5, 6);
    this._ellipse(ctx, dk, 8, -7, 5, 6);
    // Eye mask
    this._ellipse(ctx, '#222', -4, -4, 4, 3);
    this._ellipse(ctx, '#222', 4, -4, 4, 3);
    this._circle(ctx, '#fff', -4, -4, 2.2);
    this._circle(ctx, '#fff', 4, -4, 2.2);
    this._circle(ctx, '#1a0e06', -3, -4, 1.3);
    this._circle(ctx, '#1a0e06', 5, -4, 1.3);
    this._ellipse(ctx, '#1a0e06', 0, 0, 3, 2);
    // Striped tail
    ctx.beginPath(); ctx.moveTo(11, 4); ctx.bezierCurveTo(18, -3, 16, 8, 10, 11);
    ctx.strokeStyle = c; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.stroke();
    ctx.beginPath(); ctx.moveTo(11, 4); ctx.bezierCurveTo(18, -3, 16, 8, 10, 11);
    ctx.strokeStyle = '#333'; ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.setLineDash([3, 3]); ctx.stroke();
    ctx.setLineDash([]);
    // Legs
    [[-7, 13], [-2, 13], [2, 13], [7, 13]].forEach(([lx, ly]) =>
      this._roundRect(ctx, dk, lx - 2, ly, 4, 5, 2)
    );
  }

  // ── Canvas helpers ──────────────────────────────────────────────────────────

  _circle(ctx, fill, x, y, r) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }

  _ellipse(ctx, fill, x, y, rx, ry) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.ellipse(x, y, rx, ry, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  _roundRect(ctx, fill, x, y, w, h, r) {
    ctx.fillStyle = fill;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, r);
    ctx.fill();
  }

  _lighten(hex, pct) {
    const { r, g, b } = hexToRgb(hex);
    const d = Math.round(2.55 * pct);
    const clamp = (v) => Math.min(255, v + d).toString(16).padStart(2, '0');
    return '#' + clamp(r) + clamp(g) + clamp(b);
  }
}
