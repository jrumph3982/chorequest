export class LightingSystem {
  constructor(canvas) {
    this.canvas = canvas;
  }

  draw(ctx, camera, player) {
    const W = this.canvas.width, H = this.canvas.height;

    // Convert player world position to screen position
    const sx = (player.pos.x - camera.x) * camera.zoom + W / 2;
    const sy = (player.pos.y - camera.y) * camera.zoom + H / 2;

    // Dark overlay with gradient hole at player
    const darkness = ctx.createRadialGradient(sx, sy, 30, sx, sy, 320);
    darkness.addColorStop(0,   'rgba(0,0,0,0)');
    darkness.addColorStop(0.4, 'rgba(0,0,0,0.08)');
    darkness.addColorStop(0.7, 'rgba(0,0,0,0.38)');
    darkness.addColorStop(1,   'rgba(0,0,0,0.68)');

    ctx.fillStyle = darkness;
    ctx.fillRect(0, 0, W, H);

    // Flashlight cone in player facing direction
    const fx = player.facing ? player.facing.x : 1;
    const fy = player.facing ? player.facing.y : 0;
    const angle = Math.atan2(fy, fx);
    const coneAngle = Math.PI / 2.8;
    const coneLen = 280;

    const coneGrad = ctx.createRadialGradient(sx, sy, 0, sx, sy, coneLen);
    coneGrad.addColorStop(0,   'rgba(255,240,200,0.18)');
    coneGrad.addColorStop(0.6, 'rgba(255,240,200,0.06)');
    coneGrad.addColorStop(1,   'rgba(255,240,200,0)');

    ctx.save();
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.arc(sx, sy, coneLen, angle - coneAngle, angle + coneAngle);
    ctx.closePath();
    ctx.fillStyle = coneGrad;
    ctx.fill();
    ctx.restore();
  }
}
