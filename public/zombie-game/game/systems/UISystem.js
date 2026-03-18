const MAT_COLORS = { wood: '#8a6020', metal: '#6a7a8a', tape: '#c8a030' };
const MAT_ICONS  = { wood: '🪵', metal: '⚙️', tape: '🩹' };

export class UISystem {
  constructor(canvas) {
    this.canvas = canvas;
    this._killScale = 1;     // pop animation on kill
    this._killTimer = 0;
  }

  onKill() {
    this._killScale = 1.5;
    this._killTimer = 0.25;
  }

  update(dt) {
    if (this._killTimer > 0) {
      this._killTimer -= dt;
      this._killScale = 1 + 0.5 * (this._killTimer / 0.25);
    } else {
      this._killScale = 1;
    }
  }

  draw(ctx, game) {
    const W = this.canvas.width, H = this.canvas.height;
    const { timer, integrity, player, killCount } = game;

    ctx.save();

    // ── Screen flash (damage) ────────────────────────────────
    if (game._screenFlash && game._screenFlash.ttl > 0) {
      ctx.fillStyle = game._screenFlash.color;
      ctx.fillRect(0, 0, W, H);
      game._screenFlash.ttl -= 1 / 60;
    }

    // ── Timer (top-left) ─────────────────────────────────────
    const mins = Math.floor(timer / 60);
    const secs = Math.floor(timer % 60).toString().padStart(2, '0');
    const timerColor = timer < 30 ? '#ef4444' : timer < 60 ? '#f59e0b' : '#3dff7a';

    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this._roundRect(ctx, 10, 10, 140, 46, 6); ctx.fill();
    ctx.fillStyle = timerColor;
    if (timer < 30) {
      ctx.globalAlpha = 0.8 + 0.2 * Math.abs(Math.sin(Date.now() * 0.008));
    }
    ctx.font = 'bold 22px "VT323", "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('💀 ' + mins + ':' + secs, 18, 44);
    ctx.globalAlpha = 1;

    // ── Kill counter (top-center) ────────────────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this._roundRect(ctx, W / 2 - 65, 10, 130, 44, 6); ctx.fill();
    ctx.save();
    ctx.translate(W / 2, 36);
    ctx.scale(this._killScale, this._killScale);
    ctx.fillStyle = '#f59e0b';
    ctx.font = 'bold 13px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('☠ ' + killCount + ' KILLS', 0, 0);
    ctx.restore();

    // Wave indicator below kills
    if (game.zombieAI && game.zombieAI.currentWave > 0) {
      ctx.fillStyle = 'rgba(0,0,0,0.6)';
      this._roundRect(ctx, W / 2 - 50, 58, 100, 24, 4); ctx.fill();
      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('WAVE ' + game.zombieAI.currentWave, W / 2, 74);
    }

    // ── Wave announcement (center screen) ───────────────────
    if (game.zombieAI && game.zombieAI.waveAnnounce) {
      const ann = game.zombieAI.waveAnnounce;
      const alpha = Math.min(1, ann.ttl * 2);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(0,0,0,0.5)';
      this._roundRect(ctx, W / 2 - 160, H / 2 - 44, 320, 60, 8); ctx.fill();
      ctx.fillStyle = '#ff3030';
      ctx.font = 'bold 24px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(ann.text + ' INCOMING!', W / 2, H / 2 - 10);
      ctx.globalAlpha = 1;
    }

    // ── Integrity meter (top-right) ──────────────────────────
    const iW = 190, iH = 46;
    const ix = W - iW - 10;
    ctx.fillStyle = 'rgba(0,0,0,0.72)';
    this._roundRect(ctx, ix, 10, iW, iH, 6); ctx.fill();
    ctx.fillStyle = '#aaa';
    ctx.font = 'bold 8px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('🏠 BASE INTEGRITY', ix + 8, 26);
    const barW = iW - 16, barH = 10;
    const barX = ix + 8, barY = 30;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(barX, barY, barW, barH);
    const intPct = Math.max(0, integrity / 100);
    const intColor = intPct > 0.6 ? '#22c55e' : intPct > 0.3 ? '#f59e0b' : '#ef4444';
    if (intPct < 0.3) {
      ctx.globalAlpha = 0.7 + 0.3 * Math.abs(Math.sin(Date.now() * 0.006));
    }
    ctx.fillStyle = intColor;
    ctx.fillRect(barX, barY, barW * intPct, barH);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#3a3a3a';
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barW, barH);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 7px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(Math.round(integrity) + '%', ix + iW / 2, barY + 8);

    // ── Minimap (below integrity) ─────────────────────────────
    this._drawMinimap(ctx, game, ix, 62);

    // ── Player HP bar (top-left below timer) ─────────────────
    ctx.fillStyle = 'rgba(0,0,0,0.7)';
    this._roundRect(ctx, 10, 62, 140, 28, 4); ctx.fill();
    ctx.fillStyle = '#555';
    ctx.font = 'bold 7px "Press Start 2P", monospace';
    ctx.textAlign = 'left';
    ctx.fillText('❤ HP', 16, 74);
    const hpBarW = 90, hpBarH = 8;
    const hpPct = Math.max(0, player.hp / player.maxHp);
    ctx.fillStyle = '#1a0a0a';
    ctx.fillRect(50, 67, hpBarW, hpBarH);
    ctx.fillStyle = hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444';
    ctx.fillRect(50, 67, hpBarW * hpPct, hpBarH);
    ctx.strokeStyle = '#333';
    ctx.lineWidth = 1;
    ctx.strokeRect(50, 67, hpBarW, hpBarH);

    // ── Weapon HUD (top-left, below HP bar) ──────────────────
    this._drawWeaponHUD(ctx, game, W, H);

    // ── Inventory slots (bottom-center, compact) ──────────────
    const slotW = 56, slotH = 56, slotGap = 8;
    const totalW = 3 * slotW + 2 * slotGap;
    const startX = (W - totalW) / 2;
    const startY = H - slotH - 80;

    for (let i = 0; i < 3; i++) {
      const sx = startX + i * (slotW + slotGap);
      const mat = player.inventory[i];
      ctx.fillStyle = mat ? 'rgba(20,30,20,0.88)' : 'rgba(10,10,10,0.7)';
      this._roundRect(ctx, sx, startY, slotW, slotH, 6); ctx.fill();
      ctx.strokeStyle = mat ? MAT_COLORS[mat] : '#2a3a2a';
      ctx.lineWidth = 2;
      this._roundRect(ctx, sx, startY, slotW, slotH, 6); ctx.stroke();
      if (mat) {
        ctx.font = '20px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(MAT_ICONS[mat], sx + slotW / 2, startY + 32);
        ctx.fillStyle = MAT_COLORS[mat];
        ctx.font = 'bold 6px "Press Start 2P", monospace';
        ctx.fillText(mat.toUpperCase(), sx + slotW / 2, startY + 48);
      } else {
        ctx.fillStyle = '#2a3a2a';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('—', sx + slotW / 2, startY + 34);
      }
    }

    // ── Action buttons (bottom-center-right) ──────────────────
    this._drawActionButtons(ctx, game, W, H);

    // ── Repair prompt ─────────────────────────────────────────
    const nearest = player.nearestRepairTarget(game.structures);
    if (nearest && player.inventory.length > 0 && !game.repair.active) {
      ctx.fillStyle = 'rgba(0,0,0,0.75)';
      this._roundRect(ctx, W / 2 - 110, H - 162, 220, 22, 4); ctx.fill();
      ctx.fillStyle = '#3dff7a';
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('[SPACE] REPAIR ' + nearest.id.toUpperCase(), W / 2, H - 146);
    }

    // ── Screen vignette ───────────────────────────────────────
    const vig = ctx.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.3, W / 2, H / 2, Math.max(W, H) * 0.75);
    vig.addColorStop(0, 'rgba(0,0,0,0)');
    vig.addColorStop(1, 'rgba(0,0,0,0.5)');
    ctx.fillStyle = vig;
    ctx.fillRect(0, 0, W, H);

    ctx.restore();
  }

  _drawMinimap(ctx, game, x, y) {
    const mW = 120, mH = 72;
    // Background
    ctx.fillStyle = 'rgba(0,0,0,0.82)';
    this._roundRect(ctx, x, y, mW + 20, mH + 20, 4); ctx.fill();
    ctx.strokeStyle = '#2a4028';
    ctx.lineWidth = 1;
    this._roundRect(ctx, x, y, mW + 20, mH + 20, 4); ctx.stroke();

    const mx = x + 10, my = y + 10;

    // Scale: world 1800x1200 → 120x72
    const scX = mW / 1800, scY = mH / 1200;

    // House rooms
    const ROOMS = [
      { rx: 130, ry: 130, rw: 700, rh: 480 },
      { rx: 130, ry: 640, rw: 700, rh: 430 },
      { rx: 860, ry: 130, rw: 810, rh: 480 },
      { rx: 860, ry: 640, rw: 810, rh: 430 },
    ];
    ctx.fillStyle = '#1a2e18';
    for (const r of ROOMS) {
      ctx.fillRect(mx + r.rx * scX, my + r.ry * scY, r.rw * scX, r.rh * scY);
    }

    // Zombie dots
    ctx.fillStyle = '#ff3030';
    for (const z of game.zombies) {
      if (z.state === 'dead') continue;
      ctx.beginPath();
      ctx.arc(mx + z.pos.x * scX, my + z.pos.y * scY, 2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Player dot
    ctx.fillStyle = '#3dff7a';
    ctx.beginPath();
    ctx.arc(mx + game.player.pos.x * scX, my + game.player.pos.y * scY, 3, 0, Math.PI * 2);
    ctx.fill();
  }

  _drawWeaponHUD(ctx, game, W, H) {
    const isGun    = game.currentWeapon === 'gun';
    const slots    = [
      { label: 'MELEE', icon: '⚔',  color: '#ff6b00', active: !isGun },
      { label: 'GUN',   icon: '🔫', color: '#3db4ff', active: isGun  },
    ];
    const sw = 52, sh = 52, gap = 6;
    const totalW = slots.length * sw + (slots.length - 1) * gap;
    const bx0 = 10;
    const by  = 96;

    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    this._roundRect(ctx, bx0 - 4, by - 4, totalW + 8, sh + 18, 6); ctx.fill();

    slots.forEach((slot, i) => {
      const bx = bx0 + i * (sw + gap);

      // Slot background
      ctx.fillStyle = slot.active ? 'rgba(20,30,20,0.95)' : 'rgba(8,12,8,0.8)';
      this._roundRect(ctx, bx, by, sw, sh, 8); ctx.fill();

      // Border
      ctx.strokeStyle = slot.active ? slot.color : '#2a3a2a';
      ctx.lineWidth   = slot.active ? 2 : 1;
      ctx.globalAlpha = slot.active ? 1 : 0.4;
      this._roundRect(ctx, bx, by, sw, sh, 8); ctx.stroke();
      ctx.globalAlpha = 1;

      // Glow on active
      if (slot.active) {
        ctx.shadowColor = slot.color;
        ctx.shadowBlur  = 8;
      }

      // Icon
      ctx.font      = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = slot.active ? '#fff' : '#444';
      ctx.fillText(slot.icon, bx + sw / 2, by + 28);
      ctx.shadowBlur = 0;

      // Label
      ctx.fillStyle = slot.active ? slot.color : '#2a3a2a';
      ctx.font      = `bold 6px "Press Start 2P", monospace`;
      ctx.textAlign = 'center';
      ctx.fillText(slot.label, bx + sw / 2, by + sh - 5);

      // ∞ ammo for gun
      if (slot.label === 'GUN' && slot.active) {
        ctx.fillStyle = '#3db4ff';
        ctx.font      = 'bold 9px sans-serif';
        ctx.fillText('∞', bx + sw - 10, by + 12);
      }

      // [Q] hint on inactive slot
      if (!slot.active) {
        ctx.fillStyle = '#3a5a3a';
        ctx.font      = 'bold 5px "Press Start 2P", monospace';
        ctx.textAlign = 'center';
        ctx.fillText('[Q]', bx + sw / 2, by - 8);
      }
    });

    // Shoot cooldown bar under gun slot when gun active
    if (isGun) {
      const barX = bx0 + (sw + gap);
      const barY = by + sh + 4;
      const barW = sw;
      const pct  = Math.max(0, 1 - game._shootCooldown / 0.4);
      ctx.fillStyle = '#1a2a1a';
      ctx.fillRect(barX, barY, barW, 4);
      ctx.fillStyle = pct >= 1 ? '#3db4ff' : '#1a5a80';
      ctx.fillRect(barX, barY, barW * pct, 4);
    }
  }

  _drawActionButtons(ctx, game, W, H) {
    const isGun  = game.currentWeapon === 'gun';
    const btns = [
      {
        label: isGun ? 'FIRE'   : 'ATTACK',
        key:   isGun ? 'MOUSE'  : 'E',
        color: isGun ? '#3db4ff' : '#ff6b00',
        icon:  isGun ? '🔫'    : '⚔',
        x: W - 220,
        cooldownPct: isGun
          ? game._shootCooldown / 0.4
          : game.player._atkTimer / 0.35,
      },
      { label: 'REPAIR',  key: 'SPC', color: '#60b0ff', icon: '🔧', x: W - 148, cooldownPct: (game.repair._cooldown || 0) / 0.5 },
      { label: 'FORTIFY', key: 'F',   color: '#3dff7a', icon: '🪵', x: W - 76,  cooldownPct: (game.repair._fortifyCooldown || 0) / 1.5 },
    ];

    for (const btn of btns) {
      const bx = btn.x, by = H - 68;
      const bw = 60, bh = 60;

      // Background
      ctx.fillStyle = 'rgba(10,20,10,0.9)';
      this._roundRect(ctx, bx, by, bw, bh, 10); ctx.fill();
      // Border
      ctx.strokeStyle = btn.color;
      ctx.lineWidth = 2;
      ctx.globalAlpha = 0.7;
      this._roundRect(ctx, bx, by, bw, bh, 10); ctx.stroke();
      ctx.globalAlpha = 1;

      // Cooldown arc (depleting border)
      if (btn.cooldownPct > 0) {
        ctx.strokeStyle = 'rgba(0,0,0,0.6)';
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh / 2, bw / 2 + 2, -Math.PI / 2, -Math.PI / 2 + Math.PI * 2 * btn.cooldownPct);
        ctx.stroke();
      }

      // Key badge (above button)
      ctx.fillStyle = '#0a1208';
      this._roundRect(ctx, bx + bw / 2 - 12, by - 18, 24, 16, 3); ctx.fill();
      ctx.strokeStyle = '#2a4028';
      ctx.lineWidth = 1;
      this._roundRect(ctx, bx + bw / 2 - 12, by - 18, 24, 16, 3); ctx.stroke();
      ctx.fillStyle = '#4a7a40';
      ctx.font = 'bold 8px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.key, bx + bw / 2, by - 7);

      // Icon
      ctx.font = '22px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(btn.icon, bx + bw / 2, by + 30);

      // Label
      ctx.fillStyle = btn.color;
      ctx.font = 'bold 6px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText(btn.label, bx + bw / 2, by + 52);
    }
  }

  drawEndScreen(ctx, type, game) {
    const W = ctx.canvas.width, H = ctx.canvas.height;
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, W, H);

    const bx = W / 2 - 220, by = H / 2 - 130;
    ctx.fillStyle = 'rgba(10,20,10,0.9)';
    this._roundRect(ctx, bx, by, 440, 260, 12); ctx.fill();
    ctx.strokeStyle = type === 'victory' ? '#3dff7a' : '#ef4444';
    ctx.lineWidth = 2;
    this._roundRect(ctx, bx, by, 440, 260, 12); ctx.stroke();

    if (type === 'victory') {
      ctx.fillStyle = '#3dff7a';
      ctx.font = 'bold 26px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('SURVIVED!', W / 2, H / 2 - 70);
      ctx.fillStyle = '#f5c842';
      ctx.font = 'bold 10px "Press Start 2P", monospace';
      ctx.fillText('Kills: ' + game.killCount, W / 2, H / 2 - 30);
      ctx.fillText('Integrity: ' + Math.round(game.integrity) + '%', W / 2, H / 2 - 10);
    } else {
      ctx.fillStyle = '#ef4444';
      ctx.font = 'bold 26px "Press Start 2P", monospace';
      ctx.textAlign = 'center';
      ctx.fillText('OVERRUN!', W / 2, H / 2 - 70);
      ctx.fillStyle = '#aaa';
      ctx.font = 'bold 9px "Press Start 2P", monospace';
      ctx.fillText('The horde broke through.', W / 2, H / 2 - 30);
      ctx.fillText('You killed: ' + game.killCount + ' zombies', W / 2, H / 2 - 10);
    }

    ctx.fillStyle = '#aaaaaa';
    ctx.font = 'bold 9px "Press Start 2P", monospace';
    ctx.textAlign = 'center';
    ctx.fillText('[R] RESTART   [ESC] MENU', W / 2, H / 2 + 50);
  }

  _roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}
