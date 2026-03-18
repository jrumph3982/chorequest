'use client'

import { useEffect, useRef } from 'react'
import { useAvatar } from '@/lib/context/AvatarContext'
import { SKIN_COLORS, HAIR_COLORS } from '@/lib/constants/avatar-map'

// ═══════════════════════════════════════════════════════════════════
//  CANVAS DIMENSIONS  (always renders at 1920×1080, CSS-scaled down)
// ═══════════════════════════════════════════════════════════════════
const W = 1920
const H = 1080

// ─── Interior geometry ────────────────────────────────────────────
const CEIL_Y    = 195   // interior ceiling line
const FLOOR_Y   = 870   // interior floor line (character feet)
const LX        = 90    // left wall x
const RX        = 1830  // right wall x

// Zombies appear in the exterior visible through windows.
// Their feet sit at this y so they are framed by the window opening.
const ZOM_GND   = 518

// ─── Rooms ────────────────────────────────────────────────────────
interface Room {
  x: number; w: number
  wall: string; floorA: string; floorB: string; trim: string
}
const ROOMS: Room[] = [
  { x: LX,    w: 570, wall: '#ede0c4', floorA: '#c8a464', floorB: '#a07840', trim: '#8a5e20' },
  { x: 704,   w: 568, wall: '#e8d8bc', floorA: '#b88c58', floorB: '#8e6430', trim: '#7a5020' },
  { x: 1316,  w: 514, wall: '#ddd0b0', floorA: '#a87848', floorB: '#805828', trim: '#6a4018' },
]
const DIVIDERS = [{ x: 660, w: 44 }, { x: 1272, w: 44 }]

// ─── Windows: transparent holes showing exterior ─────────────────
interface Win { wx: number; wy: number; ww: number; wh: number }
const WINS: Win[] = [
  { wx: 205,  wy: 300, ww: 208, wh: 255 },   // kitchen
  { wx: 785,  wy: 278, ww: 388, wh: 278 },   // living (wide)
  { wx: 1435, wy: 300, ww: 208, wh: 255 },   // study
]

// ─── Chore spots ─────────────────────────────────────────────────
type ChoreType = 'dishes' | 'counter' | 'sweep' | 'tidy'
interface Spot { x: number; type: ChoreType; dur: number; dir: -1 | 1 }
const SPOTS: Spot[] = [
  { x: 330,  type: 'dishes',  dur: 3.2, dir:  1 },
  { x: 510,  type: 'counter', dur: 2.8, dir:  1 },
  { x: 950,  type: 'sweep',   dur: 3.5, dir:  1 },
  { x: 1090, type: 'tidy',    dur: 3.0, dir: -1 },
  { x: 1565, type: 'sweep',   dur: 3.0, dir:  1 },
  { x: 1090, type: 'counter', dur: 2.6, dir:  1 },
  { x: 510,  type: 'dishes',  dur: 3.0, dir: -1 },
]

const WALK_SPEED   = 155   // px / sec at mid-walk
const THREAT_NZOM: Record<string, number> = {
  none: 0, low: 1, moderate: 2, high: 3, critical: 5,
}

// ═══════════════════════════════════════════════════════════════════
//  HELPERS
// ═══════════════════════════════════════════════════════════════════
function eio(t: number) { return t * t * (3 - 2 * t) }  // ease-in-out
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ═══════════════════════════════════════════════════════════════════
//  STATE TYPES
// ═══════════════════════════════════════════════════════════════════
interface Char {
  x: number; dir: -1 | 1; phase: 'walk' | 'chore'
  walkFrom: number; walkTo: number; walkT: number; walkDur: number
  spotIdx: number; choreType: ChoreType; choreT: number; choreDur: number
}
interface Zombie {
  x: number; vx: number; idx: number
  phase: 'wander' | 'scratch'; timer: number; scratchX: number
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — EXTERIOR (sky, ground, dead trees)
// ═══════════════════════════════════════════════════════════════════
function drawExterior(ctx: CanvasRenderingContext2D) {
  const sky = ctx.createLinearGradient(0, 0, 0, H)
  sky.addColorStop(0,    '#08041a')
  sky.addColorStop(0.35, '#130828')
  sky.addColorStop(0.7,  '#1e0f38')
  sky.addColorStop(1,    '#0a0e08')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Moon
  ctx.save()
  ctx.shadowColor = '#f0e8c0'
  ctx.shadowBlur  = 50
  ctx.fillStyle   = '#f5edcc'
  ctx.beginPath(); ctx.arc(1660, 88, 54, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  ctx.beginPath(); ctx.arc(1670, 76, 13, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(1644, 102, 9,  0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(1676, 108, 6,  0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.75)'
  const stars = [
    [130,42],[340,28],[590,60],[840,18],[1060,52],[1310,32],[1550,48],
    [210,88],[470,78],[720,96],[970,72],[1180,92],[1450,58],[1780,38],[1890,92],
    [60,110],[420,115],[680,102],[900,120],[1130,98],[1380,116],[1700,105],
  ]
  for (const [sx, sy] of stars) {
    ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, Math.PI * 2); ctx.fill()
  }

  // Ground plane (exterior, below windows)
  const gnd = ctx.createLinearGradient(0, 500, 0, H)
  gnd.addColorStop(0, '#0c180a')
  gnd.addColorStop(0.3, '#081008')
  gnd.addColorStop(1,   '#040804')
  ctx.fillStyle = gnd
  ctx.fillRect(0, 500, W, H - 500)
}

function drawDeadTrees(ctx: CanvasRenderingContext2D, t: number) {
  const trees = [
    { x: 52,   h: 290, lean:  0.05, thick: 13 },
    { x: 1878, h: 255, lean: -0.04, thick: 12 },
    { x: 630,  h: 195, lean:  0.03, thick: 9  },
    { x: 1305, h: 210, lean: -0.06, thick: 10 },
    { x: 1875, h: 180, lean:  0.02, thick: 8  },
  ]
  for (const tr of trees) {
    const sway = Math.sin(t * 0.38 + tr.lean * 60) * 3.5
    ctx.save()
    ctx.translate(tr.x + sway * 0.4, ZOM_GND + 2)
    ctx.strokeStyle = '#130e06'
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.lineWidth = tr.thick
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(tr.lean * tr.h + sway, -tr.h)
    ctx.stroke()
    // branches
    ctx.lineWidth = Math.max(4, tr.thick * 0.4)
    const tip = { x: tr.lean * tr.h + sway, y: -tr.h }
    const branchPts = [0.28, 0.52, 0.74]
    for (const frac of branchPts) {
      const bx = lerp(0, tip.x, frac)
      const by = lerp(0, tip.y, frac)
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 45 + sway * 0.6, by - 55); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 38 + sway * 0.4, by - 48); ctx.stroke()
    }
    ctx.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — ZOMBIES
// ═══════════════════════════════════════════════════════════════════
const Z_SKINS   = ['#7aaa72','#8aba78','#9aaa68','#6a9a6c','#88aa80']
const Z_CLOTHES = ['#2a382a','#383028','#283040','#302828','#283830']

function drawZombie(ctx: CanvasRenderingContext2D, z: Zombie, t: number) {
  const skin  = Z_SKINS[z.idx % Z_SKINS.length]
  const cloth = Z_CLOTHES[z.idx % Z_CLOTHES.length]
  const sc    = 0.88 + (z.idx % 3) * 0.10

  ctx.save()
  ctx.translate(z.x, ZOM_GND)
  ctx.scale(sc, sc)

  // shadow
  ctx.beginPath()
  ctx.ellipse(0, 6, 24, 6, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'
  ctx.fill()

  // legs
  const legSwing = z.phase === 'wander' ? Math.sin(t * 1.9) * 0.22 : 0
  ctx.strokeStyle = cloth
  ctx.lineWidth   = 15
  ctx.lineCap     = 'round'
  ctx.save(); ctx.translate(-9, -4); ctx.rotate(legSwing)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, 58); ctx.stroke(); ctx.restore()
  ctx.save(); ctx.translate(9, -4); ctx.rotate(-legSwing)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 58); ctx.stroke(); ctx.restore()

  // body
  ctx.fillStyle = cloth
  ctx.beginPath(); ctx.roundRect(-22, -85, 44, 84, 9); ctx.fill()

  // head
  ctx.fillStyle = skin
  ctx.beginPath(); ctx.arc(0, -100, 22, 0, Math.PI * 2); ctx.fill()

  // dark circles under eyes
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.beginPath(); ctx.ellipse(-8, -103, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse( 8, -103, 7, 4,  0.3, 0, Math.PI * 2); ctx.fill()
  // eyes
  ctx.fillStyle = '#cc2020'
  ctx.beginPath(); ctx.arc(-8, -104, 4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 8, -104, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ff7070'
  ctx.beginPath(); ctx.arc(-7, -105.5, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 9, -105.5, 1.5, 0, Math.PI * 2); ctx.fill()

  // mouth
  ctx.strokeStyle = '#401010'
  ctx.lineWidth = 2
  ctx.beginPath(); ctx.arc(0, -93, 9, 0.3, Math.PI - 0.3); ctx.stroke()

  // arms
  ctx.strokeStyle = skin
  ctx.lineWidth   = 12
  ctx.lineCap     = 'round'
  if (z.phase === 'scratch') {
    const scratchCycle = Math.sin(t * 7) * 0.5
    // raised arm scratching at window (to the right)
    ctx.save(); ctx.translate(22, -68); ctx.rotate(-0.8 + scratchCycle)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(58, -22); ctx.stroke()
    // scratch marks on glass (drawn as light streaks)
    ctx.strokeStyle = 'rgba(255,255,255,0.12)'
    ctx.lineWidth = 2
    for (let si = 0; si < 4; si++) {
      ctx.beginPath()
      ctx.moveTo(58 + si * 7, -22 - 12)
      ctx.lineTo(62 + si * 7, -22 + 18)
      ctx.stroke()
    }
    // idle other arm
    ctx.strokeStyle = skin; ctx.lineWidth = 12
    ctx.restore()
    ctx.save(); ctx.translate(-22, -68); ctx.rotate(0.6)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-35, -8); ctx.stroke()
    ctx.restore()
  } else {
    const armBob = Math.sin(t * 1.9 + 1.1) * 0.18
    ctx.save(); ctx.translate(-22, -68); ctx.rotate(-0.55 + armBob)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-48, -18); ctx.stroke()
    ctx.restore()
    ctx.save(); ctx.translate(22, -68); ctx.rotate(0.55 - armBob)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(48, -18); ctx.stroke()
    ctx.restore()
  }

  // clothing detail
  ctx.strokeStyle = 'rgba(0,0,0,0.15)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(-20, -45); ctx.lineTo(-16, -22); ctx.stroke()
  ctx.beginPath(); ctx.moveTo( 14, -55); ctx.lineTo( 10, -32); ctx.stroke()

  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — ROOM INTERIORS  (walls punched around windows, floors)
// ═══════════════════════════════════════════════════════════════════
function drawRooms(ctx: CanvasRenderingContext2D) {
  for (let ri = 0; ri < ROOMS.length; ri++) {
    const r = ROOMS[ri]
    const w = WINS[ri]
    const winBot = w.wy + w.wh
    const winRight = w.wx + w.ww

    // Wall — 4 sections around window hole
    ctx.fillStyle = r.wall
    ctx.fillRect(r.x, CEIL_Y,   r.w, w.wy - CEIL_Y)           // above window
    ctx.fillRect(r.x, winBot,   r.w, FLOOR_Y - winBot)        // below window (wall)
    ctx.fillRect(r.x, w.wy,     w.wx - r.x, w.wh)             // left of window
    ctx.fillRect(winRight, w.wy, r.x + r.w - winRight, w.wh)  // right of window

    // Subtle wall texture lines
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    for (let wy = CEIL_Y + 40; wy < FLOOR_Y; wy += 40) {
      ctx.beginPath(); ctx.moveTo(r.x, wy); ctx.lineTo(r.x + r.w, wy); ctx.stroke()
    }

    // Floor with perspective gradient
    const floorGrad = ctx.createLinearGradient(0, FLOOR_Y, 0, H)
    floorGrad.addColorStop(0,   r.floorA)
    floorGrad.addColorStop(0.4, r.floorB)
    floorGrad.addColorStop(1,   '#2c1808')
    ctx.fillStyle = floorGrad
    ctx.fillRect(r.x, FLOOR_Y, r.w, H - FLOOR_Y)

    // Floor planks
    ctx.strokeStyle = 'rgba(0,0,0,0.07)'
    ctx.lineWidth = 1.5
    for (let px = r.x; px < r.x + r.w; px += 88) {
      ctx.beginPath(); ctx.moveTo(px, FLOOR_Y); ctx.lineTo(px, H); ctx.stroke()
    }
    // Plank cross lines (every 300px of plank length)
    ctx.strokeStyle = 'rgba(0,0,0,0.04)'
    ctx.lineWidth = 1
    for (let px = r.x; px < r.x + r.w; px += 88) {
      for (let py = FLOOR_Y; py < H; py += 300) {
        ctx.beginPath(); ctx.moveTo(px, py); ctx.lineTo(px + 88, py); ctx.stroke()
      }
    }

    // Baseboard trim
    ctx.fillStyle = r.trim
    ctx.fillRect(r.x, FLOOR_Y, r.w, 12)

    // Crown molding at ceiling
    ctx.fillStyle = '#f0ebe0'
    ctx.fillRect(r.x, CEIL_Y, r.w, 9)
    ctx.fillStyle = 'rgba(0,0,0,0.08)'
    ctx.fillRect(r.x, CEIL_Y + 9, r.w, 5)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — WINDOWS  (glass + frame, drawn over exterior)
// ═══════════════════════════════════════════════════════════════════
function drawWindows(ctx: CanvasRenderingContext2D, t: number) {
  for (const w of WINS) {
    const { wx, wy, ww, wh } = w

    // Glass tint
    const glass = ctx.createLinearGradient(wx, wy, wx + ww, wy + wh)
    glass.addColorStop(0,   'rgba(140,165,230,0.15)')
    glass.addColorStop(0.5, 'rgba(180,200,255,0.07)')
    glass.addColorStop(1,   'rgba(100,120,200,0.12)')
    ctx.fillStyle = glass
    ctx.fillRect(wx, wy, ww, wh)

    // Condensation / reflection diagonal streaks
    ctx.save()
    ctx.beginPath(); ctx.rect(wx, wy, ww, wh)
    ctx.clip()
    ctx.fillStyle = 'rgba(255,255,255,0.055)'
    ctx.beginPath()
    ctx.moveTo(wx + ww * 0.08, wy)
    ctx.lineTo(wx + ww * 0.28, wy)
    ctx.lineTo(wx + ww * 0.08, wy + wh)
    ctx.closePath()
    ctx.fill()
    // Subtle sine-wave moisture on glass
    ctx.strokeStyle = `rgba(200,220,255,${0.04 + 0.02 * Math.sin(t * 0.4)})`
    ctx.lineWidth = 1
    for (let gy = wy + 30; gy < wy + wh; gy += 40) {
      ctx.beginPath()
      for (let gx = wx; gx <= wx + ww; gx += 6) {
        const offset = Math.sin((gx - wx) * 0.08 + t * 0.5) * 2
        if (gx === wx) ctx.moveTo(gx, gy + offset)
        else ctx.lineTo(gx, gy + offset)
      }
      ctx.stroke()
    }
    ctx.restore()

    // Window frame (thick wooden border)
    ctx.strokeStyle = '#5a3a10'
    ctx.lineWidth = 11
    ctx.strokeRect(wx, wy, ww, wh)

    // Cross bars (pane dividers)
    ctx.strokeStyle = '#6a4820'
    ctx.lineWidth = 7
    ctx.beginPath(); ctx.moveTo(wx, wy + wh / 2); ctx.lineTo(wx + ww, wy + wh / 2); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy + wh); ctx.stroke()

    // Window sill (ledge at bottom)
    ctx.fillStyle = '#8a5a28'
    ctx.beginPath(); ctx.roundRect(wx - 10, wy + wh, ww + 20, 18, 4); ctx.fill()
    ctx.fillStyle = 'rgba(0,0,0,0.18)'
    ctx.fillRect(wx - 10, wy + wh + 14, ww + 20, 4)
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — FURNITURE
// ═══════════════════════════════════════════════════════════════════
function drawKitchen(ctx: CanvasRenderingContext2D) {
  const rx = ROOMS[0].x

  // Upper cabinets
  ctx.fillStyle = '#7a5820'
  ctx.beginPath(); ctx.roundRect(rx + 80, CEIL_Y + 28, 290, 118, 6); ctx.fill()
  ctx.strokeStyle = '#5a3c10'; ctx.lineWidth = 2
  ctx.strokeRect(rx + 80, CEIL_Y + 28, 290, 118)
  // Cabinet door panels
  ctx.strokeRect(rx + 90,  CEIL_Y + 38, 125, 98)
  ctx.strokeRect(rx + 235, CEIL_Y + 38, 125, 98)
  // Handles
  ctx.fillStyle = '#c0a050'
  ctx.beginPath(); ctx.roundRect(rx + 150, CEIL_Y + 85, 5, 24, 2); ctx.fill()
  ctx.beginPath(); ctx.roundRect(rx + 295, CEIL_Y + 85, 5, 24, 2); ctx.fill()

  // Lower cabinet / counter
  const ctrTop = FLOOR_Y - 116
  ctx.fillStyle = '#8a5e1a'
  ctx.beginPath(); ctx.roundRect(rx + 55, ctrTop + 14, 510, FLOOR_Y - ctrTop - 14, 0); ctx.fill()
  // Counter top
  ctx.fillStyle = '#d4b258'
  ctx.beginPath(); ctx.roundRect(rx + 50, ctrTop, 518, 16, 4); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.fillRect(rx + 50, ctrTop + 16, 518, 7)

  // Sink basin
  ctx.fillStyle = '#aabccc'
  ctx.beginPath(); ctx.roundRect(rx + 145, ctrTop - 28, 144, 44, 9); ctx.fill()
  ctx.fillStyle = '#8898a8'
  ctx.beginPath(); ctx.roundRect(rx + 160, ctrTop - 20, 114, 32, 7); ctx.fill()
  // Drain
  ctx.fillStyle = '#6a7888'
  ctx.beginPath(); ctx.arc(rx + 217, ctrTop - 4, 8, 0, Math.PI * 2); ctx.fill()
  // Faucet
  ctx.strokeStyle = '#909aaa'; ctx.lineWidth = 9; ctx.lineCap = 'round'
  ctx.beginPath()
  ctx.moveTo(rx + 216, ctrTop - 28); ctx.lineTo(rx + 216, ctrTop - 72)
  ctx.lineTo(rx + 248, ctrTop - 72); ctx.stroke()

  // Dish stack
  const dishCols = ['#e8d0c0', '#c8e0d8', '#e0c8d8']
  for (let di = 0; di < 3; di++) {
    ctx.fillStyle = dishCols[di]
    ctx.beginPath()
    ctx.ellipse(rx + 308 + di * 5, ctrTop - 18 - di * 14, 33, 9, 0, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1.5; ctx.stroke()
  }

  // Stove / oven knobs
  ctx.fillStyle = '#303030'
  ctx.beginPath(); ctx.roundRect(rx + 405, ctrTop - 10, 110, 24, 5); ctx.fill()
  ctx.strokeStyle = '#505050'; ctx.lineWidth = 3
  for (const bx of [rx + 428, rx + 480]) {
    ctx.beginPath(); ctx.arc(bx, ctrTop + 1, 11, 0, Math.PI * 2); ctx.stroke()
    ctx.beginPath(); ctx.arc(bx, ctrTop + 1, 5,  0, Math.PI * 2); ctx.stroke()
  }

  // Pot on stove
  ctx.fillStyle = '#1a1a1a'
  ctx.beginPath(); ctx.roundRect(rx + 435, ctrTop - 38, 52, 30, 6); ctx.fill()
  ctx.fillStyle = '#252525'
  ctx.fillRect(rx + 435, ctrTop - 18, 52, 8)
  // Steam wisps (animated)
  ctx.strokeStyle = 'rgba(220,220,220,0.3)'; ctx.lineWidth = 2
  ctx.lineCap = 'round'
}

function drawLiving(ctx: CanvasRenderingContext2D) {
  const rx = ROOMS[1].x

  // Sofa — back
  ctx.fillStyle = '#3a5072'
  ctx.beginPath(); ctx.roundRect(rx + 55, FLOOR_Y - 195, 330, 88, 12); ctx.fill()
  // Sofa — seat base
  ctx.fillStyle = '#4a6082'
  ctx.beginPath(); ctx.roundRect(rx + 55, FLOOR_Y - 110, 330, 98, 12); ctx.fill()
  // Cushions
  ctx.fillStyle = '#5a7095'
  const cushW = 97
  for (let ci = 0; ci < 3; ci++) {
    ctx.beginPath()
    ctx.roundRect(rx + 68 + ci * (cushW + 8), FLOOR_Y - 104, cushW, 82, 9)
    ctx.fill()
    // cushion highlight
    ctx.fillStyle = 'rgba(255,255,255,0.06)'
    ctx.beginPath(); ctx.roundRect(rx + 74 + ci * (cushW + 8), FLOOR_Y - 98, cushW - 12, 20, 5); ctx.fill()
    ctx.fillStyle = '#5a7095'
  }
  // Armrests
  ctx.fillStyle = '#3a5070'
  ctx.beginPath(); ctx.roundRect(rx + 35, FLOOR_Y - 118, 24, 108, 9); ctx.fill()
  ctx.beginPath(); ctx.roundRect(rx + 381, FLOOR_Y - 118, 24, 108, 9); ctx.fill()
  // Legs
  ctx.fillStyle = '#2a1808'
  ;[[rx + 70, FLOOR_Y - 12], [rx + 348, FLOOR_Y - 12]].forEach(([lx, ly]) => {
    ctx.beginPath(); ctx.roundRect(lx, ly, 14, 14, 3); ctx.fill()
  })

  // Throw pillow on sofa
  ctx.fillStyle = '#c84848'
  ctx.beginPath(); ctx.roundRect(rx + 72, FLOOR_Y - 100, 55, 50, 8); ctx.fill()
  ctx.strokeStyle = 'rgba(255,255,255,0.12)'; ctx.lineWidth = 1.5
  ctx.strokeRect(rx + 72, FLOOR_Y - 100, 55, 50)

  // Coffee table
  const tX = rx + 130, tY = FLOOR_Y - 42
  ctx.fillStyle = '#5a3810'
  ctx.beginPath(); ctx.roundRect(tX, tY, 215, 15, 5); ctx.fill()
  // Table legs
  ctx.fillStyle = '#3a2008'
  ctx.fillRect(tX + 18, tY + 15, 14, 28)
  ctx.fillRect(tX + 183, tY + 15, 14, 28)
  // Book on table
  ctx.fillStyle = '#c84040'
  ctx.beginPath(); ctx.roundRect(tX + 68, tY - 18, 64, 14, 3); ctx.fill()
  ctx.fillStyle = '#e05050'; ctx.fillRect(tX + 68, tY - 18, 9, 14)
  // Coaster + mug
  ctx.fillStyle = '#4a3010'
  ctx.beginPath(); ctx.ellipse(tX + 170, tY - 5, 14, 5, 0, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#c8a858'
  ctx.beginPath(); ctx.roundRect(tX + 160, tY - 25, 20, 21, 5); ctx.fill()

  // Bookshelf (right wall)
  const sX = rx + 450, sY = CEIL_Y + 38
  const sH  = FLOOR_Y - sY - 12
  ctx.fillStyle = '#4a2e08'
  ctx.beginPath(); ctx.roundRect(sX, sY, 105, sH, 5); ctx.fill()
  ctx.fillStyle = '#3a2008'; ctx.fillRect(sX, sY, 105, 8)
  const bkCols = ['#c84040','#4060b8','#40a858','#c0a030','#904898','#38a0a0','#c86030']
  let bkI = 0
  for (let row = 0; row < 5; row++) {
    const sy2 = sY + 14 + row * (sH / 5.3)
    ctx.fillStyle = '#3a2008'
    ctx.fillRect(sX + 6, sy2 + 52, 93, 5)
    let bx2 = sX + 10
    while (bx2 < sX + 98) {
      const bw2 = 10 + (bkI * 7) % 13
      ctx.fillStyle = bkCols[bkI % bkCols.length]
      ctx.beginPath(); ctx.roundRect(bx2, sy2, bw2, 50, 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(bx2, sy2, 3, 50)
      bx2 += bw2 + 2; bkI++
    }
  }

  // Floor rug
  ctx.fillStyle = 'rgba(80,50,120,0.2)'
  ctx.beginPath(); ctx.ellipse(rx + 270, FLOOR_Y + 30, 200, 45, 0, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = 'rgba(120,80,180,0.2)'; ctx.lineWidth = 4
  ctx.stroke()
}

function drawStudy(ctx: CanvasRenderingContext2D) {
  const rx = ROOMS[2].x

  // Desk surface
  const dY = FLOOR_Y - 108
  ctx.fillStyle = '#6a4818'
  ctx.beginPath(); ctx.roundRect(rx + 55, dY, 310, 16, 5); ctx.fill()
  ctx.fillStyle = '#8a6028'
  ctx.fillRect(rx + 55, dY, 310, 6)
  // Desk legs
  ctx.fillStyle = '#4a2c08'
  ctx.fillRect(rx + 68,  dY + 16, 14, 94)
  ctx.fillRect(rx + 351, dY + 16, 14, 94)

  // Plant pot
  ctx.fillStyle = '#804020'
  ctx.beginPath(); ctx.roundRect(rx + 318, dY - 18, 28, 20, 5); ctx.fill()
  ctx.fillStyle = '#246030'
  ctx.beginPath(); ctx.arc(rx + 332, dY - 30, 20, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#1a4822'
  ctx.beginPath(); ctx.arc(rx + 322, dY - 38, 11, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(rx + 340, dY - 36, 9,  0, Math.PI * 2); ctx.fill()

  // Papers + pencil cup
  ctx.fillStyle = '#f0e8d8'
  ctx.beginPath(); ctx.roundRect(rx + 100, dY - 14, 90, 12, 2); ctx.fill()
  ctx.fillStyle = '#f8f2e4'
  ctx.beginPath(); ctx.roundRect(rx + 98, dY - 19, 90, 12, 2); ctx.fill()
  ctx.fillStyle = '#d0c8b0'
  ctx.strokeStyle = 'rgba(0,0,0,0.08)'; ctx.lineWidth = 1
  for (let li = 0; li < 5; li++) {
    ctx.beginPath(); ctx.moveTo(rx + 106, dY - 16 + li * 2); ctx.lineTo(rx + 180, dY - 16 + li * 2); ctx.stroke()
  }
  ctx.fillStyle = '#8a5018'
  ctx.beginPath(); ctx.roundRect(rx + 200, dY - 20, 22, 22, 4); ctx.fill()

  // Chair
  ctx.fillStyle = '#3a2808'
  ctx.beginPath(); ctx.roundRect(rx + 118, FLOOR_Y - 130, 88, 8, 4); ctx.fill()
  ctx.fillStyle = '#4a3810'
  ctx.beginPath(); ctx.roundRect(rx + 118, FLOOR_Y - 175, 88, 50, 9); ctx.fill()
  ctx.fillStyle = '#3a2808'
  ctx.fillRect(rx + 155, FLOOR_Y - 130, 14, 34)

  // Bookshelf (left of study)
  const sX = rx + 390, sY = CEIL_Y + 40
  const sH = FLOOR_Y - sY - 14
  ctx.fillStyle = '#4a2e08'
  ctx.beginPath(); ctx.roundRect(sX, sY, 92, sH, 5); ctx.fill()
  const sBkC = ['#c04040','#4050b8','#40904a','#b09030','#904898']
  let sBI = 0
  for (let row = 0; row < 4; row++) {
    const sy2 = sY + 12 + row * (sH / 4.3)
    ctx.fillStyle = '#3a2008'; ctx.fillRect(sX + 4, sy2 + 48, 84, 5)
    let bx2 = sX + 8
    while (bx2 < sX + 88) {
      const bw2 = 11 + (sBI * 9) % 11
      ctx.fillStyle = sBkC[sBI % sBkC.length]
      ctx.beginPath(); ctx.roundRect(bx2, sy2, bw2, 46, 2); ctx.fill()
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; ctx.fillRect(bx2, sy2, 3, 46)
      bx2 += bw2 + 2; sBI++
    }
  }

  // Wall clock
  const clkX = rx + 250, clkY = CEIL_Y + 95
  ctx.fillStyle = '#f0e8d0'
  ctx.beginPath(); ctx.arc(clkX, clkY, 38, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#8a6028'; ctx.lineWidth = 5; ctx.stroke()
  ctx.fillStyle = '#8a6028'; ctx.beginPath(); ctx.arc(clkX, clkY, 4, 0, Math.PI * 2); ctx.fill()
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — ROOM DIVIDERS + CEILING
// ═══════════════════════════════════════════════════════════════════
function drawDividers(ctx: CanvasRenderingContext2D) {
  for (const d of DIVIDERS) {
    // Door opening: bottom 160px of divider is open
    const doorTop = FLOOR_Y - 160
    ctx.fillStyle = '#b8a078'
    ctx.fillRect(d.x, CEIL_Y, d.w, doorTop - CEIL_Y)
    // Door frame at opening
    ctx.strokeStyle = '#8a6830'; ctx.lineWidth = 5
    ctx.strokeRect(d.x, doorTop, d.w, 160)
    // Divider side shadow
    const shad = ctx.createLinearGradient(d.x, 0, d.x + d.w + 30, 0)
    shad.addColorStop(0,   'rgba(0,0,0,0.28)')
    shad.addColorStop(0.6, 'rgba(0,0,0,0.04)')
    shad.addColorStop(1,   'rgba(0,0,0,0)')
    ctx.fillStyle = shad
    ctx.fillRect(d.x, CEIL_Y, d.w + 30, FLOOR_Y - CEIL_Y)
  }
}

function drawCeiling(ctx: CanvasRenderingContext2D) {
  const cg = ctx.createLinearGradient(0, 0, 0, CEIL_Y)
  cg.addColorStop(0, '#0c0804')
  cg.addColorStop(1, '#1c1208')
  ctx.fillStyle = cg
  ctx.fillRect(LX, 0, RX - LX, CEIL_Y)

  ctx.fillStyle = '#201408'
  ctx.fillRect(LX, CEIL_Y - 14, RX - LX, 14)

  // Ceiling light fixtures
  const lights = [365, 988, 1573]
  for (const lx of lights) {
    ctx.fillStyle = '#3a2808'
    ctx.beginPath(); ctx.roundRect(lx - 28, CEIL_Y - 12, 56, 12, 4); ctx.fill()
    ctx.fillStyle = 'rgba(255,245,200,0.12)'
    ctx.beginPath(); ctx.roundRect(lx - 24, CEIL_Y - 10, 48, 9, 3); ctx.fill()
    // Light cone
    const lc = ctx.createRadialGradient(lx, CEIL_Y, 0, lx, CEIL_Y, 200)
    lc.addColorStop(0,   'rgba(255,240,190,0.07)')
    lc.addColorStop(0.6, 'rgba(255,240,190,0.02)')
    lc.addColorStop(1,   'rgba(255,240,190,0)')
    ctx.fillStyle = lc
    ctx.beginPath()
    ctx.moveTo(lx - 6, CEIL_Y)
    ctx.lineTo(lx - 150, FLOOR_Y + 80)
    ctx.lineTo(lx + 150, FLOOR_Y + 80)
    ctx.lineTo(lx + 6, CEIL_Y)
    ctx.closePath(); ctx.fill()
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — CHARACTER
// ═══════════════════════════════════════════════════════════════════
interface AvatarColors { skin: string; hair: string; hairStyle: string; jacket: string; pants: string; gender: string }

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number,
  dir: -1 | 1,
  phase: 'walk' | 'chore',
  choreType: ChoreType,
  t: number,
  time: number,
  av: AvatarColors
) {
  ctx.save()
  ctx.translate(x, FLOOR_Y)
  ctx.scale(dir, 1)

  const walking = phase === 'walk'
  const headBob = walking ? Math.sin(time * 6.5) * 3.5 : 0

  // Ground shadow
  ctx.beginPath()
  ctx.ellipse(0, 4, 26, 7, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.fill()

  // Legs
  const legSwing = walking ? Math.sin(time * 6.5) * 0.38 : 0

  drawLeg(ctx, -9,  legSwing,  av.pants, '#1a1010', walking)
  drawLeg(ctx,  9, -legSwing,  av.pants, '#1a1010', walking)

  // Body
  const bodyY = -90 + (walking ? -Math.abs(Math.sin(time * 6.5)) * 3 : 0)
  ctx.fillStyle = av.jacket
  ctx.beginPath(); ctx.roundRect(-22, bodyY, 44, 58, 11); ctx.fill()
  // Shirt pocket
  ctx.fillStyle = 'rgba(0,0,0,0.12)'
  ctx.beginPath(); ctx.roundRect(4, bodyY + 12, 16, 13, 3); ctx.fill()
  // Button line
  ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(-22, bodyY + 10); ctx.lineTo(-22, bodyY + 52); ctx.stroke()

  // Arms (chore-specific or walking)
  drawArms(ctx, choreType, walking, t, time, bodyY, av.skin)

  // Head (at top of body with bob)
  ctx.save()
  ctx.translate(0, bodyY - 4 + headBob * 0.4)

  ctx.fillStyle = av.skin
  ctx.beginPath(); ctx.arc(0, -22, 26, 0, Math.PI * 2); ctx.fill()

  // Hair — style-aware
  const hs = (av.hairStyle ?? '').toLowerCase()
  if (hs !== 'bald') {
    ctx.fillStyle = av.hair
    if (hs === 'spike') {
      ctx.beginPath(); ctx.ellipse(0, -38, 26, 12, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -26, 26, Math.PI, 2 * Math.PI); ctx.fill()
      ctx.beginPath()
      ctx.moveTo(-18, -44); ctx.lineTo(-22, -58); ctx.lineTo(-12, -46)
      ctx.moveTo(-6,  -46); ctx.lineTo(-8,  -62); ctx.lineTo( 2,  -48)
      ctx.moveTo( 8,  -46); ctx.lineTo( 8,  -62); ctx.lineTo(16,  -48)
      ctx.moveTo(18, -44);  ctx.lineTo(22,  -58); ctx.lineTo(26,  -46)
      ctx.fill()
    } else if (hs === 'curly') {
      for (let cx2 = -18; cx2 <= 18; cx2 += 12) {
        ctx.beginPath(); ctx.arc(cx2, -44 + (Math.abs(cx2) > 10 ? 4 : 0), 10, 0, Math.PI * 2); ctx.fill()
      }
      ctx.beginPath(); ctx.ellipse(0, -36, 26, 14, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -26, 26, Math.PI, 2 * Math.PI); ctx.fill()
      ctx.beginPath(); ctx.arc(-26, -34, 9, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc( 26, -34, 9, 0, Math.PI * 2); ctx.fill()
    } else if (hs === 'long') {
      ctx.beginPath(); ctx.ellipse(0, -38, 26, 14, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -26, 26, Math.PI, 2 * Math.PI); ctx.fill()
      ctx.beginPath(); ctx.roundRect(-30, -38, 10, 48, 5); ctx.fill()
      ctx.beginPath(); ctx.roundRect( 20, -38, 10, 48, 5); ctx.fill()
    } else if (hs === 'ponytail') {
      ctx.beginPath(); ctx.ellipse(0, -38, 26, 14, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -26, 26, Math.PI, 2 * Math.PI); ctx.fill()
      ctx.beginPath(); ctx.roundRect(-28, -36, 8, 28, 4); ctx.fill()
      ctx.beginPath(); ctx.roundRect( 20, -36, 8, 28, 4); ctx.fill()
      ctx.beginPath(); ctx.ellipse(0, -52, 5, 14, 0, 0, Math.PI * 2); ctx.fill()
    } else {
      ctx.beginPath(); ctx.ellipse(0, -40, 26, 15, 0, 0, Math.PI * 2); ctx.fill()
      ctx.beginPath(); ctx.arc(0, -26, 26, Math.PI, 2 * Math.PI); ctx.fill()
    }
  }

  // Girl: cheek blush
  if (av.gender === 'girl') {
    ctx.fillStyle = 'rgba(255,140,160,0.3)'
    ctx.beginPath(); ctx.ellipse(-14, -18, 8, 5, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath(); ctx.ellipse( 14, -18, 8, 5, 0, 0, Math.PI * 2); ctx.fill()
  }

  // Eyes (wide, friendly)
  ctx.fillStyle = '#1e1408'
  ctx.beginPath(); ctx.arc(-9, -24, 4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 9, -24, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath(); ctx.arc(-7.5, -25.5, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(10.5, -25.5, 1.5, 0, Math.PI * 2); ctx.fill()

  // Nose (tiny)
  ctx.fillStyle = 'rgba(180,100,60,0.4)'
  ctx.beginPath(); ctx.arc(0, -18, 3, 0, Math.PI * 2); ctx.fill()

  // Smile
  ctx.strokeStyle = '#8a3e18'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(0, -14, 9, 0.15, Math.PI - 0.15); ctx.stroke()

  ctx.restore()
  ctx.restore()
}

function drawLeg(
  ctx: CanvasRenderingContext2D,
  ox: number, angle: number,
  col: string, shoeCol: string,
  walking: boolean
) {
  ctx.save()
  ctx.translate(ox, -48)
  ctx.rotate(angle)
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.stroke()
  // Shoe
  ctx.fillStyle = shoeCol
  ctx.beginPath()
  ctx.ellipse(walking ? ox * 0.4 : 0, 50, 14, 7, angle * 0.2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawArms(
  ctx: CanvasRenderingContext2D,
  choreType: ChoreType,
  walking: boolean,
  t: number,
  time: number,
  bodyY: number,
  skinColor: string
) {
  ctx.strokeStyle = skinColor; ctx.lineWidth = 12; ctx.lineCap = 'round'
  const ay = bodyY + 10   // arm attach y

  if (walking) {
    const sw = Math.sin(time * 6.5) * 0.42
    ctx.save(); ctx.translate(-22, ay); ctx.rotate(sw)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 32); ctx.stroke(); ctx.restore()
    ctx.save(); ctx.translate(22, ay); ctx.rotate(-sw)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 32); ctx.stroke(); ctx.restore()
    return
  }

  switch (choreType) {
    case 'dishes': {
      // Both arms raised into sink, slight scrubbing oscillation
      const scrub = Math.sin(time * 5) * 0.25
      ctx.save(); ctx.translate(-22, ay); ctx.rotate(-0.7 + scrub)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, -32); ctx.stroke(); ctx.restore()
      ctx.save(); ctx.translate(22, ay); ctx.rotate(0.6 - scrub)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -32); ctx.stroke(); ctx.restore()
      // Water splash bubbles
      ctx.save()
      ctx.fillStyle = 'rgba(190,220,255,0.55)'
      for (let bi = 0; bi < 5; bi++) {
        const blife = ((time * 1.2 + bi * 0.4) % 1)
        const bx = -18 + bi * 8 + Math.sin(bi * 2.1 + time) * 6
        const by = -60 - blife * 55
        const br = (1 - blife) * (4 + bi * 1.5)
        ctx.globalAlpha = (1 - blife) * 0.7
        ctx.beginPath(); ctx.arc(bx, by, br, 0, Math.PI * 2); ctx.fill()
      }
      ctx.globalAlpha = 1
      ctx.restore()
      break
    }
    case 'counter': {
      // One arm extended, making circular wipe motion
      const wipeAngle = time * 2.8
      const wx = Math.cos(wipeAngle) * 22
      const wy2 = Math.sin(wipeAngle) * 10
      ctx.save(); ctx.translate(22, ay); ctx.rotate(0.1)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(22 + wx, -6 + wy2); ctx.stroke(); ctx.restore()
      // Cloth in hand
      ctx.fillStyle = '#e0e8d0'
      ctx.beginPath(); ctx.roundRect(30 + wx, ay - 10 + wy2, 20, 12, 4); ctx.fill()
      ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1.5; ctx.stroke()
      // Other arm braced
      ctx.strokeStyle = skinColor; ctx.lineWidth = 12
      ctx.save(); ctx.translate(-22, ay); ctx.rotate(-0.35)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -8); ctx.stroke(); ctx.restore()
      break
    }
    case 'sweep': {
      // Both arms holding broom handle, swinging side to side
      const sweep = Math.sin(time * 2.2) * 0.45
      const bHandX = 12 + sweep * 50
      const bHandY = -10

      // Upper hand (closer to top of handle)
      ctx.save(); ctx.translate(-18, ay); ctx.rotate(-0.4 + sweep * 0.6)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, -24); ctx.stroke(); ctx.restore()
      // Lower hand
      ctx.save(); ctx.translate(18, ay + 8); ctx.rotate(0.2 + sweep * 0.4)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 14); ctx.stroke(); ctx.restore()

      // Broom handle
      ctx.strokeStyle = '#9a6220'; ctx.lineWidth = 8; ctx.lineCap = 'round'
      ctx.beginPath()
      ctx.moveTo(-4 + sweep * 30, -42)
      ctx.lineTo(bHandX + 18, 44)
      ctx.stroke()
      // Broom head
      ctx.strokeStyle = '#c8a840'; ctx.lineWidth = 7
      ctx.beginPath()
      ctx.moveTo(bHandX - 22, 42)
      ctx.lineTo(bHandX + 38, 44)
      ctx.stroke()
      // Bristles
      ctx.lineWidth = 3; ctx.strokeStyle = '#b09030'
      for (let bi = -4; bi <= 5; bi++) {
        ctx.beginPath()
        ctx.moveTo(bHandX + bi * 6, 43)
        ctx.lineTo(bHandX + bi * 7, 60)
        ctx.stroke()
      }
      // Dust puff
      if (Math.abs(sweep) > 0.25) {
        ctx.fillStyle = 'rgba(190,160,100,0.3)'
        const dpx = bHandX + 40 + sweep * 30
        for (let dp = 0; dp < 5; dp++) {
          const dpr = 4 + dp * 3
          ctx.beginPath()
          ctx.arc(dpx + dp * 8, 50 + Math.sin(dp + time) * 4, dpr, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case 'tidy': {
      // Pick up / place cycle
      const cycle = (time * 0.7) % 1
      const lifting = cycle < 0.45
      const armY = lifting
        ? lerp(0, -36, cycle / 0.45)
        : lerp(-36, 0, (cycle - 0.45) / 0.55)

      ctx.save(); ctx.translate(22, ay); ctx.rotate(0.15)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(24, armY); ctx.stroke(); ctx.restore()
      ctx.save(); ctx.translate(-22, ay); ctx.rotate(-0.35)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, -4); ctx.stroke(); ctx.restore()

      // Object being moved (a small pillow/book)
      if (cycle < 0.7) {
        ctx.fillStyle = '#e8c040'
        ctx.beginPath()
        ctx.roundRect(28, ay + armY - 4, 26, 16, 5)
        ctx.fill()
        ctx.strokeStyle = 'rgba(0,0,0,0.1)'; ctx.lineWidth = 1.5; ctx.stroke()
      }
      break
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — FOREGROUND VIGNETTE
// ═══════════════════════════════════════════════════════════════════
function drawForeground(ctx: CanvasRenderingContext2D) {
  // Vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.88)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.52)')
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

  // Floor depth shadow
  const fd = ctx.createLinearGradient(0, FLOOR_Y + 18, 0, FLOOR_Y + 110)
  fd.addColorStop(0, 'rgba(0,0,0,0.2)')
  fd.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = fd; ctx.fillRect(LX, FLOOR_Y + 18, RX - LX, 110)

  // Left / right wall fade
  const lv = ctx.createLinearGradient(LX, 0, LX + 90, 0)
  lv.addColorStop(0, 'rgba(0,0,0,0.48)'); lv.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lv; ctx.fillRect(LX, CEIL_Y, 90, FLOOR_Y - CEIL_Y)
  const rv = ctx.createLinearGradient(RX - 90, 0, RX, 0)
  rv.addColorStop(0, 'rgba(0,0,0,0)'); rv.addColorStop(1, 'rgba(0,0,0,0.48)')
  ctx.fillStyle = rv; ctx.fillRect(RX - 90, CEIL_Y, 90, FLOOR_Y - CEIL_Y)
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function FortificationScene({
  threat,
}: {
  threat: string
}) {
  const { avatar } = useAvatar()
  const avatarRef  = useRef(avatar)
  useEffect(() => { avatarRef.current = avatar }, [avatar])

  const cvRef    = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ char: Char; zombies: Zombie[] } | null>(null)
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D
    if (!ctx) return

    // ── Init character ─────────────────────────────────────────
    const char: Char = {
      x: SPOTS[0].x, dir: SPOTS[0].dir, phase: 'chore',
      walkFrom: SPOTS[0].x, walkTo: SPOTS[0].x, walkT: 0, walkDur: 1,
      spotIdx: 0,
      choreType: SPOTS[0].type, choreT: 0, choreDur: SPOTS[0].dur,
    }

    // ── Init zombies ────────────────────────────────────────────
    const nZom = THREAT_NZOM[threat] ?? 2
    const zombies: Zombie[] = Array.from({ length: nZom }, (_, i) => ({
      x: 180 + i * 380,
      vx: (i % 2 === 0 ? 1 : -1) * (14 + i * 5),
      idx: i,
      phase: 'wander' as const,
      timer: 4 + i * 1.8,
      scratchX: 0,
    }))

    stateRef.current = { char, zombies }
    let time = 0, last = 0

    function update(dt: number) {
      time += dt
      const s = stateRef.current!
      const ch = s.char

      // Character state machine
      if (ch.phase === 'chore') {
        ch.choreT += dt / ch.choreDur
        if (ch.choreT >= 1) {
          const next = (ch.spotIdx + 1) % SPOTS.length
          const dist = Math.abs(SPOTS[next].x - ch.x)
          ch.phase    = 'walk'
          ch.walkFrom = ch.x
          ch.walkTo   = SPOTS[next].x
          ch.walkDur  = clamp(dist / WALK_SPEED, 0.4, 6)
          ch.walkT    = 0
          ch.dir      = SPOTS[next].x > ch.x ? 1 : -1
          ch.spotIdx  = next
          ch.choreT   = 0
        }
      } else {
        ch.walkT += dt / ch.walkDur
        if (ch.walkT >= 1) {
          ch.x         = ch.walkTo
          ch.phase     = 'chore'
          ch.choreType = SPOTS[ch.spotIdx].type
          ch.choreDur  = SPOTS[ch.spotIdx].dur
          ch.dir       = SPOTS[ch.spotIdx].dir
          ch.choreT    = 0
        } else {
          ch.x = lerp(ch.walkFrom, ch.walkTo, eio(ch.walkT))
        }
      }

      // Zombie update
      for (const z of s.zombies) {
        z.timer -= dt
        if (z.phase === 'wander') {
          z.x += z.vx * dt
          if (z.x < 30 || z.x > W - 30) z.vx *= -1
          z.x = clamp(z.x, 30, W - 30)
          if (z.timer <= 0) {
            const nearWin = WINS.find(w => Math.abs(z.x - (w.wx + w.ww * 0.5)) < 130)
            if (nearWin && Math.random() < 0.45) {
              z.phase    = 'scratch'
              z.timer    = 2.5 + Math.random() * 2
              z.scratchX = nearWin.wx + nearWin.ww * 0.5
            } else {
              z.timer = 3 + Math.random() * 4
              z.vx    = (Math.random() < 0.5 ? 1 : -1) * (12 + Math.random() * 18)
            }
          }
        } else {
          z.x = lerp(z.x, z.scratchX - 65, dt * 1.8)
          if (z.timer <= 0) {
            z.phase = 'wander'
            z.timer = 2 + Math.random() * 3
            z.vx    = (Math.random() < 0.5 ? 1 : -1) * (14 + Math.random() * 16)
          }
        }
      }
    }

    function draw() {
      const s = stateRef.current!
      const ch = s.char

      // Layer 1 — exterior sky + ground
      drawExterior(ctx)
      // Layer 2 — dead trees (exterior)
      drawDeadTrees(ctx, time)
      // Layer 3 — zombies (exterior, visible through windows)
      for (const z of s.zombies) drawZombie(ctx, z, time)
      // Layer 4 — room walls (covers exterior, leaves window holes open)
      drawRooms(ctx)
      // Layer 5 — windows (glass + frame over holes)
      drawWindows(ctx, time)
      // Layer 6 — furniture per room
      drawKitchen(ctx)
      drawLiving(ctx)
      drawStudy(ctx)
      // Layer 7 — room dividers (on top of furniture at edges)
      drawDividers(ctx)
      // Layer 8 — ceiling (covers exterior above rooms)
      drawCeiling(ctx)
      // Layer 9 — character (inside rooms, above floor furniture)
      const av = avatarRef.current
      const avColors: AvatarColors = {
        skin:      SKIN_COLORS[av.skinTone]  ?? '#f2c89a',
        hair:      HAIR_COLORS[av.hairColor] ?? '#3e2208',
        hairStyle: av.hairStyle ?? 'short',
        jacket:    av.jacketColor,
        pants:  av.pantsColor,
        gender: av.gender,
      }
      drawCharacter(ctx, ch.x, ch.dir, ch.phase, ch.choreType,
        ch.phase === 'chore' ? ch.choreT : ch.walkT, time, avColors)
      // Layer 10 — foreground vignette
      drawForeground(ctx)
    }

    function loop(ts: number) {
      const dt = Math.min((ts - last) / 1000, 0.05)
      last = ts
      update(dt)
      draw()
      rafRef.current = requestAnimationFrame(loop)
    }

    rafRef.current = requestAnimationFrame(ts => { last = ts; loop(ts) })
    return () => cancelAnimationFrame(rafRef.current)
  }, [threat])

  return (
    <div style={{ width: '100%', background: '#060406', aspectRatio: '16/9', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={cvRef}
        width={W}
        height={H}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
      />
    </div>
  )
}
