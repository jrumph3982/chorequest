'use client'

import { useEffect, useRef } from 'react'
import type { ZombieThreat } from '@/lib/game/base'

interface BaseStateShape {
  doorLevel: number
  barricadeLevel: number
  fenceLevel: number
  lightLevel: number
  doorDamage: number
  barricadeDamage: number
  fenceDamage: number
  lightDamage: number
}

interface Props {
  baseState: BaseStateShape
  threat: ZombieThreat
  lastNightOverrun?: boolean
  equippedCompanionTypes?: string[]
  activeEventTypes?: string[]
}

const ZOMBIE_COUNTS: Record<ZombieThreat, number> = {
  none: 0,
  low: 1,
  moderate: 2,
  high: 4,
  critical: 6,
}

function drawDog(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Dog walks left-right in the left yard between lamp post and house
  const ground = h * 0.72
  const range = w * 0.14
  const baseX = w * 0.13
  const x = baseX + range * 0.5 + range * 0.5 * Math.sin(tick * 0.02)
  const y = ground - 2

  ctx.save()
  // Body
  ctx.fillStyle = '#8b6914'
  ctx.fillRect(x - 10, y - 10, 20, 10)
  // Head
  ctx.fillRect(x + 8, y - 15, 10, 10)
  // Ear
  ctx.fillStyle = '#6b4f10'
  ctx.fillRect(x + 8, y - 17, 5, 6)
  // Tail (wagging)
  const tailSway = Math.sin(tick * 0.15) * 4
  ctx.strokeStyle = '#8b6914'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x - 10, y - 6)
  ctx.quadraticCurveTo(x - 18, y - 12 + tailSway, x - 22, y - 18 + tailSway)
  ctx.stroke()
  // Legs (animate walk)
  ctx.fillStyle = '#8b6914'
  const legPhase = tick * 0.06
  ctx.fillRect(x - 7, y, 3, 6 + Math.round(Math.sin(legPhase)) * 2)
  ctx.fillRect(x - 2, y, 3, 6 + Math.round(Math.sin(legPhase + Math.PI)) * 2)
  ctx.fillRect(x + 5, y, 3, 6 + Math.round(Math.sin(legPhase + 0.5)) * 2)
  ctx.fillRect(x + 10, y, 3, 6 + Math.round(Math.sin(legPhase + Math.PI + 0.5)) * 2)
  ctx.restore()
}

function drawCat(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Cat sits near the front door on the porch
  const ground = h * 0.72
  const houseX = w * 0.28
  const houseW = w * 0.44
  const doorX = houseX + (houseW - houseW * 0.18) / 2 - 18
  const x = doorX
  const y = ground - 2

  ctx.save()
  // Body (sitting, rounded)
  ctx.fillStyle = '#a0a0b0'
  ctx.fillRect(x - 6, y - 16, 12, 16)
  // Head
  ctx.fillStyle = '#b0b0c0'
  ctx.beginPath()
  ctx.arc(x, y - 20, 7, 0, Math.PI * 2)
  ctx.fill()
  // Ears
  ctx.fillStyle = '#a0a0b0'
  ctx.beginPath()
  ctx.moveTo(x - 6, y - 25)
  ctx.lineTo(x - 10, y - 31)
  ctx.lineTo(x - 2, y - 27)
  ctx.closePath()
  ctx.fill()
  ctx.beginPath()
  ctx.moveTo(x + 6, y - 25)
  ctx.lineTo(x + 10, y - 31)
  ctx.lineTo(x + 2, y - 27)
  ctx.closePath()
  ctx.fill()
  // Eyes (blinking)
  const blinkOpen = (tick % 120) > 5
  ctx.fillStyle = '#40ff80'
  if (blinkOpen) {
    ctx.fillRect(x - 4, y - 22, 2, 3)
    ctx.fillRect(x + 2, y - 22, 2, 3)
  } else {
    ctx.fillRect(x - 4, y - 21, 2, 1)
    ctx.fillRect(x + 2, y - 21, 2, 1)
  }
  // Tail (curling)
  const tailCurl = Math.sin(tick * 0.04) * 6
  ctx.strokeStyle = '#a0a0b0'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(x + 6, y)
  ctx.quadraticCurveTo(x + 18, y - 4 + tailCurl, x + 14, y - 12 + tailCurl)
  ctx.stroke()
  ctx.restore()
}

function drawDrone(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Drone hovers above the house
  const houseX = w * 0.28
  const houseW = w * 0.44
  const houseH = h * 0.42
  const ground = h * 0.72
  const houseY = ground - houseH
  const x = houseX + houseW * 0.65
  const bob = Math.sin(tick * 0.05) * 4
  const y = houseY - 20 + bob

  ctx.save()
  // Body
  ctx.fillStyle = '#4a8aff'
  ctx.fillRect(x - 8, y - 5, 16, 10)
  // Arms
  ctx.fillStyle = '#3a6acc'
  ctx.fillRect(x - 18, y - 2, 10, 4)
  ctx.fillRect(x + 8, y - 2, 10, 4)
  // Propellers (spinning)
  const spinAngle = tick * 0.3
  for (const [px, py] of [[x - 18, y], [x + 18, y]] as [number, number][]) {
    ctx.save()
    ctx.translate(px, py)
    ctx.rotate(spinAngle)
    ctx.fillStyle = 'rgba(200, 220, 255, 0.7)'
    ctx.fillRect(-7, -1, 14, 2)
    ctx.rotate(Math.PI / 2)
    ctx.fillRect(-7, -1, 14, 2)
    ctx.restore()
  }
  // Camera lens
  ctx.fillStyle = '#1a3060'
  ctx.beginPath()
  ctx.arc(x, y + 2, 3, 0, Math.PI * 2)
  ctx.fill()
  // Blink light
  const blink = (tick % 40) < 20
  ctx.fillStyle = blink ? '#ff4444' : '#660000'
  ctx.beginPath()
  ctx.arc(x - 5, y - 4, 2, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
}

function drawRaccoon(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Raccoon scurries near the right fence area (avoiding zombie zone)
  const ground = h * 0.72
  const fenceX = w * 0.18
  const range = w * 0.1
  const x = fenceX + range * 0.5 + range * 0.5 * Math.sin(tick * 0.035 + 1.5)
  const y = ground - 2

  ctx.save()
  // Body (low to ground)
  ctx.fillStyle = '#808090'
  ctx.fillRect(x - 9, y - 8, 18, 8)
  // Head
  ctx.fillStyle = '#909098'
  ctx.fillRect(x + 6, y - 12, 10, 9)
  // Mask (dark stripe across eyes)
  ctx.fillStyle = '#303030'
  ctx.fillRect(x + 7, y - 11, 8, 3)
  // Ears
  ctx.fillStyle = '#808090'
  ctx.fillRect(x + 7, y - 14, 3, 3)
  ctx.fillRect(x + 13, y - 14, 3, 3)
  // Striped tail
  const tailSway = Math.sin(tick * 0.08 + 2) * 5
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = i % 2 === 0 ? '#707080' : '#c0c0b0'
    ctx.fillRect(x - 9 - (i + 1) * 5, y - 5 + tailSway * (i * 0.3), 5, 4)
  }
  // Legs (quick scurry)
  ctx.fillStyle = '#707080'
  const legPhase = tick * 0.1
  ctx.fillRect(x - 5, y, 3, 4 + Math.round(Math.sin(legPhase)) * 2)
  ctx.fillRect(x + 2, y, 3, 4 + Math.round(Math.sin(legPhase + Math.PI)) * 2)
  ctx.restore()
}

function drawZombieSwarmEffect(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  const ground = h * 0.72
  // Extra horde silhouettes crowding far right background
  ctx.fillStyle = '#1a2e10'
  for (let z = 0; z < 9; z++) {
    const zx = w * (0.63 + z * 0.038) + Math.sin(tick * 0.025 + z * 2.1) * 4
    const zy = ground - h * 0.22 + (z % 3) * h * 0.025
    ctx.fillRect(zx - 4, zy - 11, 8, 11)
    ctx.fillRect(zx - 3, zy - 17, 6, 6)
    const eyeAlpha = 0.5 + 0.5 * Math.sin(tick * 0.07 + z)
    ctx.fillStyle = `rgba(220, 30, 10, ${eyeAlpha})`
    ctx.fillRect(zx - 2, zy - 13, 2, 2)
    ctx.fillRect(zx + 1, zy - 13, 2, 2)
    ctx.fillStyle = '#1a2e10'
  }
  // Pulsing blood-red haze from right edge
  const grd = ctx.createRadialGradient(w, ground * 0.65, 0, w, ground * 0.65, w * 0.55)
  grd.addColorStop(0, `rgba(160, 0, 0, ${0.1 + 0.06 * Math.sin(tick * 0.04)})`)
  grd.addColorStop(1, 'transparent')
  ctx.fillStyle = grd
  ctx.fillRect(0, 0, w, h)
}

function drawAlienInvasionEffect(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  const ground = h * 0.72
  const ux = w * 0.22
  const bob = Math.sin(tick * 0.04) * 5
  const uy = h * 0.1 + bob

  // Green sky tint
  ctx.fillStyle = `rgba(0, 80, 20, ${0.05 + 0.03 * Math.sin(tick * 0.03)})`
  ctx.fillRect(0, 0, w, ground)

  // UFO body
  ctx.fillStyle = '#9090b8'
  ctx.beginPath()
  ctx.ellipse(ux, uy, 32, 10, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.fillStyle = '#b8b8d8'
  ctx.beginPath()
  ctx.ellipse(ux, uy - 5, 16, 9, 0, 0, Math.PI * 2)
  ctx.fill()

  // Rotating lights
  for (let i = -2; i <= 2; i++) {
    const blink = ((tick + i * 8) % 28) < 14
    ctx.fillStyle = blink ? '#00ff80' : '#004422'
    ctx.beginPath()
    ctx.arc(ux + i * 10, uy + 5, 2.5, 0, Math.PI * 2)
    ctx.fill()
  }

  // Green tractor beam
  const beamAlpha = 0.07 + 0.05 * Math.sin(tick * 0.06)
  const beamGrad = ctx.createLinearGradient(ux, uy + 10, ux, ground)
  beamGrad.addColorStop(0, `rgba(0, 255, 80, ${beamAlpha})`)
  beamGrad.addColorStop(1, 'transparent')
  ctx.fillStyle = beamGrad
  ctx.beginPath()
  ctx.moveTo(ux - 6, uy + 10)
  ctx.lineTo(ux - 34, ground)
  ctx.lineTo(ux + 34, ground)
  ctx.lineTo(ux + 6, uy + 10)
  ctx.closePath()
  ctx.fill()
}

function drawWinterStormEffect(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  // Blue-grey cold overlay
  ctx.fillStyle = `rgba(160, 190, 240, ${0.07 + 0.03 * Math.sin(tick * 0.02)})`
  ctx.fillRect(0, 0, w, h)

  // Falling snowflakes
  ctx.fillStyle = 'rgba(225, 240, 255, 0.85)'
  for (let i = 0; i < 30; i++) {
    const speed = 0.35 + (i % 5) * 0.18
    const col = (i * 41 + 7) % 100
    const row = (i * 19 + 3) % 100
    const x = (w * col / 100 + tick * speed * 0.25) % w
    const y = (h * row / 100 + tick * speed) % h
    const r = 1 + (i % 3) * 0.5
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function drawRobotUprisingEffect(ctx: CanvasRenderingContext2D, w: number, h: number, tick: number) {
  const ground = h * 0.72
  const rx = w * 0.86 + Math.sin(tick * 0.03) * 3
  const ry = ground

  ctx.save()
  // Orange glow
  const grd = ctx.createRadialGradient(rx, ry - 22, 0, rx, ry - 22, 42)
  grd.addColorStop(0, `rgba(255, 110, 0, ${0.09 + 0.05 * Math.sin(tick * 0.07)})`)
  grd.addColorStop(1, 'transparent')
  ctx.fillStyle = grd
  ctx.fillRect(rx - 45, ry - 65, 90, 70)

  // Robot body
  ctx.fillStyle = '#b05810'
  ctx.fillRect(rx - 7, ry - 24, 14, 18)
  // Head
  ctx.fillRect(rx - 5, ry - 36, 10, 12)
  // Eye visor
  const visorAlpha = 0.55 + 0.45 * Math.sin(tick * 0.12)
  ctx.fillStyle = `rgba(255, 150, 0, ${visorAlpha})`
  ctx.fillRect(rx - 4, ry - 32, 8, 3)
  // Arms
  ctx.fillStyle = '#904010'
  ctx.fillRect(rx - 15, ry - 22, 8, 3)
  ctx.fillRect(rx + 7, ry - 22, 8, 3)
  // Legs (march)
  const march = Math.sin(tick * 0.09)
  ctx.fillStyle = '#b05810'
  ctx.fillRect(rx - 5, ry - 6, 4, 8 + Math.round(march) * 2)
  ctx.fillRect(rx + 1, ry - 6, 4, 8 - Math.round(march) * 2)
  ctx.restore()
}

function drawScene(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  base: BaseStateShape,
  threat: ZombieThreat,
  tick: number,
  overrun: boolean,
  companions: string[],
  activeEventTypes: string[],
) {
  ctx.clearRect(0, 0, w, h)

  const ground = h * 0.72
  const houseX = w * 0.28
  const houseW = w * 0.44
  const houseH = h * 0.42
  const houseY = ground - houseH

  // ── Sky gradient ──────────────────────────────────────────────────────────
  const sky = ctx.createLinearGradient(0, 0, 0, ground)
  sky.addColorStop(0, '#0a0514')
  sky.addColorStop(1, '#1a0a2e')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, w, ground)

  // ── Stars ─────────────────────────────────────────────────────────────────
  ctx.fillStyle = 'rgba(255,255,255,0.6)'
  const stars = [
    [0.05, 0.08], [0.15, 0.05], [0.25, 0.12], [0.45, 0.04],
    [0.55, 0.09], [0.7, 0.06], [0.82, 0.11], [0.9, 0.03],
    [0.08, 0.2], [0.35, 0.15], [0.6, 0.18], [0.78, 0.2],
  ]
  stars.forEach(([sx, sy]) => {
    const alpha = 0.4 + 0.6 * Math.abs(Math.sin(tick * 0.02 + sx * 10))
    ctx.globalAlpha = alpha
    ctx.beginPath()
    ctx.arc(sx * w, sy * h, 1, 0, Math.PI * 2)
    ctx.fill()
  })
  ctx.globalAlpha = 1

  // ── Moon ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#e8e0c8'
  ctx.beginPath()
  ctx.arc(w * 0.88, h * 0.1, h * 0.055, 0, Math.PI * 2)
  ctx.fill()

  // ── Ground ────────────────────────────────────────────────────────────────
  const grassGrad = ctx.createLinearGradient(0, ground, 0, h)
  grassGrad.addColorStop(0, '#0d1f0d')
  grassGrad.addColorStop(1, '#060f06')
  ctx.fillStyle = grassGrad
  ctx.fillRect(0, ground, w, h - ground)

  // ── Fence ─────────────────────────────────────────────────────────────────
  const fenceDmg = base.fenceDamage
  const fenceColor = fenceDmg > 70 ? '#4a3010' : fenceDmg > 40 ? '#6b4a18' : '#8b6520'
  ctx.strokeStyle = fenceColor
  ctx.lineWidth = 2

  const fenceY = ground - h * 0.06
  const postCount = Math.floor(w / 22)
  for (let i = 0; i < postCount; i++) {
    // Skip some posts randomly based on damage (broken fence)
    const broken = fenceDmg > 50 && ((i * 7 + 3) % 5 === 0)
    if (broken) continue
    const fx = i * 22 + 11
    ctx.beginPath()
    ctx.moveTo(fx, fenceY - h * 0.035)
    ctx.lineTo(fx, fenceY + h * 0.04)
    ctx.stroke()

    // Picket point
    ctx.beginPath()
    ctx.moveTo(fx, fenceY - h * 0.035)
    ctx.lineTo(fx - 4, fenceY - h * 0.015)
    ctx.lineTo(fx + 4, fenceY - h * 0.015)
    ctx.closePath()
    ctx.fillStyle = fenceColor
    ctx.fill()
  }
  // Fence rail
  ctx.beginPath()
  ctx.moveTo(0, fenceY)
  ctx.lineTo(w, fenceY)
  ctx.stroke()

  // Fence damage cracks
  if (fenceDmg > 40) {
    ctx.strokeStyle = '#2a1a08'
    ctx.lineWidth = 1
    for (let i = 0; i < 3; i++) {
      const cx = w * (0.2 + i * 0.3)
      ctx.beginPath()
      ctx.moveTo(cx, fenceY - 5)
      ctx.lineTo(cx + 4, fenceY + 4)
      ctx.stroke()
    }
  }

  // ── House body ────────────────────────────────────────────────────────────
  ctx.fillStyle = '#1e1e2e'
  ctx.strokeStyle = '#3a3a5c'
  ctx.lineWidth = 2
  ctx.fillRect(houseX, houseY, houseW, houseH)
  ctx.strokeRect(houseX, houseY, houseW, houseH)

  // ── Roof ──────────────────────────────────────────────────────────────────
  ctx.fillStyle = '#141428'
  ctx.strokeStyle = '#3a3a5c'
  ctx.lineWidth = 2
  ctx.beginPath()
  ctx.moveTo(houseX - houseW * 0.08, houseY)
  ctx.lineTo(houseX + houseW / 2, houseY - houseH * 0.38)
  ctx.lineTo(houseX + houseW + houseW * 0.08, houseY)
  ctx.closePath()
  ctx.fill()
  ctx.stroke()

  // ── Windows ───────────────────────────────────────────────────────────────
  const winY = houseY + houseH * 0.2
  const winH = houseH * 0.25
  const winW = houseW * 0.15
  const windowColor = base.lightDamage > 80 ? '#1a1a2a' : '#3a2a08'
  const windowGlow = base.lightDamage > 80 ? null : '#c8900a'

  for (const wx of [houseX + houseW * 0.12, houseX + houseW * 0.73]) {
    ctx.fillStyle = windowColor
    ctx.fillRect(wx, winY, winW, winH)
    ctx.strokeStyle = '#5a5a8a'
    ctx.lineWidth = 1.5
    ctx.strokeRect(wx, winY, winW, winH)
    // Cross pane
    ctx.beginPath()
    ctx.moveTo(wx + winW / 2, winY)
    ctx.lineTo(wx + winW / 2, winY + winH)
    ctx.moveTo(wx, winY + winH / 2)
    ctx.lineTo(wx + winW, winY + winH / 2)
    ctx.stroke()
    // Window glow
    if (windowGlow) {
      const flickerAlpha =
        base.lightDamage > 60
          ? Math.max(0.1, 0.5 + 0.4 * Math.sin(tick * 0.3 + wx))
          : 0.7
      ctx.globalAlpha = flickerAlpha
      ctx.fillStyle = windowGlow
      ctx.fillRect(wx + 2, winY + 2, winW - 4, winH - 4)
      ctx.globalAlpha = 1
    }
  }

  // ── Door ──────────────────────────────────────────────────────────────────
  const doorW = houseW * 0.18
  const doorH = houseH * 0.38
  const doorX = houseX + (houseW - doorW) / 2
  const doorY = houseY + houseH - doorH
  const doorColor = base.doorDamage > 60 ? '#3a1a08' : '#5c3010'

  ctx.fillStyle = doorColor
  ctx.fillRect(doorX, doorY, doorW, doorH)
  ctx.strokeStyle = '#8a5020'
  ctx.lineWidth = 1.5
  ctx.strokeRect(doorX, doorY, doorW, doorH)

  // Door knob
  ctx.fillStyle = '#c8a040'
  ctx.beginPath()
  ctx.arc(doorX + doorW * 0.82, doorY + doorH * 0.55, 2.5, 0, Math.PI * 2)
  ctx.fill()

  // Door damage X
  if (base.doorDamage > 60) {
    ctx.strokeStyle = 'rgba(200, 50, 20, 0.7)'
    ctx.lineWidth = 2
    ctx.beginPath()
    ctx.moveTo(doorX + 4, doorY + 4)
    ctx.lineTo(doorX + doorW - 4, doorY + doorH - 4)
    ctx.moveTo(doorX + doorW - 4, doorY + 4)
    ctx.lineTo(doorX + 4, doorY + doorH - 4)
    ctx.stroke()
  }

  // ── Barricades ────────────────────────────────────────────────────────────
  const bDmg = base.barricadeDamage
  const boardColor = bDmg > 70 ? '#2a1a08' : bDmg > 40 ? '#4a2e10' : '#6b4520'
  const boardCount = 5

  for (let side = 0; side < 2; side++) {
    const bx = side === 0 ? houseX - w * 0.12 : houseX + houseW
    const bw = w * 0.11

    for (let b = 0; b < boardCount; b++) {
      const broken = bDmg > 50 && b === 2
      const tilt = broken ? (side === 0 ? -0.25 : 0.25) : 0
      const bxOff = bx + (b / boardCount) * bw
      const by1 = houseY + houseH * 0.15 + b * 3
      const by2 = ground

      ctx.save()
      ctx.translate(bxOff + bw / boardCount / 2, (by1 + by2) / 2)
      ctx.rotate(tilt)
      ctx.fillStyle = boardColor
      ctx.fillRect(-(bw / boardCount / 2) + 1, -(by2 - by1) / 2, bw / boardCount - 2, by2 - by1)
      ctx.strokeStyle = '#1a0e04'
      ctx.lineWidth = 1
      ctx.strokeRect(-(bw / boardCount / 2) + 1, -(by2 - by1) / 2, bw / boardCount - 2, by2 - by1)
      ctx.restore()
    }

    // Barricade cracks
    if (bDmg > 40) {
      ctx.strokeStyle = 'rgba(80, 40, 10, 0.8)'
      ctx.lineWidth = 1
      ctx.beginPath()
      ctx.moveTo(bx + bw * 0.4, houseY + houseH * 0.3)
      ctx.lineTo(bx + bw * 0.55, houseY + houseH * 0.5)
      ctx.lineTo(bx + bw * 0.45, houseY + houseH * 0.7)
      ctx.stroke()
    }
  }

  // ── Lamp posts ────────────────────────────────────────────────────────────
  const lampPositions = [w * 0.12, w * 0.88]
  lampPositions.forEach((lx, li) => {
    const postH = h * 0.22
    const ly = ground - postH

    // Post
    ctx.fillStyle = '#3a3a4a'
    ctx.fillRect(lx - 2, ly, 4, postH)

    // Lamp head
    ctx.fillStyle = '#4a4a5a'
    ctx.fillRect(lx - 8, ly - 6, 16, 8)

    const lDmg = base.lightDamage
    if (lDmg < 90) {
      const flickerSpeed = lDmg > 60 ? 0.4 : 0.05
      const flickerAlpha =
        lDmg > 60
          ? Math.max(0.15, 0.6 + 0.4 * Math.sin(tick * flickerSpeed + li * 2.1))
          : 0.85

      // Glow halo
      ctx.globalAlpha = flickerAlpha * 0.3
      const grd = ctx.createRadialGradient(lx, ly - 2, 0, lx, ly - 2, 40)
      grd.addColorStop(0, '#ffd060')
      grd.addColorStop(1, 'transparent')
      ctx.fillStyle = grd
      ctx.beginPath()
      ctx.arc(lx, ly - 2, 40, 0, Math.PI * 2)
      ctx.fill()

      // Lamp bulb
      ctx.globalAlpha = flickerAlpha
      ctx.fillStyle = '#ffd060'
      ctx.beginPath()
      ctx.arc(lx, ly, 4, 0, Math.PI * 2)
      ctx.fill()
      ctx.globalAlpha = 1
    } else {
      // Dark / out
      ctx.fillStyle = '#2a2a3a'
      ctx.beginPath()
      ctx.arc(lx, ly, 4, 0, Math.PI * 2)
      ctx.fill()
    }
  })

  // ── Zombies ───────────────────────────────────────────────────────────────
  const zombieCount = ZOMBIE_COUNTS[threat]
  for (let z = 0; z < zombieCount; z++) {
    const zx = w * (0.72 + z * 0.06) + (z % 2 === 0 ? 0 : w * 0.02)
    const sway = Math.sin(tick * 0.05 + z * 1.3) * 3
    const zy = ground - h * 0.18 + (z % 2) * h * 0.02

    ctx.save()
    ctx.translate(zx + sway, zy)

    // Body
    ctx.fillStyle = z % 3 === 0 ? '#2a3a18' : '#1e2a14'
    ctx.fillRect(-7, 0, 14, 20)

    // Head
    ctx.fillStyle = '#3a4a28'
    ctx.fillRect(-6, -14, 12, 14)

    // Eyes (red glowing)
    ctx.fillStyle = `rgba(200, 30, 10, ${0.6 + 0.4 * Math.sin(tick * 0.08 + z)})`
    ctx.fillRect(-4, -10, 3, 3)
    ctx.fillRect(1, -10, 3, 3)

    // Arms (outstretched)
    ctx.fillStyle = '#2a3a18'
    ctx.save()
    ctx.translate(-7, 4)
    ctx.rotate(-0.4 + Math.sin(tick * 0.05 + z) * 0.15)
    ctx.fillRect(-10, -2, 10, 4)
    ctx.restore()

    // Legs
    ctx.fillRect(-5, 20, 4, 12)
    ctx.fillRect(1, 20, 4, 12)

    ctx.restore()
  }

  // ── Companions ────────────────────────────────────────────────────────────
  if (companions.includes('dog')) drawDog(ctx, w, h, tick)
  if (companions.includes('cat')) drawCat(ctx, w, h, tick)
  if (companions.includes('drone')) drawDrone(ctx, w, h, tick)
  if (companions.includes('raccoon')) drawRaccoon(ctx, w, h, tick)

  // ── Event effects ─────────────────────────────────────────────────────────
  if (activeEventTypes.includes('zombie_swarm')) drawZombieSwarmEffect(ctx, w, h, tick)
  if (activeEventTypes.includes('alien_invasion')) drawAlienInvasionEffect(ctx, w, h, tick)
  if (activeEventTypes.includes('winter_storm')) drawWinterStormEffect(ctx, w, h, tick)
  if (activeEventTypes.includes('robot_uprising')) drawRobotUprisingEffect(ctx, w, h, tick)

  // ── Threat indicator overlay ──────────────────────────────────────────────
  if (threat === 'critical') {
    ctx.fillStyle = `rgba(180, 0, 0, ${0.04 + 0.04 * Math.sin(tick * 0.1)})`
    ctx.fillRect(0, 0, w, h)
  }

  // ── Overrun overlay ───────────────────────────────────────────────────────
  if (overrun) {
    const pulse = 0.18 + 0.12 * Math.abs(Math.sin(tick * 0.06))
    ctx.fillStyle = `rgba(200, 0, 0, ${pulse})`
    ctx.fillRect(0, 0, w, h)

    // "OVERRUN" banner
    const bannerH = h * 0.18
    const bannerY = h / 2 - bannerH / 2
    ctx.fillStyle = `rgba(160, 0, 0, ${0.75 + 0.2 * Math.abs(Math.sin(tick * 0.06))})`
    ctx.fillRect(0, bannerY, w, bannerH)

    ctx.globalAlpha = 1
    ctx.fillStyle = '#ff4444'
    ctx.font = `bold ${Math.round(bannerH * 0.55)}px monospace`
    ctx.textAlign = 'center'
    ctx.textBaseline = 'middle'
    ctx.fillText('⚠ OVERRUN ⚠', w / 2, h / 2)
    ctx.textAlign = 'start'
    ctx.textBaseline = 'alphabetic'
  }
}

export function BaseCanvas({ baseState, threat, lastNightOverrun = false, equippedCompanionTypes = [], activeEventTypes = [] }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef<number>(0)
  const tickRef = useRef(0)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    function resize() {
      if (!canvas) return
      const rect = canvas.parentElement?.getBoundingClientRect()
      canvas.width = rect ? rect.width : 340
      canvas.height = 280
    }
    resize()

    function loop() {
      if (!canvas || !ctx) return
      tickRef.current += 1
      drawScene(ctx, canvas.width, canvas.height, baseState, threat, tickRef.current, lastNightOverrun, equippedCompanionTypes, activeEventTypes)
      rafRef.current = requestAnimationFrame(loop)
    }
    rafRef.current = requestAnimationFrame(loop)

    window.addEventListener('resize', resize)
    return () => {
      cancelAnimationFrame(rafRef.current)
      window.removeEventListener('resize', resize)
    }
  }, [baseState, threat, lastNightOverrun, equippedCompanionTypes, activeEventTypes])

  return (
    <canvas
      ref={canvasRef}
      className="w-full rounded-xl border border-gray-800"
      style={{ display: 'block', height: 280 }}
    />
  )
}
