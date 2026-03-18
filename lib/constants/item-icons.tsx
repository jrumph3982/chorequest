'use client'
import React from 'react'

// ── CAP icons ──────────────────────────────────────────────────────────────────

function StarterCapIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Crown */}
      <ellipse cx="32" cy="26" rx="22" ry="18" fill="#3a2e7a" />
      {/* Brim */}
      <rect x="4" y="38" width="56" height="8" rx="4" fill="#2a1e6a" />
      {/* Button */}
      <circle cx="32" cy="10" r="4" fill="#2a1e6a" />
      {/* Band */}
      <rect x="12" y="35" width="40" height="3" fill="#fff" fillOpacity="0.15" />
      {/* Snap */}
      <rect x="22" y="46" width="20" height="4" rx="2" fill="#2a2a2a" />
    </svg>
  )
}

function BaseballCapIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Crown */}
      <ellipse cx="32" cy="26" rx="22" ry="18" fill="#cc2020" />
      {/* Brim */}
      <rect x="4" y="38" width="56" height="8" rx="4" fill="#1a1a1a" />
      {/* Button top */}
      <circle cx="32" cy="10" r="4" fill="#aa1010" />
      {/* Panel seams */}
      <path d="M32,10 L32,38" stroke="#aa1010" strokeWidth="1" fill="none" opacity="0.5" />
      <path d="M32,10 L14,36" stroke="#aa1010" strokeWidth="1" fill="none" opacity="0.4" />
      <path d="M32,10 L50,36" stroke="#aa1010" strokeWidth="1" fill="none" opacity="0.4" />
      {/* NY letters */}
      <rect x="27" y="24" width="3" height="8" fill="#fff" />
      <rect x="30" y="24" width="6" height="3" fill="#fff" />
      <rect x="30" y="29" width="3" height="3" fill="#fff" />
      <rect x="36" y="24" width="3" height="8" fill="#fff" />
    </svg>
  )
}

function TacticalHelmetIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Main shell */}
      <ellipse cx="32" cy="30" rx="24" ry="20" fill="#2a3a1a" />
      {/* Side coverage left */}
      <ellipse cx="11" cy="32" rx="5" ry="9" fill="#2a3a1a" />
      {/* Side coverage right */}
      <ellipse cx="53" cy="32" rx="5" ry="9" fill="#2a3a1a" />
      {/* Brim */}
      <rect x="8" y="44" width="48" height="7" rx="3" fill="#1a2a0a" />
      {/* NVG mount stub */}
      <rect x="22" y="13" width="20" height="7" rx="2" fill="#1a2a0a" />
      {/* Cam strap */}
      <path d="M12,22 Q32,18 52,22" stroke="#3a4a2a" strokeWidth="3" fill="none" />
    </svg>
  )
}

function SurvivorBeanieIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <path d="M14,44 Q10,20 32,14 Q54,20 50,44 Z" fill="#4a2a1a" />
      {/* Pom */}
      <circle cx="32" cy="12" r="10" fill="#6a3a2a" />
      <circle cx="25" cy="8" r="4" fill="#6a3a2a" />
      <circle cx="39" cy="8" r="4" fill="#6a3a2a" />
      <circle cx="28" cy="4" r="4" fill="#6a3a2a" />
      <circle cx="36" cy="4" r="4" fill="#6a3a2a" />
      {/* Rib stripes */}
      <rect x="14" y="36" width="36" height="2" rx="1" fill="#3a1a0a" />
      <rect x="14" y="39" width="36" height="2" rx="1" fill="#3a1a0a" />
      <rect x="14" y="42" width="36" height="2" rx="1" fill="#3a1a0a" />
    </svg>
  )
}

function FlashlightHelmetIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Combat helmet */}
      <ellipse cx="32" cy="30" rx="24" ry="20" fill="#2a3a1a" />
      <ellipse cx="11" cy="32" rx="5" ry="9" fill="#2a3a1a" />
      <ellipse cx="53" cy="32" rx="5" ry="9" fill="#2a3a1a" />
      <rect x="8" y="44" width="48" height="7" rx="3" fill="#1a2a0a" />
      {/* Flashlight mount */}
      <rect x="24" y="16" width="16" height="8" rx="3" fill="#4a4a2a" />
      {/* Lens glow */}
      <circle cx="32" cy="20" r="4" fill="#f5d073" fillOpacity="0.9" />
      <circle cx="32" cy="20" r="2" fill="#fff" fillOpacity="0.5" />
    </svg>
  )
}

function SurvivorBandanaIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Main bandana shape */}
      <path d="M8,20 Q32,36 56,20 L56,44 Q32,52 8,44 Z" fill="#cc2020" />
      {/* Top fold edge */}
      <path d="M8,20 Q32,36 56,20 L56,24 Q32,40 8,24 Z" fill="#aa1010" fillOpacity="0.6" />
      {/* Knot */}
      <circle cx="32" cy="38" r="6" fill="#aa1010" />
      {/* Pattern dots */}
      <circle cx="18" cy="32" r="2" fill="#fff" fillOpacity="0.15" />
      <circle cx="28" cy="36" r="1.5" fill="#fff" fillOpacity="0.15" />
      <circle cx="44" cy="30" r="2" fill="#fff" fillOpacity="0.15" />
      <circle cx="38" cy="38" r="1.5" fill="#fff" fillOpacity="0.15" />
    </svg>
  )
}

// ── JACKET icons ───────────────────────────────────────────────────────────────

function StarterJacketIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Hood */}
      <path d="M10,20 Q10,6 32,4 Q54,6 54,20" fill="#1a4a0a" />
      {/* Body */}
      <rect x="10" y="20" width="44" height="38" rx="6" fill="#2a5a1a" />
      {/* Zipper */}
      <rect x="30" y="20" width="4" height="38" fill="#888" fillOpacity="0.5" />
      {/* Left pocket */}
      <rect x="12" y="30" width="10" height="8" rx="2" fill="none" stroke="#3a6a2a" strokeWidth="1.5" />
      {/* Right pocket */}
      <rect x="42" y="30" width="10" height="8" rx="2" fill="none" stroke="#3a6a2a" strokeWidth="1.5" />
      {/* Left cuff */}
      <rect x="6" y="46" width="8" height="7" rx="3" fill="#1a4a0a" />
      {/* Right cuff */}
      <rect x="50" y="46" width="8" height="7" rx="3" fill="#1a4a0a" />
    </svg>
  )
}

function TacticalJacketIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="10" y="20" width="44" height="38" rx="4" fill="#3a4a1a" />
      {/* Collar */}
      <rect x="26" y="17" width="12" height="6" rx="2" fill="#2a3a0a" />
      {/* Left chest pocket */}
      <rect x="14" y="26" width="12" height="9" rx="2" fill="#2a3a0a" />
      <rect x="14" y="26" width="12" height="3" rx="1" fill="#1a2a08" />
      {/* Right chest pocket */}
      <rect x="38" y="26" width="12" height="9" rx="2" fill="#2a3a0a" />
      <rect x="38" y="26" width="12" height="3" rx="1" fill="#1a2a08" />
      {/* Shoulder patches left */}
      <rect x="10" y="22" width="12" height="6" rx="1" fill="#2a3a0a" />
      {/* Shoulder patches right */}
      <rect x="42" y="22" width="12" height="6" rx="1" fill="#2a3a0a" />
    </svg>
  )
}

function HazmatJacketIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="10" y="20" width="44" height="38" rx="4" fill="#c8a820" />
      {/* Collar ring */}
      <ellipse cx="32" cy="20" rx="10" ry="5" fill="#8a7a10" />
      {/* Black chest stripe */}
      <rect x="10" y="30" width="44" height="8" fill="#1a1a1a" fillOpacity="0.7" transform="rotate(-15,32,34)" />
      {/* Left arm band */}
      <rect x="6" y="32" width="8" height="6" fill="#8a7a10" />
      {/* Right arm band */}
      <rect x="50" y="32" width="8" height="6" fill="#8a7a10" />
      {/* Bio symbol on chest */}
      <circle cx="32" cy="40" r="5" fill="none" stroke="#1a1a1a" strokeWidth="2" />
      <path d="M32,35 A5,5 0 0,1 37,40" stroke="#1a1a1a" strokeWidth="2" fill="none" />
      <path d="M32,45 A5,5 0 0,1 27,40" stroke="#1a1a1a" strokeWidth="2" fill="none" />
    </svg>
  )
}

function LeatherSurvivorJacketIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="10" y="20" width="44" height="38" rx="4" fill="#3a1a08" />
      {/* Left lapel */}
      <polygon points="26,20 20,36 10,36 10,20" fill="#2a1008" />
      {/* Right lapel */}
      <polygon points="38,20 44,36 54,36 54,20" fill="#2a1008" />
      {/* Studs on lapels */}
      <circle cx="22" cy="24" r="2" fill="#c8a820" />
      <circle cx="21" cy="30" r="2" fill="#c8a820" />
      <circle cx="22" cy="36" r="2" fill="#c8a820" />
      <circle cx="42" cy="24" r="2" fill="#c8a820" />
      <circle cx="43" cy="30" r="2" fill="#c8a820" />
      <circle cx="42" cy="36" r="2" fill="#c8a820" />
      {/* Pocket flaps */}
      <rect x="14" y="40" width="10" height="3" rx="1" fill="#2a1008" />
      <rect x="40" y="40" width="10" height="3" rx="1" fill="#2a1008" />
    </svg>
  )
}

function SurvivorJacketIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="10" y="20" width="44" height="38" rx="4" fill="#3a4a2a" />
      {/* Collar */}
      <rect x="26" y="17" width="12" height="6" rx="2" fill="#2a3a1a" />
      {/* Left chest pocket */}
      <rect x="14" y="26" width="12" height="9" rx="2" fill="#2a3a1a" />
      <rect x="14" y="26" width="12" height="3" rx="1" fill="#1a2a0a" />
      {/* Right chest pocket */}
      <rect x="38" y="26" width="12" height="9" rx="2" fill="#2a3a1a" />
      <rect x="38" y="26" width="12" height="3" rx="1" fill="#1a2a0a" />
      {/* Resistance badge */}
      <rect x="26" y="38" width="12" height="8" rx="2" fill="#2a3a1a" />
      <text x="32" y="44" textAnchor="middle" fontSize="5" fill="#4a7a3a" fontWeight="bold" fontFamily="monospace">ZS</text>
    </svg>
  )
}

// ── SNEAKER icons ──────────────────────────────────────────────────────────────

function StarterSneakersIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Upper body */}
      <path d="M10,50 L10,34 Q16,26 30,24 Q48,22 58,34 L58,50 Z" fill="#e8e0d0" />
      {/* Sole side */}
      <rect x="6" y="50" width="52" height="4" rx="2" fill="#c8c8c0" />
      {/* Sole bottom */}
      <rect x="6" y="54" width="52" height="6" rx="4" fill="#e8e8e0" />
      {/* Lace area */}
      <rect x="18" y="34" width="26" height="14" rx="2" fill="#d8d8d0" />
      {/* Laces */}
      <line x1="20" y1="37" x2="42" y2="37" stroke="#aaa" strokeWidth="1.5" />
      <line x1="20" y1="40" x2="42" y2="40" stroke="#aaa" strokeWidth="1.5" />
      <line x1="20" y1="43" x2="42" y2="43" stroke="#aaa" strokeWidth="1.5" />
      {/* Tongue */}
      <rect x="26" y="28" width="12" height="8" rx="2" fill="#e8e8e0" />
      {/* Logo stripe */}
      <path d="M10,46 Q30,40 56,46" stroke="#cc2020" strokeWidth="3" fill="none" />
      {/* Toe cap */}
      <ellipse cx="14" cy="44" rx="8" ry="6" fill="#d8d8d0" />
    </svg>
  )
}

function TrailRunnersIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Upper body */}
      <path d="M10,48 L14,28 Q22,18 36,16 Q52,18 54,30 L54,48 Z" fill="#1a3a5a" />
      {/* Heel */}
      <rect x="6" y="28" width="12" height="20" rx="3" fill="#0a2a4a" />
      {/* Midsole */}
      <rect x="6" y="48" width="52" height="8" rx="3" fill="#cc4020" />
      {/* Bottom sole */}
      <rect x="6" y="54" width="52" height="8" rx="3" fill="#2a2a2a" />
      {/* Reflective stripe */}
      <path d="M20,24 Q40,20 56,30" stroke="#f5f5f5" strokeWidth="1.5" fill="none" fillOpacity="0.8" />
    </svg>
  )
}

function MilitaryBootsIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Boot upper */}
      <rect x="14" y="12" width="36" height="46" rx="4" fill="#2a1a08" />
      {/* Toe cap */}
      <ellipse cx="32" cy="57" rx="18" ry="6" fill="#1a1008" />
      {/* Lace panel */}
      <rect x="22" y="18" width="20" height="24" rx="2" fill="#1a0a04" />
      {/* Lace crosses */}
      <line x1="24" y1="22" x2="40" y2="24" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="40" y1="22" x2="24" y2="24" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="24" y1="26" x2="40" y2="28" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="40" y1="26" x2="24" y2="28" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="24" y1="30" x2="40" y2="32" stroke="#8a7a6a" strokeWidth="1" />
      {/* Ankle hooks left */}
      <circle cx="20" cy="34" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      <circle cx="20" cy="38" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      <circle cx="20" cy="42" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      {/* Ankle hooks right */}
      <circle cx="44" cy="34" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      <circle cx="44" cy="38" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      <circle cx="44" cy="42" r="2" fill="#3a2a18" stroke="#8a7a6a" strokeWidth="1" />
      {/* Thick sole */}
      <rect x="10" y="54" width="44" height="10" rx="3" fill="#1a1008" />
    </svg>
  )
}

function ReinforcedBootsIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Boot upper (shorter) */}
      <rect x="14" y="30" width="36" height="28" rx="4" fill="#2a1a08" />
      {/* Toe cap */}
      <ellipse cx="32" cy="57" rx="18" ry="6" fill="#1a1008" />
      {/* Lace panel */}
      <rect x="22" y="32" width="20" height="16" rx="2" fill="#1a0a04" />
      {/* Laces */}
      <line x1="24" y1="35" x2="40" y2="37" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="40" y1="35" x2="24" y2="37" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="24" y1="39" x2="40" y2="41" stroke="#8a7a6a" strokeWidth="1" />
      <line x1="40" y1="39" x2="24" y2="41" stroke="#8a7a6a" strokeWidth="1" />
      {/* Steel toe highlight */}
      <ellipse cx="22" cy="52" rx="10" ry="5" fill="#3a2a18" />
      {/* Thick sole */}
      <rect x="10" y="54" width="44" height="10" rx="3" fill="#1a1008" />
    </svg>
  )
}

function NeonSpeedKicksIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Upper body */}
      <path d="M10,52 L14,24 Q22,14 38,12 Q52,16 54,30 L54,52 Z" fill="#0a1a3a" />
      {/* Tongue */}
      <rect x="26" y="24" width="12" height="12" rx="2" fill="#0a2a4a" />
      {/* Heel pod */}
      <circle cx="12" cy="48" r="8" fill="#0a2a4a" stroke="#3dff7a" strokeWidth="1" />
      {/* Sole */}
      <rect x="6" y="52" width="52" height="10" rx="3" fill="#0a0a18" />
      {/* LED strip */}
      <rect x="6" y="52" width="52" height="3" rx="1" fill="#3dff7a" />
      {/* LED glow */}
      <rect x="6" y="52" width="52" height="3" rx="1" fill="#3dff7a" fillOpacity="0.4" />
      {/* Swoosh */}
      <path d="M10,44 Q30,36 54,42" stroke="#3dff7a" strokeWidth="3" fill="none" fillOpacity="0.8" />
    </svg>
  )
}

// ── PANTS icons ────────────────────────────────────────────────────────────────

function CargoPantsIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Waistband */}
      <rect x="8" y="14" width="48" height="6" rx="2" fill="#4a3820" />
      {/* Belt loops */}
      <rect x="14" y="12" width="4" height="8" rx="1" fill="#4a3820" />
      <rect x="28" y="12" width="4" height="8" rx="1" fill="#4a3820" />
      <rect x="46" y="12" width="4" height="8" rx="1" fill="#4a3820" />
      {/* Left leg */}
      <rect x="10" y="18" width="18" height="42" rx="3" fill="#6a5030" />
      {/* Right leg */}
      <rect x="36" y="18" width="18" height="42" rx="3" fill="#6a5030" />
      {/* Left cargo pocket */}
      <rect x="5" y="30" width="14" height="14" rx="2" fill="#5a4028" />
      <rect x="5" y="30" width="14" height="4" rx="1" fill="#4a3020" />
      {/* Right cargo pocket */}
      <rect x="45" y="30" width="14" height="14" rx="2" fill="#5a4028" />
      <rect x="45" y="30" width="14" height="4" rx="1" fill="#4a3020" />
      {/* Knee reinforcement left */}
      <rect x="12" y="42" width="14" height="10" rx="2" fill="#5a4028" fillOpacity="0.6" />
      {/* Knee reinforcement right */}
      <rect x="38" y="42" width="14" height="10" rx="2" fill="#5a4028" fillOpacity="0.6" />
    </svg>
  )
}

function TacticalPantsIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Waistband */}
      <rect x="8" y="14" width="48" height="6" rx="2" fill="#1a2a08" />
      {/* Left leg */}
      <rect x="10" y="18" width="18" height="42" rx="3" fill="#2a3a18" />
      {/* Right leg */}
      <rect x="36" y="18" width="18" height="42" rx="3" fill="#2a3a18" />
      {/* Left thigh pocket */}
      <rect x="10" y="22" width="18" height="10" rx="2" fill="#1a2a08" />
      {/* Right thigh pocket */}
      <rect x="36" y="22" width="18" height="10" rx="2" fill="#1a2a08" />
      {/* Left cargo pocket */}
      <rect x="5" y="32" width="12" height="12" rx="2" fill="#1a2a08" />
      {/* Right cargo pocket */}
      <rect x="47" y="32" width="12" height="12" rx="2" fill="#1a2a08" />
      {/* Knee pads left */}
      <ellipse cx="19" cy="48" rx="8" ry="6" fill="#1a2a08" />
      {/* Knee pads right */}
      <ellipse cx="45" cy="48" rx="8" ry="6" fill="#1a2a08" />
    </svg>
  )
}

function HazmatTrousersIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Hip band */}
      <rect x="8" y="18" width="48" height="5" rx="2" fill="#8a7a10" />
      {/* Left leg */}
      <rect x="10" y="18" width="18" height="42" rx="3" fill="#c8a820" />
      {/* Right leg */}
      <rect x="36" y="18" width="18" height="42" rx="3" fill="#c8a820" />
      {/* Ankle bands left */}
      <rect x="10" y="56" width="18" height="5" rx="2" fill="#8a7a10" />
      {/* Ankle bands right */}
      <rect x="36" y="56" width="18" height="5" rx="2" fill="#8a7a10" />
      {/* Zipper lines */}
      <line x1="19" y1="22" x2="19" y2="58" stroke="#aaa" strokeWidth="1" strokeOpacity="0.5" />
      <line x1="45" y1="22" x2="45" y2="58" stroke="#aaa" strokeWidth="1" strokeOpacity="0.5" />
    </svg>
  )
}

function SurvivorCamoPantsIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Side stripes */}
      <rect x="8" y="18" width="4" height="42" fill="#2a3a0a" />
      <rect x="52" y="18" width="4" height="42" fill="#2a3a0a" />
      {/* Left leg */}
      <rect x="10" y="18" width="18" height="42" rx="3" fill="#3a4a1a" />
      {/* Right leg */}
      <rect x="36" y="18" width="18" height="42" rx="3" fill="#3a4a1a" />
      {/* Waistband */}
      <rect x="8" y="14" width="48" height="6" rx="2" fill="#2a3a0a" />
      {/* Camo patches left leg */}
      <ellipse cx="15" cy="26" rx="6" ry="4" fill="#2a3a0a" />
      <ellipse cx="22" cy="32" rx="4" ry="6" fill="#4a5a2a" />
      <ellipse cx="14" cy="40" rx="5" ry="3" fill="#2a3a0a" />
      <ellipse cx="20" cy="48" rx="3" ry="5" fill="#4a5a2a" />
      {/* Camo patches right leg */}
      <ellipse cx="41" cy="28" rx="4" ry="6" fill="#2a3a0a" />
      <ellipse cx="48" cy="22" rx="6" ry="3" fill="#4a5a2a" />
      <ellipse cx="50" cy="38" rx="4" ry="5" fill="#2a3a0a" />
      <ellipse cx="42" cy="50" rx="5" ry="3" fill="#4a5a2a" />
    </svg>
  )
}

// ── BACKPACK icons ─────────────────────────────────────────────────────────────

function BasicBackpackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="24" y="4" width="16" height="6" rx="3" fill="#c82040" />
      {/* Top pocket */}
      <rect x="18" y="10" width="28" height="14" rx="3" fill="#d03050" />
      {/* Main body */}
      <rect x="10" y="8" width="44" height="48" rx="6" fill="#e84060" />
      {/* Front pocket */}
      <rect x="16" y="30" width="32" height="20" rx="4" fill="#c82040" />
      {/* Zipper arc top pocket */}
      <path d="M17,31 Q32,28 47,31" stroke="#888" strokeWidth="2" fill="none" />
      {/* Straps at bottom */}
      <rect x="14" y="54" width="10" height="6" rx="2" fill="#c82040" />
      <rect x="40" y="54" width="10" height="6" rx="2" fill="#c82040" />
    </svg>
  )
}

function TacticalPackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="22" y="2" width="20" height="6" rx="3" fill="#1a2a0a" />
      {/* Side pouches */}
      <rect x="4" y="20" width="8" height="24" rx="2" fill="#1a2a0a" />
      <rect x="52" y="20" width="8" height="24" rx="2" fill="#1a2a0a" />
      {/* Main body */}
      <rect x="8" y="6" width="48" height="52" rx="4" fill="#2a3a1a" />
      {/* MOLLE webbing rows */}
      <rect x="12" y="18" width="40" height="3" rx="1" fill="#1a2a0a" fillOpacity="0.8" />
      <rect x="12" y="24" width="40" height="3" rx="1" fill="#1a2a0a" fillOpacity="0.8" />
      <rect x="12" y="30" width="40" height="3" rx="1" fill="#1a2a0a" fillOpacity="0.8" />
      <rect x="12" y="36" width="40" height="3" rx="1" fill="#1a2a0a" fillOpacity="0.8" />
      <rect x="12" y="42" width="40" height="3" rx="1" fill="#1a2a0a" fillOpacity="0.8" />
    </svg>
  )
}

function SurvivalDuffelIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* End caps */}
      <ellipse cx="12" cy="33" rx="10" ry="15" fill="#2a1a10" />
      <ellipse cx="52" cy="33" rx="10" ry="15" fill="#2a1a10" />
      {/* Main body */}
      <rect x="8" y="18" width="48" height="30" rx="12" fill="#3a2a18" />
      {/* Top handle */}
      <path d="M22,16 Q32,8 42,16" stroke="#2a1a10" strokeWidth="6" fill="none" strokeLinecap="round" />
      {/* Zipper */}
      <path d="M10,18 L54,18" stroke="#888" strokeWidth="2" strokeDasharray="4,2" />
      {/* Strap X pattern */}
      <path d="M12,20 L52,46" stroke="#2a1a10" strokeWidth="2" fillOpacity="0.5" />
      <path d="M12,46 L52,20" stroke="#2a1a10" strokeWidth="2" fillOpacity="0.5" />
    </svg>
  )
}

function DimensionalPackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Main body */}
      <rect x="8" y="6" width="48" height="52" rx="8" fill="#0a1a3a" stroke="#1a3a6a" strokeWidth="1" />
      {/* Inner panel */}
      <rect x="14" y="12" width="36" height="30" rx="4" fill="#1a3a6a" />
      {/* Glow border */}
      <rect x="14" y="12" width="36" height="30" rx="4" fill="none" stroke="#3dff7a" strokeWidth="1" strokeOpacity="0.6" />
      {/* Core glow */}
      <circle cx="32" cy="27" r="10" fill="#3dff7a" fillOpacity="0.7" />
      <circle cx="32" cy="27" r="14" fill="none" stroke="#3dff7a" strokeWidth="1" strokeOpacity="0.4" />
      {/* Core highlight */}
      <circle cx="28" cy="23" r="3" fill="#fff" fillOpacity="0.4" />
      {/* Vents left */}
      <rect x="10" y="20" width="4" height="2" rx="1" fill="#1a3a6a" />
      <rect x="10" y="26" width="4" height="2" rx="1" fill="#1a3a6a" />
      <rect x="10" y="32" width="4" height="2" rx="1" fill="#1a3a6a" />
      {/* Vents right */}
      <rect x="50" y="20" width="4" height="2" rx="1" fill="#1a3a6a" />
      <rect x="50" y="26" width="4" height="2" rx="1" fill="#1a3a6a" />
      <rect x="50" y="32" width="4" height="2" rx="1" fill="#1a3a6a" />
      {/* Buckles */}
      <rect x="14" y="46" width="12" height="6" rx="2" fill="#1a3a6a" />
      <rect x="38" y="46" width="12" height="6" rx="2" fill="#1a3a6a" />
    </svg>
  )
}

function LargePackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="20" y="2" width="24" height="6" rx="3" fill="#1a2a0a" />
      {/* Side pouches */}
      <rect x="2" y="16" width="10" height="30" rx="2" fill="#1a2a0a" />
      <rect x="52" y="16" width="10" height="30" rx="2" fill="#1a2a0a" />
      {/* Main body */}
      <rect x="6" y="6" width="52" height="56" rx="5" fill="#1A3A0F" />
      {/* MOLLE webbing */}
      <rect x="10" y="16" width="44" height="3" rx="1" fill="#0a2a08" fillOpacity="0.8" />
      <rect x="10" y="22" width="44" height="3" rx="1" fill="#0a2a08" fillOpacity="0.8" />
      <rect x="10" y="28" width="44" height="3" rx="1" fill="#0a2a08" fillOpacity="0.8" />
      <rect x="10" y="34" width="44" height="3" rx="1" fill="#0a2a08" fillOpacity="0.8" />
    </svg>
  )
}

function AdventurePackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="22" y="4" width="20" height="6" rx="3" fill="#5a3010" />
      {/* Main body */}
      <rect x="10" y="8" width="44" height="46" rx="6" fill="#78350F" />
      {/* Front pocket */}
      <rect x="16" y="32" width="32" height="18" rx="4" fill="#5a2a08" />
      {/* Zipper */}
      <path d="M17,33 Q32,30 47,33" stroke="#a06030" strokeWidth="2" fill="none" />
      {/* Top flap */}
      <rect x="12" y="8" width="40" height="12" rx="4" fill="#5a2a08" />
      {/* Straps */}
      <rect x="14" y="52" width="10" height="6" rx="2" fill="#5a2a08" />
      <rect x="40" y="52" width="10" height="6" rx="2" fill="#5a2a08" />
    </svg>
  )
}

function SurvivalPackIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="22" y="2" width="20" height="6" rx="3" fill="#5a0a0a" />
      {/* Side pouches */}
      <rect x="4" y="18" width="8" height="22" rx="2" fill="#5a0a0a" />
      <rect x="52" y="18" width="8" height="22" rx="2" fill="#5a0a0a" />
      {/* Main body */}
      <rect x="8" y="6" width="48" height="52" rx="4" fill="#7F1D1D" />
      {/* Front pocket */}
      <rect x="14" y="28" width="36" height="22" rx="3" fill="#5a0a0a" />
      {/* Zipper */}
      <path d="M15,29 Q32,26 49,29" stroke="#8a1a1a" strokeWidth="2" fill="none" />
      {/* Tactical stripe */}
      <rect x="8" y="16" width="48" height="4" fill="#5a0a0a" fillOpacity="0.6" />
    </svg>
  )
}

// ── BELT / ACCESSORY icons ────────────────────────────────────────────────────

function StarterBeltIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Strap */}
      <rect x="4" y="26" width="56" height="12" rx="3" fill="#3a2010" />
      {/* Buckle frame */}
      <rect x="26" y="22" width="12" height="20" rx="2" fill="#888" />
      {/* Buckle inner */}
      <rect x="28" y="24" width="8" height="16" rx="1" fill="#0a0a0a" />
      {/* Prong */}
      <rect x="31" y="24" width="2" height="8" fill="#aaa" />
      {/* Holes */}
      <circle cx="42" cy="32" r="2" fill="#2a1a08" />
      <circle cx="46" cy="32" r="2" fill="#2a1a08" />
      <circle cx="50" cy="32" r="2" fill="#2a1a08" />
      <circle cx="54" cy="32" r="2" fill="#2a1a08" />
    </svg>
  )
}

function UtilityBeltIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Strap */}
      <rect x="4" y="26" width="56" height="12" rx="3" fill="#3a2010" />
      {/* Buckle frame */}
      <rect x="26" y="22" width="12" height="20" rx="2" fill="#888" />
      {/* Buckle inner */}
      <rect x="28" y="24" width="8" height="16" rx="1" fill="#0a0a0a" />
      {/* Prong */}
      <rect x="31" y="24" width="2" height="8" fill="#aaa" />
      {/* Tool pouch */}
      <rect x="44" y="26" width="12" height="10" rx="2" fill="#2a1008" />
      {/* Holes */}
      <circle cx="10" cy="32" r="2" fill="#2a1a08" />
      <circle cx="14" cy="32" r="2" fill="#2a1a08" />
      <circle cx="18" cy="32" r="2" fill="#2a1a08" />
    </svg>
  )
}

function TacticalBeltIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Main strap */}
      <rect x="4" y="22" width="56" height="18" rx="3" fill="#1a2a0a" />
      {/* D-ring buckle */}
      <rect x="26" y="18" width="12" height="24" rx="2" fill="#4a5a3a" />
      <rect x="28" y="20" width="8" height="20" rx="1" fill="#2a3a1a" />
      {/* Side pouch */}
      <rect x="46" y="24" width="12" height="14" rx="2" fill="#0a1a04" />
      <line x1="46" y1="28" x2="58" y2="28" stroke="#666" strokeWidth="1" />
      {/* Velcro panel */}
      <rect x="16" y="26" width="24" height="10" rx="1" fill="#0a1a04" stroke="#2a3a18" strokeWidth="0.5" strokeDasharray="2" />
      {/* MOLLE loops */}
      <rect x="12" y="40" width="6" height="4" rx="1" fill="#0a1a04" />
      <rect x="22" y="40" width="6" height="4" rx="1" fill="#0a1a04" />
      <rect x="32" y="40" width="6" height="4" rx="1" fill="#0a1a04" />
      <rect x="42" y="40" width="6" height="4" rx="1" fill="#0a1a04" />
    </svg>
  )
}

function SurvivorRigIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Left shoulder strap */}
      <path d="M20,22 L8,4" stroke="#2a3a18" strokeWidth="8" strokeLinecap="round" />
      {/* Right shoulder strap */}
      <path d="M44,22 L56,4" stroke="#2a3a18" strokeWidth="8" strokeLinecap="round" />
      {/* Chest plate */}
      <rect x="20" y="20" width="24" height="30" rx="4" fill="#2a3a18" />
      <rect x="20" y="20" width="24" height="30" rx="4" fill="none" stroke="#3a4a28" strokeWidth="1" />
      {/* Left pouch */}
      <rect x="8" y="24" width="12" height="16" rx="2" fill="#1a2a0a" />
      {/* Right pouch */}
      <rect x="44" y="24" width="12" height="16" rx="2" fill="#1a2a0a" />
      {/* Bottom pouches */}
      <rect x="14" y="42" width="10" height="12" rx="2" fill="#1a2a0a" />
      <rect x="40" y="42" width="10" height="12" rx="2" fill="#1a2a0a" />
      {/* D-rings */}
      <circle cx="20" cy="22" r="3" fill="none" stroke="#aaa" strokeWidth="1.5" />
      <circle cx="44" cy="22" r="3" fill="none" stroke="#aaa" strokeWidth="1.5" />
    </svg>
  )
}

function LegendaryWarBeltIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Wide strap */}
      <rect x="4" y="24" width="56" height="16" rx="3" fill="#3a1a08" />
      {/* Gold buckle */}
      <rect x="24" y="20" width="16" height="24" rx="2" fill="#c8a820" />
      <rect x="26" y="22" width="12" height="20" rx="1" fill="#8a6a00" />
      {/* Prong */}
      <rect x="31" y="22" width="2" height="10" fill="#c8a820" />
      {/* Holster */}
      <polygon points="44,40 56,40 52,58 48,58" fill="#2a1008" />
      {/* Grenade loops */}
      <circle cx="8" cy="32" r="3" fill="none" stroke="#c8a820" strokeWidth="1.5" />
      <circle cx="12" cy="32" r="3" fill="none" stroke="#c8a820" strokeWidth="1.5" />
      <circle cx="16" cy="32" r="3" fill="none" stroke="#c8a820" strokeWidth="1.5" />
      {/* Studs along strap */}
      <circle cx="22" cy="32" r="1.5" fill="#c8a820" />
      <circle cx="44" cy="32" r="1.5" fill="#c8a820" />
      <circle cx="48" cy="32" r="1.5" fill="#c8a820" />
      <circle cx="52" cy="32" r="1.5" fill="#c8a820" />
      {/* Knife sheath */}
      <rect x="4" y="32" width="6" height="16" rx="2" fill="#1a0a04" />
    </svg>
  )
}

function NightGogglesIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Strap */}
      <path d="M8,32 Q8,26 14,26" stroke="#1a2a0a" strokeWidth="4" fill="none" strokeLinecap="round" />
      <path d="M56,26 Q62,26 62,32" stroke="#1a2a0a" strokeWidth="4" fill="none" strokeLinecap="round" />
      {/* Bridge */}
      <rect x="34" y="28" width="8" height="8" rx="2" fill="#2a3a1a" />
      {/* Left lens */}
      <circle cx="22" cy="32" r="14" fill="#1a2a1a" stroke="#3a4a2a" strokeWidth="2" />
      <circle cx="22" cy="32" r="10" fill="#0a1a0a" />
      {/* Right lens */}
      <circle cx="42" cy="32" r="14" fill="#1a2a1a" stroke="#3a4a2a" strokeWidth="2" />
      <circle cx="42" cy="32" r="10" fill="#0a1a0a" />
      {/* Left lens glint */}
      <ellipse cx="17" cy="27" rx="4" ry="3" fill="#3dff7a" fillOpacity="0.5" />
      {/* Right lens glint */}
      <ellipse cx="37" cy="27" rx="4" ry="3" fill="#3dff7a" fillOpacity="0.5" />
    </svg>
  )
}

// ── WEAPON / TOOL icons ────────────────────────────────────────────────────────

function SpikeBatIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Handle */}
      <rect x="28" y="38" width="8" height="24" rx="4" fill="#78350F" />
      {/* Tape grip */}
      <rect x="28" y="50" width="8" height="10" fill="#1a1a1a" fillOpacity="0.6" />
      {/* Bat head */}
      <rect x="22" y="6" width="20" height="34" rx="6" fill="#92400E" />
      {/* Spikes left */}
      <polygon points="22,14 14,12 22,18" fill="#888" />
      <polygon points="22,24 14,22 22,28" fill="#888" />
      <polygon points="22,34 14,32 22,38" fill="#888" />
      {/* Spikes right */}
      <polygon points="42,14 50,12 42,18" fill="#888" />
      <polygon points="42,24 50,22 42,28" fill="#888" />
      <polygon points="42,34 50,32 42,38" fill="#888" />
    </svg>
  )
}

function BetterFlashlightIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Body */}
      <rect x="22" y="30" width="20" height="28" rx="4" fill="#374151" />
      {/* Grip band */}
      <rect x="22" y="44" width="20" height="4" rx="1" fill="#1F2937" />
      {/* Tail cap */}
      <rect x="24" y="56" width="16" height="6" rx="3" fill="#4B5563" />
      {/* Lens head */}
      <rect x="20" y="20" width="24" height="14" rx="5" fill="#6B7280" />
      {/* Beam glow */}
      <ellipse cx="32" cy="14" rx="10" ry="6" fill="#FEF08A" fillOpacity="0.7" />
      {/* Lens center */}
      <circle cx="32" cy="24" r="6" fill="#9CA3AF" />
      <circle cx="32" cy="24" r="4" fill="#FEF08A" fillOpacity="0.8" />
    </svg>
  )
}

function AlarmCansIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Strings */}
      <path d="M20,8 L20,24" stroke="#94A3B8" strokeWidth="2" />
      <path d="M44,8 L44,28" stroke="#94A3B8" strokeWidth="2" />
      {/* String connector */}
      <path d="M20,8 L44,8" stroke="#94A3B8" strokeWidth="1.5" strokeDasharray="3,2" />
      {/* Left can */}
      <rect x="13" y="24" width="14" height="20" rx="3" fill="#9CA3AF" />
      <line x1="15" y1="30" x2="25" y2="30" stroke="#6B7280" strokeWidth="1" />
      <line x1="15" y1="35" x2="25" y2="35" stroke="#6B7280" strokeWidth="1" />
      {/* Left can top */}
      <rect x="13" y="22" width="14" height="4" rx="2" fill="#CBD5E1" />
      {/* Right can */}
      <rect x="37" y="28" width="14" height="18" rx="3" fill="#6B7280" />
      <line x1="39" y1="33" x2="49" y2="33" stroke="#4B5563" strokeWidth="1" />
      <line x1="39" y1="38" x2="49" y2="38" stroke="#4B5563" strokeWidth="1" />
      {/* Right can top */}
      <rect x="37" y="26" width="14" height="4" rx="2" fill="#9CA3AF" />
    </svg>
  )
}

// ── Default icon ───────────────────────────────────────────────────────────────

function DefaultItemIcon() {
  return (
    <svg viewBox="0 0 64 64" width="64" height="64" xmlns="http://www.w3.org/2000/svg">
      {/* Gear / cogwheel */}
      <circle cx="32" cy="32" r="10" fill="#4a5568" />
      <circle cx="32" cy="32" r="6" fill="#2d3748" />
      {/* Teeth */}
      {[0, 45, 90, 135, 180, 225, 270, 315].map((angle, i) => {
        const rad = (angle * Math.PI) / 180
        const x1 = 32 + 10 * Math.cos(rad)
        const y1 = 32 + 10 * Math.sin(rad)
        const x2 = 32 + 16 * Math.cos(rad)
        const y2 = 32 + 16 * Math.sin(rad)
        return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="#4a5568" strokeWidth="4" strokeLinecap="round" />
      })}
      <circle cx="32" cy="32" r="3" fill="#718096" />
    </svg>
  )
}

// ── Public API ─────────────────────────────────────────────────────────────────

export function getItemIcon(slug: string): React.ReactNode {
  switch (slug) {
    // Head
    case 'starter-cap':             return <StarterCapIcon />
    case 'baseball-cap':            return <BaseballCapIcon />
    case 'tactical-helmet':         return <TacticalHelmetIcon />
    case 'combat-helmet':           return <TacticalHelmetIcon />
    case 'survivor-beanie':         return <SurvivorBeanieIcon />
    case 'flashlight-helmet':       return <FlashlightHelmetIcon />
    case 'survivor-bandana':        return <SurvivorBandanaIcon />

    // Top / jackets
    case 'starter-jacket':          return <StarterJacketIcon />
    case 'tactical-jacket':         return <TacticalJacketIcon />
    case 'hazmat-jacket':           return <HazmatJacketIcon />
    case 'leather-survivor-jacket': return <LeatherSurvivorJacketIcon />
    case 'survivor-jacket':         return <SurvivorJacketIcon />

    // Shoes
    case 'starter-sneakers':        return <StarterSneakersIcon />
    case 'trail-runners':           return <TrailRunnersIcon />
    case 'military-boots':          return <MilitaryBootsIcon />
    case 'reinforced-boots':        return <ReinforcedBootsIcon />
    case 'neon-speed-kicks':        return <NeonSpeedKicksIcon />

    // Bottom / pants
    case 'cargo-pants':             return <CargoPantsIcon />
    case 'tactical-pants':          return <TacticalPantsIcon />
    case 'hazmat-trousers':         return <HazmatTrousersIcon />
    case 'survivor-camo-pants':     return <SurvivorCamoPantsIcon />

    // Backpack
    case 'basic-backpack':          return <BasicBackpackIcon />
    case 'starter-backpack':        return <BasicBackpackIcon />
    case 'tactical-pack':           return <TacticalPackIcon />
    case 'survival-duffel':         return <SurvivalDuffelIcon />
    case 'dimensional-pack':        return <DimensionalPackIcon />
    case 'large-pack':              return <LargePackIcon />
    case 'adventure-pack':          return <AdventurePackIcon />
    case 'survival-pack':           return <SurvivalPackIcon />

    // Accessory / belt
    case 'starter-belt':            return <StarterBeltIcon />
    case 'utility-belt':            return <UtilityBeltIcon />
    case 'tactical-belt':           return <TacticalBeltIcon />
    case 'survivor-rig':            return <SurvivorRigIcon />
    case 'legendary-war-belt':      return <LegendaryWarBeltIcon />
    case 'night-goggles':           return <NightGogglesIcon />
    case 'binoculars':              return <NightGogglesIcon />

    // Handheld / weapons
    case 'spike-bat':               return <SpikeBatIcon />
    case 'spiked-bat':              return <SpikeBatIcon />
    case 'better-flashlight':       return <BetterFlashlightIcon />
    case 'alarm-cans':              return <AlarmCansIcon />

    default:                        return <DefaultItemIcon />
  }
}
