import { AudioSystem } from './systems/AudioSystem.js';
import { GameScene }   from './scenes/GameScene.js';

const GW = 1280, GH = 720;
const canvas = document.getElementById('gameCanvas');

function resize() {
  const w = document.documentElement.clientWidth;
  const h = document.documentElement.clientHeight;
  const s = Math.min(w / GW, h / GH, 2);
  canvas.width  = GW;
  canvas.height = GH;
  canvas.style.width  = Math.floor(GW * s) + 'px';
  canvas.style.height = Math.floor(GH * s) + 'px';
}
addEventListener('resize', resize);
addEventListener('fullscreenchange', resize);
requestAnimationFrame(resize);

// ── Input ─────────────────────────────────────────────────────────────────────
const input = {
  up: false, down: false, left: false, right: false,
  interact: false, attack: false, attackJustPressed: false,
  fortify: false, fortifyJustPressed: false,
  weaponSwitchJustPressed: false,
  mouseX: 0, mouseY: 0,
};

const KEY_MAP = {
  ArrowUp: 'up',    w: 'up',    W: 'up',
  ArrowDown: 'down', s: 'down', S: 'down',
  ArrowLeft: 'left', a: 'left', A: 'left',
  ArrowRight: 'right', d: 'right', D: 'right',
};

document.addEventListener('keydown', e => {
  const k = KEY_MAP[e.key];
  if (k) { input[k] = true; e.preventDefault(); }
  if (e.key === ' ') { input.interact = true; e.preventDefault(); }
  if (e.key === 'e' || e.key === 'E') {
    input.attack = true;
    input.attackJustPressed = true;
    e.preventDefault();
  }
  if (e.key === 'f' || e.key === 'F') {
    if (!scene || scene.state !== 'playing') toggleFullscreen();
    else { input.fortifyJustPressed = true; }
    e.preventDefault();
  }
  if (e.key === 'q' || e.key === 'Q') { input.weaponSwitchJustPressed = true; e.preventDefault(); }
  if (e.key === 'm' || e.key === 'M') audio && audio.toggleMute();
  if ((e.key === 'r' || e.key === 'R') && scene && scene.state !== 'playing') restartGame();
  if (e.key === 'Escape' && scene && scene.state !== 'playing') showTitle();
});

document.addEventListener('keyup', e => {
  const k = KEY_MAP[e.key];
  if (k) { input[k] = false; }
  if (e.key === ' ') input.interact = false;
  if (e.key === 'e' || e.key === 'E') input.attack = false;
});

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  input.mouseX = (e.clientX - rect.left) * (GW / rect.width);
  input.mouseY = (e.clientY - rect.top)  * (GH / rect.height);
  if (scene && scene.player) scene.player.showCrosshair = true;
});

canvas.addEventListener('mousedown', e => {
  if (e.button === 0) { input.attack = true; input.attackJustPressed = true; }
});
canvas.addEventListener('mouseup', e => {
  if (e.button === 0) input.attack = false;
});

// ── Mobile touch controls ─────────────────────────────────────────────────────
// Left half of screen = anywhere-joystick for movement
// Right half of screen = tap to attack
// Two fixed buttons (bottom-right) = REPAIR + FORTIFY

function createJoystickOverlay() {
  const isTouch = 'ontouchstart' in window
    || navigator.maxTouchPoints > 0
    || (window.matchMedia && window.matchMedia('(pointer:coarse)').matches);
  if (!isTouch) return;

  // ── Left movement zone ────────────────────────────────────────────────────
  const leftZone = document.createElement('div');
  leftZone.style.cssText = [
    'position:fixed', 'left:0', 'top:0', 'width:55%', 'height:100%',
    'z-index:100', 'touch-action:none',
  ].join(';');

  // Joystick ring (appears at touch point)
  const joyRing = document.createElement('div');
  joyRing.style.cssText = [
    'position:absolute', 'width:90px', 'height:90px', 'border-radius:50%',
    'background:rgba(0,0,0,0.4)', 'border:2px solid rgba(61,255,122,0.55)',
    'display:none', 'box-sizing:border-box', 'pointer-events:none',
  ].join(';');
  const knob = document.createElement('div');
  knob.style.cssText = [
    'position:absolute', 'width:34px', 'height:34px', 'border-radius:50%',
    'background:rgba(61,255,122,0.45)', 'border:2px solid #3dff7a',
    'left:50%', 'top:50%', 'transform:translate(-50%,-50%)',
    'pointer-events:none',
  ].join(';');
  joyRing.appendChild(knob);
  leftZone.appendChild(joyRing);
  document.body.appendChild(leftZone);

  let joyTouchId = null, joyBX = 0, joyBY = 0;
  const MAX_R = 38;

  leftZone.addEventListener('touchstart', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (joyTouchId !== null) continue;
      joyTouchId = t.identifier;
      joyBX = t.clientX; joyBY = t.clientY;
      joyRing.style.left = (t.clientX - 45) + 'px';
      joyRing.style.top  = (t.clientY - 45) + 'px';
      joyRing.style.display = 'block';
    }
  }, { passive: false });

  leftZone.addEventListener('touchmove', e => {
    e.preventDefault();
    for (const t of e.changedTouches) {
      if (t.identifier !== joyTouchId) continue;
      const dx = t.clientX - joyBX, dy = t.clientY - joyBY;
      const dist = Math.hypot(dx, dy);
      const nx = dist > 6 ? dx / dist : 0;
      const ny = dist > 6 ? dy / dist : 0;
      input.left  = nx < -0.3; input.right = nx >  0.3;
      input.up    = ny < -0.3; input.down  = ny >  0.3;
      const cr = Math.min(dist, MAX_R);
      knob.style.left = (50 + nx * cr / 90 * 100) + '%';
      knob.style.top  = (50 + ny * cr / 90 * 100) + '%';
    }
  }, { passive: false });

  const endJoy = e => {
    for (const t of e.changedTouches) {
      if (t.identifier !== joyTouchId) continue;
      joyTouchId = null;
      input.left = input.right = input.up = input.down = false;
      joyRing.style.display = 'none';
      knob.style.left = knob.style.top = '50%';
    }
  };
  leftZone.addEventListener('touchend',    endJoy, { passive: false });
  leftZone.addEventListener('touchcancel', endJoy, { passive: false });

  // ── A button (ATTACK / FIRE) ───────────────────────────────────────────────
  const btnA = document.createElement('button');
  btnA.style.cssText = [
    'position:fixed', 'bottom:30px', 'right:104px',
    'width:64px', 'height:64px', 'border-radius:50%',
    'background:rgba(8,16,8,0.92)', 'border:3px solid #ff6b00',
    'color:#ff6b00', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'gap:2px',
    'touch-action:manipulation', 'cursor:pointer', 'z-index:200',
    'transition:border-color 0.15s,color 0.15s',
  ].join(';');
  btnA.innerHTML = '<span style="font-size:20px;line-height:1">⚔</span>'
    + '<span style="font-size:7px;font-family:\'Press Start 2P\',monospace;letter-spacing:0.5px">ATTACK</span>';

  function updateAButton() {
    const isGun = scene && scene.currentWeapon === 'gun';
    const color = isGun ? '#3db4ff' : '#ff6b00';
    btnA.style.borderColor = color;
    btnA.style.color = color;
    btnA.innerHTML = `<span style="font-size:20px;line-height:1">${isGun ? '🔫' : '⚔'}</span>`
      + `<span style="font-size:7px;font-family:'Press Start 2P',monospace;letter-spacing:0.5px">${isGun ? 'FIRE' : 'ATTACK'}</span>`;
  }

  btnA.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation();
    input.attack = true; input.attackJustPressed = true;
    btnA.style.background = 'rgba(255,107,0,0.22)';
  }, { passive: false });
  btnA.addEventListener('touchend', e => {
    e.preventDefault();
    input.attack = false;
    btnA.style.background = 'rgba(8,16,8,0.92)';
  }, { passive: false });
  document.body.appendChild(btnA);

  // ── B button (BUILD / REPAIR) ──────────────────────────────────────────────
  const btnB = document.createElement('button');
  btnB.innerHTML = '<span style="font-size:20px;line-height:1">🔧</span>'
    + '<span style="font-size:7px;font-family:\'Press Start 2P\',monospace;letter-spacing:0.5px">BUILD</span>';
  btnB.style.cssText = [
    'position:fixed', 'bottom:100px', 'right:24px',
    'width:64px', 'height:64px', 'border-radius:50%',
    'background:rgba(8,16,8,0.92)', 'border:3px solid #3dff7a',
    'color:#3dff7a', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'gap:2px',
    'touch-action:manipulation', 'cursor:pointer', 'z-index:200',
  ].join(';');
  btnB.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation();
    // Prefer FORTIFY; fall back to REPAIR (interact)
    input.fortifyJustPressed = true;
    input.interact = true;
    btnB.style.background = 'rgba(61,255,122,0.18)';
  }, { passive: false });
  btnB.addEventListener('touchend', e => {
    e.preventDefault();
    input.interact = false;
    btnB.style.background = 'rgba(8,16,8,0.92)';
  }, { passive: false });
  document.body.appendChild(btnB);

  // ── Weapon switch button ───────────────────────────────────────────────────
  const switchBtn = document.createElement('button');
  switchBtn.innerHTML = '<span style="font-size:18px;line-height:1">🔄</span>'
    + '<span style="font-size:7px;font-family:\'Press Start 2P\',monospace;letter-spacing:0.5px">[Q]SWAP</span>';
  switchBtn.style.cssText = [
    'position:fixed', 'bottom:180px', 'right:10px',
    'width:44px', 'height:44px', 'border-radius:50%',
    'background:rgba(8,16,8,0.92)', 'border:2px solid #3db4ff',
    'color:#3db4ff', 'display:flex', 'flex-direction:column',
    'align-items:center', 'justify-content:center', 'gap:2px',
    'touch-action:manipulation', 'cursor:pointer', 'z-index:200',
  ].join(';');
  switchBtn.addEventListener('touchstart', e => {
    e.preventDefault(); e.stopPropagation();
    input.weaponSwitchJustPressed = true;
    // Delay so scene.currentWeapon reflects the new weapon
    setTimeout(updateAButton, 50);
  }, { passive: false });
  document.body.appendChild(switchBtn);
}

// ── Fullscreen ─────────────────────────────────────────────────────────────────
function toggleFullscreen() {
  if (!document.fullscreenElement) {
    document.documentElement.requestFullscreen().catch(() => {});
  } else {
    document.exitFullscreen().catch(() => {});
  }
}

// ── Active pet (written to localStorage by Next.js page before iframe loads) ───
function getActivePet() {
  try {
    const raw = localStorage.getItem('chq-active-pet');
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

// ── Audio + Scene ──────────────────────────────────────────────────────────────
let audio, scene;

function startGame() {
  if (!audio) audio = new AudioSystem();
  scene = new GameScene(canvas, audio, getActivePet());
  document.getElementById('title-screen').style.display = 'none';
  canvas.style.display = 'block';
  if (!loopRunning) startLoop();
}

function restartGame() {
  scene = new GameScene(canvas, audio, getActivePet());
}

function showTitle() {
  document.getElementById('title-screen').style.display = 'flex';
  canvas.style.display = 'none';
}

window.startGame        = startGame;
window.showTitle        = showTitle;
window.restartGame      = restartGame;
window.toggleFullscreen = toggleFullscreen;

// ── Game loop ──────────────────────────────────────────────────────────────────
let lastTime    = 0;
let loopRunning = false;

function loop(ts) {
  requestAnimationFrame(loop);
  const dt = Math.min((ts - lastTime) / 1000, 0.05);
  lastTime = ts;

  if (!scene) return;
  scene.update(dt, input);
  scene.draw();

  // Clear single-fire flags after passing to scene
  input.attackJustPressed        = false;
  input.fortifyJustPressed       = false;
  input.weaponSwitchJustPressed  = false;
}

function startLoop() {
  loopRunning = true;
  createJoystickOverlay();
  requestAnimationFrame(ts => {
    lastTime = ts;
    loop(ts);
  });
}
