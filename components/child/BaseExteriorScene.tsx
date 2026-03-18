'use client'

import { useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { useAvatar } from '@/lib/context/AvatarContext'
import { SKIN_COLORS, HAIR_COLORS } from '@/lib/constants/avatar-map'
import { PetSprite } from '@/components/child/PetSprite'

import type { Transition, TargetAndTransition } from 'framer-motion'

// Per-type animation for the companion overlay
interface CompanionAnim { animate: TargetAndTransition; transition: Transition }
const COMPANION_ANIM: Record<string, CompanionAnim> = {
  dog:     { animate: { x: [0, 32, 8, -12, 0] },               transition: { duration: 7,   repeat: Infinity, ease: 'easeInOut' } },
  cat:     { animate: { scaleY: [1, 0.88, 1], y: [0, 2, 0] },  transition: { duration: 4,   repeat: Infinity, ease: 'easeInOut' } },
  rabbit:  { animate: { y: [0, -10, 0], x: [0, 8, 0] },        transition: { duration: 1.6, repeat: Infinity, ease: 'easeInOut' } },
  hamster: { animate: { x: [0, 16, 0, -8, 0] },                transition: { duration: 5,   repeat: Infinity, ease: 'easeInOut' } },
  parrot:  { animate: { rotate: [-4, 4, -4] },                  transition: { duration: 2.5, repeat: Infinity, ease: 'easeInOut' } },
  drone:   { animate: { y: [0, -10, 0], x: [0, 6, 0] },        transition: { duration: 3,   repeat: Infinity, ease: 'easeInOut' } },
  raccoon: { animate: { x: [0, 22, 0, -10, 0] },               transition: { duration: 5.5, repeat: Infinity, ease: 'easeInOut' } },
}
const DEFAULT_ANIM: CompanionAnim = { animate: { y: [0, -4, 0] }, transition: { duration: 3, repeat: Infinity, ease: 'easeInOut' } }

// ═══════════════════════════════════════════════════════════════════
//  CANVAS  1920 × 1080, CSS-scaled to fit container
// ═══════════════════════════════════════════════════════════════════
const W = 1920
const H = 1080

// ─── House facade geometry ────────────────────────────────────────
const ROOF_APEX  = 132   // roof peak y
const ROOF_BASE  = 238   // eave line y
const WALL_BOT   = 492   // wall bottom / yard starts here
const WALL_L     = 178
const WALL_R     = 1742

// ─── Yard ─────────────────────────────────────────────────────────
const FENCE_Y    = 682   // fence rail top
const FENCE_H    = 84    // rail + pickets  → bottom at 766
const FENCE_L    = 85
const FENCE_R    = 1835
const ZOM_GND    = 792   // zombie feet y (exterior, beyond fence)

// ─── Windows on house ─────────────────────────────────────────────
interface HouseWin { x: number; y: number; w: number; h: number; id: number }
const HOUSE_WINS: HouseWin[] = [
  { id: 0, x: 318,  y: 298, w: 178, h: 154 },
  { id: 1, x: 638,  y: 298, w: 178, h: 154 },
  { id: 2, x: 1106, y: 298, w: 178, h: 154 },
  { id: 3, x: 1426, y: 298, w: 178, h: 154 },
]
const DOOR = { x: 878, y: 328, w: 164, h: 164 }

// Gate in fence
const GATE_X  = 878
const GATE_W  = 164

// Fence weak spots (where zombies cluster)
const WEAK_X = [330, 1590]

// ─── Chore spots ─────────────────────────────────────────────────
type ChoreType = 'board' | 'fence' | 'trap' | 'gate'
interface Spot {
  x: number; y: number; type: ChoreType
  dir: -1 | 1; dur: number; scale: number; winId?: number
}
const SPOTS: Spot[] = [
  { x: 408,  y: 498, type: 'board', dir:  1, dur: 3.6, scale: 0.80, winId: 0 },
  { x: 728,  y: 498, type: 'board', dir:  1, dur: 3.2, scale: 0.80, winId: 1 },
  { x: 330,  y: 668, type: 'fence', dir:  1, dur: 3.0, scale: 1.00 },
  { x: 960,  y: 590, type: 'trap',  dir:  1, dur: 2.8, scale: 0.90 },
  { x: 960,  y: 668, type: 'gate',  dir:  1, dur: 3.2, scale: 1.00 },
  { x: 1590, y: 668, type: 'fence', dir: -1, dur: 3.0, scale: 1.00 },
  { x: 1196, y: 498, type: 'board', dir: -1, dur: 3.0, scale: 0.80, winId: 2 },
  { x: 680,  y: 590, type: 'trap',  dir: -1, dur: 2.5, scale: 0.90 },
]

const WALK_SPEED = 155

const THREAT_NZOM: Record<string, number> = {
  none: 1, low: 2, moderate: 3, high: 4, critical: 6,
}

// ─── Helpers ──────────────────────────────────────────────────────
function eio(t: number) { return t * t * (3 - 2 * t) }
function clamp(v: number, a: number, b: number) { return Math.max(a, Math.min(b, v)) }
function lerp(a: number, b: number, t: number) { return a + (b - a) * t }

// ─── State types ──────────────────────────────────────────────────
interface Char {
  x: number; y: number; scale: number; dir: -1 | 1; phase: 'walk' | 'chore'
  walkFrom: number; walkFromY: number; walkTo: number; walkToY: number
  walkToScale: number; walkT: number; walkDur: number
  spotIdx: number; choreType: ChoreType; choreT: number; choreDur: number
  winId: number
}
interface Zombie {
  x: number; vx: number; idx: number
  phase: 'wander' | 'push' | 'reach'; timer: number
  targetX: number   // for push/reach: which fence x
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — SKY
// ═══════════════════════════════════════════════════════════════════
function drawSky(ctx: CanvasRenderingContext2D, t: number) {
  const sky = ctx.createLinearGradient(0, 0, 0, H * 0.55)
  sky.addColorStop(0,    '#06031a')
  sky.addColorStop(0.35, '#0e062c')
  sky.addColorStop(0.7,  '#1a0e3a')
  sky.addColorStop(1,    '#100820')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, W, H)

  // Moon
  ctx.save()
  ctx.shadowColor = '#e8dab0'; ctx.shadowBlur = 55
  ctx.fillStyle = '#f2e8c8'
  ctx.beginPath(); ctx.arc(1680, 78, 56, 0, Math.PI * 2); ctx.fill()
  ctx.shadowBlur = 0
  // craters
  ctx.fillStyle = 'rgba(0,0,0,0.07)'
  ctx.beginPath(); ctx.arc(1694, 64, 13, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(1664, 88, 9,  0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(1698, 96, 6,  0, Math.PI * 2); ctx.fill()
  ctx.restore()

  // Stars
  ctx.fillStyle = 'rgba(255,255,255,0.82)'
  const stars = [
    [95,38],[278,22],[498,55],[748,16],[1008,48],[1268,28],[1488,60],
    [185,82],[420,72],[658,92],[862,68],[1088,84],[1388,54],[1538,88],[1818,34],
    [50,120],[340,108],[600,128],[900,116],[1140,100],[1360,122],[1600,108],[1840,116],
  ]
  for (const [sx, sy] of stars) {
    const pulse = 0.6 + 0.4 * Math.sin(t * 0.5 + sx * 0.1)
    ctx.globalAlpha = pulse
    ctx.beginPath(); ctx.arc(sx, sy, 1.6, 0, Math.PI * 2); ctx.fill()
  }
  ctx.globalAlpha = 1

  // Wispy clouds (slow drift)
  ctx.fillStyle = 'rgba(255,255,255,0.025)'
  for (let ci = 0; ci < 3; ci++) {
    const cx = ((t * 12 + ci * 580) % (W + 300)) - 150
    const cy = 70 + ci * 38
    ctx.beginPath()
    ctx.ellipse(cx, cy, 200, 40, 0, 0, Math.PI * 2); ctx.fill()
    ctx.beginPath()
    ctx.ellipse(cx + 120, cy - 10, 150, 32, 0, 0, Math.PI * 2); ctx.fill()
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — SIDE TREES (flanking house)
// ═══════════════════════════════════════════════════════════════════
function drawSideTrees(ctx: CanvasRenderingContext2D, t: number) {
  const trees = [
    { x: 48,   h: 340, r: 0.045, thick: 14 },
    { x: 1888, h: 300, r:-0.038, thick: 13 },
    { x: 38,   h: 200, r: 0.025, thick: 9  },
    { x: 1902, h: 220, r:-0.028, thick: 10 },
  ]
  for (const tr of trees) {
    const sway = Math.sin(t * 0.42 + Math.abs(tr.r) * 70) * 4
    ctx.save()
    ctx.translate(tr.x + sway * 0.3, WALL_BOT + 10)
    ctx.strokeStyle = '#100c06'; ctx.lineWidth = tr.thick; ctx.lineCap = 'round'; ctx.lineJoin = 'round'
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(tr.r * tr.h + sway, -tr.h); ctx.stroke()
    ctx.lineWidth = Math.max(5, tr.thick * 0.42)
    const tip = { x: tr.r * tr.h + sway, y: -tr.h }
    for (const frac of [0.28, 0.52, 0.73]) {
      const bx = lerp(0, tip.x, frac), by = lerp(0, tip.y, frac)
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx + 50 + sway * 0.5, by - 60); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx, by); ctx.lineTo(bx - 42 + sway * 0.3, by - 52); ctx.stroke()
    }
    ctx.restore()
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — EXTERIOR GROUND (beyond fence)
// ═══════════════════════════════════════════════════════════════════
function drawExteriorGround(ctx: CanvasRenderingContext2D) {
  const g = ctx.createLinearGradient(0, FENCE_Y + FENCE_H, 0, H)
  g.addColorStop(0,   '#0d1808')
  g.addColorStop(0.3, '#080e04')
  g.addColorStop(1,   '#040804')
  ctx.fillStyle = g
  ctx.fillRect(0, FENCE_Y + FENCE_H, W, H - FENCE_Y - FENCE_H)

  // Dead grass patches
  ctx.strokeStyle = 'rgba(30,50,20,0.5)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
  const blades = [
    140,280,480,660,820,1050,1200,1340,1500,1680,1820,
  ]
  for (const bx of blades) {
    for (let bi = 0; bi < 4; bi++) {
      ctx.beginPath()
      ctx.moveTo(bx + bi * 8, FENCE_Y + FENCE_H + 4)
      ctx.lineTo(bx + bi * 8 + (bi % 2 === 0 ? 5 : -5), FENCE_Y + FENCE_H + 22)
      ctx.stroke()
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — ZOMBIES
// ═══════════════════════════════════════════════════════════════════
const ZS = ['#7aaa72','#8aba78','#9aaa68','#6a9a6c','#88aa80','#78b070']
const ZC = ['#2a382a','#383028','#283040','#302828','#283830','#2a3020']

function drawZombieBody(ctx: CanvasRenderingContext2D, z: Zombie, time: number) {
  const skin  = ZS[z.idx % ZS.length]
  const cloth = ZC[z.idx % ZC.length]
  const sc    = 0.88 + (z.idx % 3) * 0.09

  ctx.save()
  ctx.translate(z.x, ZOM_GND)
  ctx.scale(sc, sc)

  // shadow
  ctx.beginPath(); ctx.ellipse(0, 8, 22, 6, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.35)'; ctx.fill()

  // legs
  const legSwing = z.phase === 'wander' ? Math.sin(time * 1.8) * 0.20 : 0
  ctx.strokeStyle = cloth; ctx.lineWidth = 14; ctx.lineCap = 'round'
  ctx.save(); ctx.translate(-9, -4); ctx.rotate(legSwing)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-4, 56); ctx.stroke(); ctx.restore()
  ctx.save(); ctx.translate(9, -4); ctx.rotate(-legSwing)
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(4, 56); ctx.stroke(); ctx.restore()

  // body
  ctx.fillStyle = cloth
  ctx.beginPath(); ctx.roundRect(-22, -84, 44, 82, 9); ctx.fill()

  // head
  ctx.fillStyle = skin
  ctx.beginPath(); ctx.arc(0, -100, 22, 0, Math.PI * 2); ctx.fill()

  // eye sockets
  ctx.fillStyle = 'rgba(0,0,0,0.22)'
  ctx.beginPath(); ctx.ellipse(-8, -103, 7, 4, -0.3, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.ellipse( 8, -103, 7, 4,  0.3, 0, Math.PI * 2); ctx.fill()
  // eyes
  ctx.fillStyle = '#cc2020'
  ctx.beginPath(); ctx.arc(-8, -104, 4.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 8, -104, 4.5, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = '#ff7070'
  ctx.beginPath(); ctx.arc(-7, -105.5, 1.6, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 9, -105.5, 1.6, 0, Math.PI * 2); ctx.fill()

  // mouth
  ctx.strokeStyle = '#3a1010'; ctx.lineWidth = 2; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(0, -92, 9, 0.28, Math.PI - 0.28); ctx.stroke()

  // arms (non-reach: raised stumbling forward)
  ctx.strokeStyle = skin; ctx.lineWidth = 12
  if (z.phase !== 'reach') {
    const armBob = Math.sin(time * 1.8 + 1.0) * 0.20
    ctx.save(); ctx.translate(-22, -66); ctx.rotate(-0.60 + armBob)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-44, -22); ctx.stroke(); ctx.restore()
    ctx.save(); ctx.translate( 22, -66); ctx.rotate( 0.60 - armBob)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo( 44, -22); ctx.stroke(); ctx.restore()
  }

  // worn shirt tears
  ctx.strokeStyle = 'rgba(0,0,0,0.14)'; ctx.lineWidth = 1.5
  ctx.beginPath(); ctx.moveTo(-20, -45); ctx.lineTo(-15, -22); ctx.stroke()
  ctx.beginPath(); ctx.moveTo( 14, -55); ctx.lineTo(  9, -33); ctx.stroke()

  ctx.restore()
}

// Arms that reach THROUGH fence (drawn after fence layer)
function drawZombieReachArm(ctx: CanvasRenderingContext2D, z: Zombie, time: number) {
  if (z.phase !== 'reach' && z.phase !== 'push') return
  const skin = ZS[z.idx % ZS.length]
  const sc   = 0.88 + (z.idx % 3) * 0.09
  const reach = z.phase === 'reach'
    ? Math.sin(time * 3.5) * 18
    : Math.sin(time * 5.0) * 10

  ctx.save()
  ctx.translate(z.x, ZOM_GND)
  ctx.scale(sc, sc)

  ctx.strokeStyle = skin; ctx.lineWidth = 12; ctx.lineCap = 'round'
  if (z.phase === 'reach') {
    // Right arm reaches up and through fence gap
    ctx.save(); ctx.translate(22, -66)
    ctx.beginPath()
    ctx.moveTo(0, 0)
    ctx.lineTo(30, -50 - reach)
    ctx.stroke()
    // Clawing hand
    ctx.lineWidth = 5
    for (let fi = 0; fi < 4; fi++) {
      ctx.beginPath()
      ctx.moveTo(30 + fi * 5, -50 - reach)
      ctx.lineTo(30 + fi * 5 + (fi % 2 === 0 ? 8 : -4), -50 - reach - 16)
      ctx.stroke()
    }
    ctx.restore()
  } else {
    // Push: both arms extended forward against fence
    ctx.save(); ctx.translate(-22, -66)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-8, -30 + reach * 0.5); ctx.stroke()
    ctx.restore()
    ctx.save(); ctx.translate(22, -66)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(8, -30 + reach * 0.5); ctx.stroke()
    ctx.restore()
  }
  ctx.restore()
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — FENCE
// ═══════════════════════════════════════════════════════════════════
function drawFence(ctx: CanvasRenderingContext2D, t: number) {
  const fy = FENCE_Y, fh = FENCE_H, fl = FENCE_L, fr = FENCE_R

  // Horizontal rails (behind pickets)
  ctx.fillStyle = '#3a2508'
  ctx.fillRect(fl, fy + 14,    fr - fl, 10)  // top rail
  ctx.fillRect(fl, fy + fh - 24, fr - fl, 10) // bottom rail
  // Rail highlight
  ctx.fillStyle = '#4a3010'
  ctx.fillRect(fl, fy + 14, fr - fl, 3)

  const pickW = 22, pickGap = 10, postW = 20
  const step = pickW + pickGap

  // Pickets + posts
  for (let px = fl; px < fr; px += step) {
    // Skip gate opening
    if (px > GATE_X - step && px < GATE_X + GATE_W + step) continue

    const isPost = (Math.floor((px - fl) / step) % 9 === 0)
    const isWeak = WEAK_X.some(wx => Math.abs(px - wx) < 40)

    if (isPost) {
      ctx.fillStyle = '#2c1c06'
      ctx.fillRect(px - postW / 2, fy - 10, postW, fh + 16)
      ctx.fillStyle = '#3a2810'
      ctx.fillRect(px - postW / 2, fy - 10, postW, 6)
    } else {
      ctx.fillStyle = isWeak ? '#362010' : '#4a3012'
      ctx.fillRect(px, fy + 4, pickW, fh - 8)
      // Plank grain
      ctx.fillStyle = 'rgba(0,0,0,0.08)'
      ctx.fillRect(px + pickW / 3, fy + 4, 2, fh - 8)
      if (isWeak) {
        // Crack line
        ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 1.5
        ctx.beginPath()
        ctx.moveTo(px + 8,  fy + 15)
        ctx.lineTo(px + 14, fy + 40)
        ctx.lineTo(px + 10, fy + 62)
        ctx.stroke()
      }
    }
  }

  // Gate
  ctx.fillStyle = '#3a2808'
  ctx.fillRect(GATE_X, fy + 4, GATE_W, fh - 8)
  // Gate planks
  ctx.strokeStyle = '#2a1c06'; ctx.lineWidth = 2
  ctx.beginPath(); ctx.moveTo(GATE_X + GATE_W / 2, fy + 4); ctx.lineTo(GATE_X + GATE_W / 2, fy + fh - 8); ctx.stroke()
  // Gate cross brace (X pattern)
  ctx.strokeStyle = '#4a3010'; ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(GATE_X + 8, fy + 8)
  ctx.lineTo(GATE_X + GATE_W - 8, fy + fh - 12)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(GATE_X + GATE_W - 8, fy + 8)
  ctx.lineTo(GATE_X + 8, fy + fh - 12)
  ctx.stroke()
  // Gate latch
  ctx.fillStyle = '#888060'
  ctx.beginPath(); ctx.roundRect(GATE_X + GATE_W - 20, fy + fh / 2 - 10, 16, 20, 4); ctx.fill()
  ctx.fillStyle = '#aaa080'
  ctx.beginPath(); ctx.roundRect(GATE_X + GATE_W - 18, fy + fh / 2 - 8, 12, 8, 3); ctx.fill()

  // Fence shadow on ground (yard side)
  const shad = ctx.createLinearGradient(0, fy, 0, fy + 50)
  shad.addColorStop(0, 'rgba(0,0,0,0.22)')
  shad.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = shad
  ctx.fillRect(fl, fy + fh, fr - fl, 50)

  // Lantern post at gate (left side)
  const lpX = GATE_X - 30
  ctx.fillStyle = '#2a1c08'
  ctx.fillRect(lpX - 5, WALL_BOT + 30, 10, FENCE_Y - WALL_BOT - 30)
  // Lantern housing
  ctx.fillStyle = '#4a3810'
  ctx.beginPath(); ctx.roundRect(lpX - 14, WALL_BOT + 22, 28, 32, 5); ctx.fill()
  // Warm light
  ctx.fillStyle = `rgba(255,200,80,${0.5 + 0.2 * Math.sin(t * 1.8)})`
  ctx.beginPath(); ctx.roundRect(lpX - 10, WALL_BOT + 26, 20, 24, 4); ctx.fill()
  // Light cone
  const lc = ctx.createRadialGradient(lpX, WALL_BOT + 38, 0, lpX, WALL_BOT + 38, 180)
  lc.addColorStop(0,   `rgba(255,200,60,${0.10 + 0.04 * Math.sin(t * 1.8)})`)
  lc.addColorStop(1,   'rgba(255,180,40,0)')
  ctx.fillStyle = lc
  ctx.fillRect(lpX - 90, WALL_BOT + 38, 180, 200)
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — YARD GROUND + PROPS
// ═══════════════════════════════════════════════════════════════════
function drawYard(ctx: CanvasRenderingContext2D, traps: Set<number>) {
  // Grass gradient
  const g = ctx.createLinearGradient(0, WALL_BOT, 0, FENCE_Y)
  g.addColorStop(0,   '#1a3010')
  g.addColorStop(0.5, '#162a0c')
  g.addColorStop(1,   '#102008')
  ctx.fillStyle = g
  ctx.fillRect(0, WALL_BOT, W, FENCE_Y - WALL_BOT)

  // Grass blade texture rows
  ctx.strokeStyle = 'rgba(30,60,15,0.4)'; ctx.lineWidth = 1.5; ctx.lineCap = 'round'
  for (let row = 0; row < 3; row++) {
    const gy = WALL_BOT + 30 + row * 55
    for (let bx = 80; bx < W - 80; bx += 28) {
      ctx.beginPath(); ctx.moveTo(bx, gy); ctx.lineTo(bx + 4, gy - 14); ctx.stroke()
      ctx.beginPath(); ctx.moveTo(bx + 8, gy); ctx.lineTo(bx + 4, gy - 18); ctx.stroke()
    }
  }

  // Stone path from door to gate
  const pathX = GATE_X + GATE_W / 2
  ctx.fillStyle = '#2a2018'
  for (let si = 0; si < 6; si++) {
    const sy = WALL_BOT + 45 + si * 33
    ctx.beginPath()
    ctx.ellipse(pathX + (si % 2 === 0 ? -8 : 8), sy, 38, 14, 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#342818'
    ctx.beginPath()
    ctx.ellipse(pathX + (si % 2 === 0 ? -8 : 8), sy - 2, 38, 12, 0.1, 0, Math.PI * 2)
    ctx.fill()
    ctx.fillStyle = '#2a2018'
  }

  // Sandbag pile (left of door)
  const sbX = DOOR.x - 110
  const sbY = WALL_BOT + 8
  for (let row = 0; row < 2; row++) {
    for (let col = 0; col < 3; col++) {
      const sx = sbX + col * 48 - (row === 1 ? 24 : 0)
      const sy = sbY + row * (-20)
      ctx.fillStyle = '#5a5030'
      ctx.beginPath(); ctx.roundRect(sx, sy, 44, 26, 10); ctx.fill()
      ctx.fillStyle = '#4a4228'
      ctx.beginPath(); ctx.ellipse(sx + 22, sy + 13, 18, 10, 0, 0, Math.PI * 2); ctx.fill()
      ctx.strokeStyle = '#3a3220'; ctx.lineWidth = 2
      ctx.beginPath(); ctx.arc(sx + 22, sy + 13, 9, 0, Math.PI * 2); ctx.stroke()
    }
  }

  // Rain barrel (right of yard)
  const barX = 1380, barY = WALL_BOT + 5
  ctx.fillStyle = '#3a2808'
  ctx.beginPath(); ctx.roundRect(barX, barY, 58, 80, 6); ctx.fill()
  // Barrel hoops
  ctx.strokeStyle = '#1a1208'; ctx.lineWidth = 5
  for (const hy of [barY + 18, barY + 38, barY + 58]) {
    ctx.beginPath(); ctx.moveTo(barX, hy); ctx.lineTo(barX + 58, hy); ctx.stroke()
  }
  ctx.fillStyle = '#2a1c06'; ctx.fillRect(barX - 4, barY, 66, 12)

  // Trap prop: spike strip or tripwire (only if trap has been placed)
  for (const trapSlot of traps) {
    const spot = SPOTS.find((s, i) => i === trapSlot && s.type === 'trap')
    if (!spot) continue
    const tx = spot.x, ty = spot.y
    ctx.strokeStyle = '#c0a030'; ctx.lineWidth = 2; ctx.lineCap = 'round'
    ctx.beginPath(); ctx.moveTo(tx - 50, ty + 12); ctx.lineTo(tx + 50, ty + 12); ctx.stroke()
    for (let ti = -4; ti <= 4; ti++) {
      ctx.beginPath(); ctx.moveTo(tx + ti * 12, ty + 12); ctx.lineTo(tx + ti * 12, ty - 4); ctx.stroke()
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — HOUSE FACADE
// ═══════════════════════════════════════════════════════════════════
function drawHouse(ctx: CanvasRenderingContext2D, boardProgress: Record<number, number>) {
  // Sky fill behind roof
  const { x: dx, y: dy, w: dw, h: dh } = DOOR

  // ── Roof ──────────────────────────────────────────────────────
  // Main slope (left + right halves)
  ctx.fillStyle = '#1e1a28'
  ctx.beginPath()
  ctx.moveTo(WALL_L - 30, ROOF_BASE + 5)
  ctx.lineTo(960, ROOF_APEX)
  ctx.lineTo(WALL_R + 30, ROOF_BASE + 5)
  ctx.lineTo(WALL_R + 30, ROOF_BASE + 28)
  ctx.lineTo(WALL_L - 30, ROOF_BASE + 28)
  ctx.closePath(); ctx.fill()

  // Eave overhang fascia
  ctx.fillStyle = '#2e2838'
  ctx.fillRect(WALL_L - 30, ROOF_BASE + 5, WALL_R - WALL_L + 60, 12)

  // Roof shingles (horizontal lines)
  ctx.strokeStyle = 'rgba(0,0,0,0.2)'; ctx.lineWidth = 2
  for (let rsh = ROOF_BASE + 5; rsh > ROOF_APEX; rsh -= 20) {
    const frac = (ROOF_BASE + 5 - rsh) / (ROOF_BASE + 5 - ROOF_APEX)
    const rw = (WALL_R - WALL_L + 60) * (1 - frac * 0.95)
    ctx.beginPath()
    ctx.moveTo(960 - rw / 2, rsh)
    ctx.lineTo(960 + rw / 2, rsh)
    ctx.stroke()
  }

  // ── House wall ────────────────────────────────────────────────
  const wallGrad = ctx.createLinearGradient(0, ROOF_BASE, 0, WALL_BOT)
  wallGrad.addColorStop(0, '#2c3828')
  wallGrad.addColorStop(0.5, '#263220')
  wallGrad.addColorStop(1, '#1e2818')
  ctx.fillStyle = wallGrad
  ctx.fillRect(WALL_L, ROOF_BASE, WALL_R - WALL_L, WALL_BOT - ROOF_BASE)

  // Horizontal siding lines
  ctx.strokeStyle = 'rgba(0,0,0,0.12)'; ctx.lineWidth = 1.5
  for (let sy = ROOF_BASE + 18; sy < WALL_BOT; sy += 18) {
    ctx.beginPath(); ctx.moveTo(WALL_L, sy); ctx.lineTo(WALL_R, sy); ctx.stroke()
  }

  // Foundation / base trim
  ctx.fillStyle = '#1a2010'
  ctx.fillRect(WALL_L, WALL_BOT - 18, WALL_R - WALL_L, 18)
  // Foundation shadow
  ctx.fillStyle = 'rgba(0,0,0,0.25)'
  ctx.fillRect(WALL_L, WALL_BOT, WALL_R - WALL_L, 12)

  // Exterior lights (above windows)
  const lightXs = [408, 728, 1192, 1516]
  for (const lx of lightXs) {
    ctx.fillStyle = '#2a2018'
    ctx.beginPath(); ctx.roundRect(lx - 14, ROOF_BASE + 18, 28, 20, 4); ctx.fill()
    ctx.fillStyle = 'rgba(255,220,120,0.35)'
    ctx.beginPath(); ctx.roundRect(lx - 10, ROOF_BASE + 21, 20, 15, 3); ctx.fill()
    const elc = ctx.createRadialGradient(lx, ROOF_BASE + 28, 0, lx, ROOF_BASE + 28, 80)
    elc.addColorStop(0,   'rgba(255,210,100,0.08)')
    elc.addColorStop(1,   'rgba(255,200,80,0)')
    ctx.fillStyle = elc; ctx.fillRect(lx - 40, ROOF_BASE + 28, 80, 80)
  }

  // ── Windows ───────────────────────────────────────────────────
  for (const win of HOUSE_WINS) {
    const bp = boardProgress[win.id] ?? 0

    // Window recess shadow
    ctx.fillStyle = '#151810'
    ctx.fillRect(win.x - 6, win.y - 6, win.w + 12, win.h + 12)

    // Glass (dark inside, slight warm glow)
    const wg = ctx.createLinearGradient(win.x, win.y, win.x + win.w, win.y + win.h)
    wg.addColorStop(0,   '#0a1208')
    wg.addColorStop(0.5, '#0e1a0c')
    wg.addColorStop(1,   '#080e06')
    ctx.fillStyle = wg
    ctx.fillRect(win.x, win.y, win.w, win.h)

    // Interior warm glow (candlelight)
    ctx.fillStyle = 'rgba(255,180,60,0.06)'
    ctx.fillRect(win.x, win.y, win.w, win.h)

    // Pane dividers
    ctx.strokeStyle = '#3a4830'; ctx.lineWidth = 5
    ctx.strokeRect(win.x, win.y, win.w, win.h)
    ctx.lineWidth = 3
    ctx.beginPath(); ctx.moveTo(win.x + win.w / 2, win.y); ctx.lineTo(win.x + win.w / 2, win.y + win.h); ctx.stroke()
    ctx.beginPath(); ctx.moveTo(win.x, win.y + win.h / 2); ctx.lineTo(win.x + win.w, win.y + win.h / 2); ctx.stroke()

    // Glass reflection
    ctx.fillStyle = 'rgba(255,255,255,0.04)'
    ctx.beginPath()
    ctx.moveTo(win.x + win.w * 0.1, win.y)
    ctx.lineTo(win.x + win.w * 0.3, win.y)
    ctx.lineTo(win.x + win.w * 0.1, win.y + win.h)
    ctx.closePath(); ctx.fill()

    // Boards (appear as bp progresses 0→1)
    if (bp > 0) {
      const numBoards = Math.ceil(bp * 4)
      const boardH    = win.h / 4.2
      ctx.fillStyle = '#6a4018'
      for (let bi = 0; bi < numBoards; bi++) {
        const byOff = bi * (win.h / 4)
        const alpha = bi < numBoards - 1 ? 1 : (bp * 4) % 1 || 1
        ctx.globalAlpha = alpha
        ctx.fillRect(win.x - 8, win.y + byOff, win.w + 16, boardH - 3)
        ctx.fillStyle = '#8a5220'
        ctx.fillRect(win.x - 8, win.y + byOff, win.w + 16, 4)
        ctx.fillStyle = '#6a4018'
        // Nail dots
        ctx.fillStyle = '#2a1808'
        ctx.beginPath(); ctx.arc(win.x + 16, win.y + byOff + boardH / 2, 3, 0, Math.PI * 2); ctx.fill()
        ctx.beginPath(); ctx.arc(win.x + win.w - 16, win.y + byOff + boardH / 2, 3, 0, Math.PI * 2); ctx.fill()
        ctx.fillStyle = '#6a4018'
      }
      ctx.globalAlpha = 1
    }

    // Shutter left
    ctx.fillStyle = '#283820'
    ctx.fillRect(win.x - 24, win.y, 20, win.h)
    ctx.strokeStyle = '#1a2818'; ctx.lineWidth = 1.5
    for (let sl = win.y + 10; sl < win.y + win.h - 6; sl += 12) {
      ctx.beginPath(); ctx.moveTo(win.x - 22, sl); ctx.lineTo(win.x - 6, sl + 4); ctx.stroke()
    }
    // Shutter right
    ctx.fillStyle = '#283820'
    ctx.fillRect(win.x + win.w + 4, win.y, 20, win.h)
    for (let sl = win.y + 10; sl < win.y + win.h - 6; sl += 12) {
      ctx.beginPath(); ctx.moveTo(win.x + win.w + 6, sl + 4); ctx.lineTo(win.x + win.w + 22, sl); ctx.stroke()
    }
  }

  // ── Front door ────────────────────────────────────────────────
  ctx.fillStyle = '#1e1408'
  ctx.fillRect(dx - 6, dy - 6, dw + 12, dh + 12)
  ctx.fillStyle = '#2a2010'
  ctx.fillRect(dx, dy, dw, dh)
  // Panels
  ctx.strokeStyle = '#3a3018'; ctx.lineWidth = 3
  ctx.strokeRect(dx + 10, dy + 10, dw - 20, dh / 2 - 15)
  ctx.strokeRect(dx + 10, dy + dh / 2, dw - 20, dh / 2 - 14)
  // Knob
  ctx.fillStyle = '#c0a050'
  ctx.beginPath(); ctx.arc(dx + dw - 18, dy + dh * 0.6, 7, 0, Math.PI * 2); ctx.fill()

  // Porch steps
  ctx.fillStyle = '#1e1a14'
  ctx.fillRect(dx - 20, WALL_BOT, dw + 40, 12)
  ctx.fillStyle = '#282218'
  ctx.fillRect(dx - 10, WALL_BOT + 12, dw + 20, 10)
  // Step highlight
  ctx.fillStyle = 'rgba(255,255,255,0.04)'
  ctx.fillRect(dx - 20, WALL_BOT, dw + 40, 3)
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — CHARACTER
// ═══════════════════════════════════════════════════════════════════
interface AvatarColors { skin: string; hair: string; hairStyle: string; jacket: string; pants: string; gender: string }

function drawCharacter(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, scale: number,
  dir: -1 | 1,
  phase: 'walk' | 'chore',
  choreType: ChoreType,
  choreT: number,
  time: number,
  winId: number,
  av: AvatarColors,
) {
  ctx.save()
  ctx.translate(x, y)
  ctx.scale(dir * scale, scale)

  const walking = phase === 'walk'
  const headBob = walking ? Math.sin(time * 6.5) * 3.5 : 0

  // shadow
  ctx.beginPath()
  ctx.ellipse(0, 4, 26 / scale, 7 / scale, 0, 0, Math.PI * 2)
  ctx.fillStyle = 'rgba(0,0,0,0.25)'; ctx.fill()

  // Legs
  const legSwing = walking ? Math.sin(time * 6.5) * 0.38 : 0
  drawLeg2(ctx, -9,  legSwing, av.pants, '#1a1010', walking, time)
  drawLeg2(ctx,  9, -legSwing, av.pants, '#1a1010', walking, time)

  // Body
  const bodyY = -90 + (walking ? -Math.abs(Math.sin(time * 6.5)) * 3 : 0)
  ctx.fillStyle = av.jacket
  ctx.beginPath(); ctx.roundRect(-22, bodyY, 44, 58, 11); ctx.fill()
  ctx.fillStyle = 'rgba(0,0,0,0.1)'
  ctx.beginPath(); ctx.roundRect(4, bodyY + 12, 16, 13, 3); ctx.fill()

  // Arms
  drawChoreArms(ctx, choreType, walking, choreT, time, bodyY, winId, av.skin)

  // Head
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
      ctx.moveTo(-6, -46);  ctx.lineTo(-8,  -62); ctx.lineTo( 2, -48)
      ctx.moveTo( 8,  -46); ctx.lineTo( 8,  -62); ctx.lineTo(16, -48)
      ctx.moveTo(18, -44);  ctx.lineTo(22,  -58); ctx.lineTo(26, -46)
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
      // Default / short
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
  ctx.fillStyle = '#1e1408'
  ctx.beginPath(); ctx.arc(-9, -24, 4, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc( 9, -24, 4, 0, Math.PI * 2); ctx.fill()
  ctx.fillStyle = 'rgba(255,255,255,0.8)'
  ctx.beginPath(); ctx.arc(-7.5, -25.5, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.beginPath(); ctx.arc(10.5, -25.5, 1.5, 0, Math.PI * 2); ctx.fill()
  ctx.strokeStyle = '#8a3e18'; ctx.lineWidth = 2.2; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.arc(0, -14, 9, 0.15, Math.PI - 0.15); ctx.stroke()
  ctx.restore()

  ctx.restore()
}

function drawLeg2(
  ctx: CanvasRenderingContext2D,
  ox: number, angle: number,
  col: string, shoeCol: string,
  _walking: boolean, _time: number
) {
  ctx.save()
  ctx.translate(ox, -48); ctx.rotate(angle)
  ctx.strokeStyle = col; ctx.lineWidth = 14; ctx.lineCap = 'round'
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(0, 46); ctx.stroke()
  ctx.fillStyle = shoeCol
  ctx.beginPath(); ctx.ellipse(ox * 0.3, 51, 14, 7, angle * 0.2, 0, Math.PI * 2); ctx.fill()
  ctx.restore()
}

function drawChoreArms(
  ctx: CanvasRenderingContext2D,
  choreType: ChoreType,
  walking: boolean,
  t: number,
  time: number,
  bodyY: number,
  _winId: number,
  skinColor: string
) {
  ctx.strokeStyle = skinColor; ctx.lineWidth = 12; ctx.lineCap = 'round'
  const ay = bodyY + 10

  if (walking) {
    const sw = Math.sin(time * 6.5) * 0.42
    ctx.save(); ctx.translate(-22, ay); ctx.rotate(sw)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-18, 32); ctx.stroke(); ctx.restore()
    ctx.save(); ctx.translate(22, ay); ctx.rotate(-sw)
    ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(18, 32); ctx.stroke(); ctx.restore()
    return
  }

  switch (choreType) {
    case 'board': {
      // Hold plank up to window, hammer down
      const hammerPhase = (t * 3) % 1
      const hammerSwing = hammerPhase < 0.35
        ? lerp(0, -1.2, hammerPhase / 0.35)
        : lerp(-1.2, 0.2, (hammerPhase - 0.35) / 0.65)

      // Left arm: holding plank flat against wall
      ctx.save(); ctx.translate(-22, ay); ctx.rotate(-1.1)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-5, -38); ctx.stroke()
      ctx.restore()
      // Right arm: hammering
      ctx.save(); ctx.translate(22, ay); ctx.rotate(hammerSwing)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, -36); ctx.stroke()
      // Hammer head
      ctx.strokeStyle = '#606060'; ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(12 - 10, -36); ctx.lineTo(12 + 10, -36); ctx.stroke()
      ctx.restore()
      // Wood plank being held (drawn in world space)
      const boards = Math.ceil(t * 4)
      ctx.fillStyle = '#7a4820'
      for (let bi = 0; bi < boards; bi++) {
        ctx.globalAlpha = bi < boards - 1 ? 0.7 : Math.min(1, (t * 4 % 1) + 0.3)
        ctx.fillRect(-30, bodyY - 20 - bi * 20, 60, 14)
        ctx.fillStyle = '#5a3010'
        ctx.fillRect(-30, bodyY - 20 - bi * 20, 60, 3)
        ctx.fillStyle = '#7a4820'
      }
      ctx.globalAlpha = 1
      // Impact sparks on hammer hit
      if (hammerPhase > 0.28 && hammerPhase < 0.45) {
        ctx.fillStyle = 'rgba(255,200,80,0.7)'
        for (let si = 0; si < 5; si++) {
          ctx.beginPath()
          ctx.arc(12 + (si - 2) * 8, -36 + Math.random() * 5, 3, 0, Math.PI * 2)
          ctx.fill()
        }
      }
      break
    }
    case 'fence': {
      // Crouch + hammer fence
      const crouchY = 18    // body is lower when crouching
      const hamP = (time * 4.5) % 1
      const swing = hamP < 0.3
        ? lerp(0.3, 1.1, hamP / 0.3)
        : lerp(1.1, 0.2, (hamP - 0.3) / 0.7)
      ctx.save(); ctx.translate(22, ay + crouchY); ctx.rotate(swing)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(14, 28); ctx.stroke()
      // Hammer head
      ctx.strokeStyle = '#606060'; ctx.lineWidth = 9
      ctx.beginPath(); ctx.moveTo(14 - 9, 28); ctx.lineTo(14 + 9, 28); ctx.stroke()
      ctx.restore()
      // Other arm bracing
      ctx.strokeStyle = skinColor; ctx.lineWidth = 12
      ctx.save(); ctx.translate(-22, ay + crouchY); ctx.rotate(-0.5)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-15, 20); ctx.stroke(); ctx.restore()
      // Wood chip particles
      if (hamP > 0.25 && hamP < 0.4) {
        ctx.fillStyle = 'rgba(120,80,30,0.7)'
        for (let ci = 0; ci < 4; ci++) {
          ctx.beginPath(); ctx.arc(18 + ci * 10, ay + crouchY + 30, 2 + ci, 0, Math.PI * 2); ctx.fill()
        }
      }
      break
    }
    case 'trap': {
      // Crouch down and place trap
      const crouchT = t < 0.3 ? t / 0.3 : t > 0.7 ? 1 - (t - 0.7) / 0.3 : 1
      const crouchY = crouchT * 28
      ctx.save(); ctx.translate(-22, ay + crouchY); ctx.rotate(0.6)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-12, 22); ctx.stroke(); ctx.restore()
      ctx.save(); ctx.translate(22, ay + crouchY); ctx.rotate(-0.6)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(12, 22); ctx.stroke(); ctx.restore()
      // Object being placed (tripwire stake)
      if (t > 0.2 && t < 0.8) {
        ctx.fillStyle = '#8a8060'
        ctx.beginPath(); ctx.roundRect(-6, ay + crouchY + 22, 12, 22, 3); ctx.fill()
      }
      break
    }
    case 'gate': {
      // Stand at gate, look around, check lock
      const inspect = Math.sin(time * 1.2) * 0.35
      // Both hands on gate
      ctx.save(); ctx.translate(-22, ay); ctx.rotate(-0.4 + inspect * 0.5)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-20, 8); ctx.stroke(); ctx.restore()
      ctx.save(); ctx.translate(22, ay); ctx.rotate(0.3 - inspect * 0.3)
      ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(20, 12); ctx.stroke(); ctx.restore()
      break
    }
  }
}

// ═══════════════════════════════════════════════════════════════════
//  DRAW — FOREGROUND
// ═══════════════════════════════════════════════════════════════════
function drawForeground(ctx: CanvasRenderingContext2D) {
  // Vignette
  const vig = ctx.createRadialGradient(W / 2, H / 2, H * 0.28, W / 2, H / 2, H * 0.9)
  vig.addColorStop(0, 'rgba(0,0,0,0)')
  vig.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = vig; ctx.fillRect(0, 0, W, H)

  // Bottom ground strip (foreground)
  const fg = ctx.createLinearGradient(0, H - 80, 0, H)
  fg.addColorStop(0, 'rgba(0,0,0,0)')
  fg.addColorStop(1, 'rgba(0,0,0,0.5)')
  ctx.fillStyle = fg; ctx.fillRect(0, H - 80, W, 80)

  // Left/right house wall fade
  const lv = ctx.createLinearGradient(0, 0, 95, 0)
  lv.addColorStop(0, 'rgba(0,0,0,0.55)'); lv.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = lv; ctx.fillRect(0, 0, 95, H)
  const rv = ctx.createLinearGradient(W - 95, 0, W, 0)
  rv.addColorStop(0, 'rgba(0,0,0,0)'); rv.addColorStop(1, 'rgba(0,0,0,0.55)')
  ctx.fillStyle = rv; ctx.fillRect(W - 95, 0, 95, H)
}

// ═══════════════════════════════════════════════════════════════════
//  COMPONENT
// ═══════════════════════════════════════════════════════════════════
export function BaseExteriorScene({
  threat,
  companion,
}: {
  threat: string
  baseHealth: number
  companion?: { type: string; color: string } | null
}) {
  const { avatar } = useAvatar()
  const avatarRef  = useRef(avatar)
  useEffect(() => { avatarRef.current = avatar }, [avatar])

  const companionElRef = useRef<HTMLDivElement | null>(null)
  const companionRef   = useRef(companion)
  useEffect(() => { companionRef.current = companion }, [companion])

  const cvRef    = useRef<HTMLCanvasElement>(null)
  const stateRef = useRef<{ char: Char; zombies: Zombie[]; traps: Set<number>; boards: Record<number, number> } | null>(null)
  const rafRef   = useRef<number>(0)

  useEffect(() => {
    const cv = cvRef.current
    if (!cv) return
    const ctx = cv.getContext('2d') as CanvasRenderingContext2D
    if (!ctx) return

    // ── Init character ─────────────────────────────────────────
    const s0 = SPOTS[0]
    const char: Char = {
      x: s0.x, y: s0.y, scale: s0.scale, dir: s0.dir, phase: 'chore',
      walkFrom: s0.x, walkFromY: s0.y, walkTo: s0.x, walkToY: s0.y,
      walkToScale: s0.scale, walkT: 0, walkDur: 1,
      spotIdx: 0,
      choreType: s0.type, choreT: 0, choreDur: s0.dur,
      winId: s0.winId ?? -1,
    }

    // ── Init zombies ────────────────────────────────────────────
    const nZom = THREAT_NZOM[threat] ?? 2
    const zombies: Zombie[] = Array.from({ length: nZom }, (_, i) => ({
      x: 160 + i * 340,
      vx: (i % 2 === 0 ? 1 : -1) * (11 + i * 4),
      idx: i,
      phase: 'wander' as const,
      timer: 3 + i * 2,
      targetX: 0,
    }))

    const traps  = new Set<number>()
    const boards: Record<number, number> = {}

    stateRef.current = { char, zombies, traps, boards }
    let time = 0, last = 0

    function update(dt: number) {
      time += dt
      const s = stateRef.current!
      const ch = s.char

      // ── Character state machine ──────────────────────────────
      if (ch.phase === 'chore') {
        ch.choreT += dt / ch.choreDur
        // Update visual state of boards / traps during chore
        if (ch.choreType === 'board' && ch.winId >= 0) {
          s.boards[ch.winId] = ch.choreT
        }
        if (ch.choreT >= 1) {
          // Finalize
          if (ch.choreType === 'trap') s.traps.add(ch.spotIdx)
          if (ch.choreType === 'board' && ch.winId >= 0) s.boards[ch.winId] = 1
          // Move to next
          const next   = (ch.spotIdx + 1) % SPOTS.length
          const sp     = SPOTS[next]
          const dist   = Math.hypot(sp.x - ch.x, sp.y - ch.y)
          ch.phase     = 'walk'
          ch.walkFrom  = ch.x; ch.walkFromY = ch.y
          ch.walkTo    = sp.x; ch.walkToY   = sp.y
          ch.walkToScale = sp.scale
          ch.walkDur   = clamp(dist / WALK_SPEED, 0.5, 6)
          ch.walkT     = 0
          ch.dir       = sp.x > ch.x ? 1 : (sp.x < ch.x ? -1 : ch.dir)
          ch.spotIdx   = next
          ch.choreT    = 0
          // Reset board progress for this window if looping
          if (sp.type === 'board' && sp.winId !== undefined) {
            s.boards[sp.winId] = 0
          }
        }
      } else {
        ch.walkT += dt / ch.walkDur
        if (ch.walkT >= 1) {
          ch.x     = ch.walkTo;  ch.y = ch.walkToY
          ch.scale = ch.walkToScale
          const sp = SPOTS[ch.spotIdx]
          ch.phase     = 'chore'
          ch.choreType = sp.type
          ch.choreDur  = sp.dur
          ch.dir       = sp.dir
          ch.winId     = sp.winId ?? -1
          ch.choreT    = 0
        } else {
          const e    = eio(ch.walkT)
          ch.x       = lerp(ch.walkFrom, ch.walkTo, e)
          ch.y       = lerp(ch.walkFromY, ch.walkToY, e)
          ch.scale   = lerp(ch.scale, ch.walkToScale, e)
        }
      }

      // ── Zombie update ────────────────────────────────────────
      for (const z of s.zombies) {
        z.timer -= dt
        if (z.phase === 'wander') {
          z.x += z.vx * dt
          if (z.x < 30 || z.x > W - 30) z.vx *= -1
          z.x = clamp(z.x, 30, W - 30)
          if (z.timer <= 0) {
            // Drift toward weak spot or gate?
            const near = Math.random() < 0.5
              ? WEAK_X[z.idx % WEAK_X.length]
              : GATE_X + GATE_W / 2
            const r2 = Math.random()
            if (r2 < 0.35) {
              z.phase = 'push'; z.timer = 2 + Math.random() * 2.5; z.targetX = near
            } else if (r2 < 0.65) {
              z.phase = 'reach'; z.timer = 1.8 + Math.random() * 2; z.targetX = near
            } else {
              z.timer = 2.5 + Math.random() * 4
              z.vx    = (Math.random() < 0.5 ? 1 : -1) * (10 + Math.random() * 16)
            }
          }
        } else {
          // Drift toward targetX
          z.x = lerp(z.x, z.targetX, dt * 1.6)
          if (z.timer <= 0) {
            z.phase = 'wander'; z.timer = 3 + Math.random() * 3
            z.vx    = (Math.random() < 0.5 ? 1 : -1) * (10 + Math.random() * 14)
          }
        }
      }
    }

    function draw() {
      const s  = stateRef.current!
      const ch = s.char

      // 1. Sky
      drawSky(ctx, time)
      // 2. Side trees (exterior, flanking house)
      drawSideTrees(ctx, time)
      // 3. Exterior ground (beyond fence)
      drawExteriorGround(ctx)
      // 4. Yard ground + props (inside fence)
      drawYard(ctx, s.traps)
      // 5. House facade
      drawHouse(ctx, s.boards)
      // 6. Zombie bodies — drawn after yard/house so heads show above fence
      for (const z of s.zombies) drawZombieBody(ctx, z, time)
      // 7. Fence (overlaps lower zombie bodies)
      drawFence(ctx, time)
      // 8. Zombie reach/push arms (drawn after fence, appear in front)
      for (const z of s.zombies) drawZombieReachArm(ctx, z, time)
      // 9. Character
      const av = avatarRef.current
      const avColors: AvatarColors = {
        skin:      SKIN_COLORS[av.skinTone]  ?? '#f2c89a',
        hair:      HAIR_COLORS[av.hairColor] ?? '#3e2208',
        hairStyle: av.hairStyle ?? 'short',
        jacket:    av.jacketColor,
        pants:     av.pantsColor,
        gender:    av.gender,
      }
      drawCharacter(
        ctx, ch.x, ch.y, ch.scale, ch.dir, ch.phase,
        ch.choreType,
        ch.phase === 'chore' ? ch.choreT : 0,
        time, ch.winId, avColors,
      )
      // 10. Sync companion overlay with canvas character position
      const compEl = companionElRef.current
      if (compEl && companionRef.current) {
        // Pet trails slightly behind character
        const petOffsetX = ch.dir * -70
        const petX = clamp(ch.x + petOffsetX, 80, W - 80)
        compEl.style.left   = `${(petX / W) * 100}%`
        compEl.style.bottom = `${((H - ch.y) / H) * 100}%`
      }
      // 11. Foreground vignette
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
    <div style={{ width: '100%', background: '#040210', aspectRatio: '16/9', position: 'relative', overflow: 'hidden' }}>
      <canvas
        ref={cvRef}
        width={W}
        height={H}
        style={{ width: '100%', height: '100%', display: 'block', objectFit: 'contain' }}
      />
      {companion && (() => {
        const anim = COMPANION_ANIM[companion.type.toLowerCase()] ?? DEFAULT_ANIM
        return (
          <div
            ref={companionElRef}
            style={{
              position: 'absolute',
              bottom: '38%',
              left: '8%',
              pointerEvents: 'none',
              filter: 'drop-shadow(0 2px 6px rgba(0,0,0,0.8))',
              willChange: 'left, bottom',
            }}
          >
            <motion.div animate={anim.animate} transition={anim.transition}>
              <PetSprite type={companion.type} color={companion.color} size={48} />
            </motion.div>
          </div>
        )
      })()}
    </div>
  )
}
