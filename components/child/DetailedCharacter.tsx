'use client'

import React from 'react'
import { SKIN_COLORS, HAIR_COLORS, EYE_IRIS_COLORS } from '@/lib/constants/avatar-map'

// ── Color utilities ────────────────────────────────────────────────────────────
function dk(hex: string, f = 0.22): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const c = (v: number) => Math.max(0, Math.round(((n >> v) & 0xff) * (1 - f))).toString(16).padStart(2, '0')
  return `#${c(16)}${c(8)}${c(0)}`
}
function lt(hex: string, f = 0.28): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const c = (v: number) => Math.min(255, Math.round(((n >> v) & 0xff) + 255 * f)).toString(16).padStart(2, '0')
  return `#${c(16)}${c(8)}${c(0)}`
}

// ── Types ──────────────────────────────────────────────────────────────────────
export interface GearOverlaySlots {
  head?:     string | null
  belt?:     string | null
  backpack?: string | null
}

export interface DetailedCharacterProps {
  gender?:      string
  skinTone?:    string
  hairColor?:   string
  hairStyle?:   string
  eyeColor?:    string
  eyeStyle?:    'round' | 'almond' | 'wide' | 'squint'
  freckles?:    boolean
  jacketColor?: string
  pantsColor?:  string
  goggleColor?: string
  sigItem?:     'bat' | 'wrench' | 'broom' | 'none'
  width?:       number
  cropToHead?:  boolean
  className?:   string
  style?:       React.CSSProperties
  gear?:        GearOverlaySlots
}

const STYLE_MAP: Record<string, string> = {
  Short: 'short', Long: 'long', Curly: 'curly',
  Braided: 'braided', Shaved: 'shaved', Ponytail: 'ponytail',
  Bald: 'bald', Spike: 'spike',
}

// ── Main component ─────────────────────────────────────────────────────────────
export function DetailedCharacter({
  gender      = 'boy',
  skinTone,
  hairColor,
  hairStyle,
  eyeColor,
  eyeStyle    = 'round',
  freckles    = false,
  jacketColor = '#2a4a2a',
  pantsColor  = '#2a3a4a',
  goggleColor = '#f97316',
  sigItem     = 'bat',
  width       = 80,
  cropToHead  = false,
  className,
  style,
  gear,
}: DetailedCharacterProps) {
  const skin    = SKIN_COLORS[skinTone  ?? ''] ?? '#EFC891'
  const hair    = HAIR_COLORS[hairColor ?? ''] ?? '#6B3A2A'
  const iris    = EYE_IRIS_COLORS[eyeColor ?? ''] ?? '#7c3d12'
  const jacket  = jacketColor ?? '#2a4a2a'
  const pants   = pantsColor  ?? '#2a3a4a'
  const goggle  = goggleColor ?? '#f97316'

  const skinD = dk(skin, 0.18), skinL = lt(skin, 0.15)
  const hairD = dk(hair, 0.32), hairL = lt(hair, 0.22)
  const jacketD = dk(jacket, 0.25), jacketL = lt(jacket, 0.12)
  const pantsD = dk(pants, 0.22)
  const goggleD = dk(goggle, 0.38)

  const isGirl = gender === 'girl'
  const hStyle = STYLE_MAP[hairStyle ?? ''] ?? (hairStyle?.toLowerCase() ?? (isGirl ? 'ponytail' : 'short'))

  // Eye ry based on style
  const eyeRy = eyeStyle === 'wide' ? 8.5 : eyeStyle === 'squint' ? 4.5 : eyeStyle === 'almond' ? 6.5 : 7

  const H = Math.round(width * 200 / 120)
  const vb = cropToHead ? '5 12 110 75' : '0 0 120 200'

  // ── Subrenderers ────────────────────────────────────────────────────────────

  function BackHair() {
    if (hStyle === 'bald' || hStyle === 'spike') return null
    if (isGirl) {
      if (hStyle === 'ponytail' || hStyle === 'pigtails') {
        return (<>
          <path d="M27,64 Q15,92 18,124 Q20,146 18,164" stroke={hair} strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M27,64 Q15,92 18,124 Q20,146 18,164" stroke={hairD} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="15,6" opacity="0.6" />
          <path d="M93,64 Q105,92 102,124 Q100,146 102,164" stroke={hair} strokeWidth="13" fill="none" strokeLinecap="round" />
          <path d="M93,64 Q105,92 102,124 Q100,146 102,164" stroke={hairD} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="15,6" opacity="0.6" />
        </>)
      }
      if (hStyle === 'long') {
        return (<>
          <path d="M28,55 Q16,88 20,120 Q22,145 22,168" stroke={hair} strokeWidth="16" fill="none" strokeLinecap="round" />
          <path d="M28,55 Q16,88 20,120 Q22,145 22,168" stroke={hairL} strokeWidth="4" fill="none" strokeLinecap="round" opacity="0.45" />
          <path d="M92,55 Q104,88 100,120 Q98,145 98,168" stroke={hair} strokeWidth="16" fill="none" strokeLinecap="round" />
        </>)
      }
      if (hStyle === 'braided') {
        return (<>
          <path d="M29,60 Q18,86 20,114 Q22,136 20,158" stroke={hair} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="14,5" />
          <path d="M29,60 Q18,86 20,114 Q22,136 20,158" stroke={hairD} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="14,5" strokeDashoffset="7" opacity="0.7" />
          <path d="M91,60 Q102,86 100,114 Q98,136 100,158" stroke={hair} strokeWidth="10" fill="none" strokeLinecap="round" strokeDasharray="14,5" />
          <path d="M91,60 Q102,86 100,114 Q98,136 100,158" stroke={hairD} strokeWidth="4" fill="none" strokeLinecap="round" strokeDasharray="14,5" strokeDashoffset="7" opacity="0.7" />
          {[84,104,124,144].map(y => (<React.Fragment key={y}>
            <ellipse cx="20" cy={y} rx="6" ry="3.5" fill={dk(hair,0.48)} opacity="0.85" />
            <ellipse cx="100" cy={y} rx="6" ry="3.5" fill={dk(hair,0.48)} opacity="0.85" />
          </React.Fragment>))}
        </>)
      }
    } else {
      if (hStyle === 'long') {
        return (<>
          <path d="M28,55 Q18,82 20,108" stroke={hair} strokeWidth="11" fill="none" strokeLinecap="round" />
          <path d="M92,55 Q102,82 100,108" stroke={hair} strokeWidth="11" fill="none" strokeLinecap="round" />
        </>)
      }
    }
    return null
  }

  function Ears() {
    return (<>
      <ellipse cx="26.5" cy="50" rx="4.5" ry="7.5" fill={skin} />
      <ellipse cx="26.5" cy="50" rx="2.5" ry="4.5" fill={skinD} opacity="0.55" />
      <path d="M26,46 Q28,50 26,54" stroke={dk(skin,0.35)} strokeWidth="1" fill="none" strokeLinecap="round" />
      <ellipse cx="93.5" cy="50" rx="4.5" ry="7.5" fill={skin} />
      <ellipse cx="93.5" cy="50" rx="2.5" ry="4.5" fill={skinD} opacity="0.55" />
      <path d="M94,46 Q92,50 94,54" stroke={dk(skin,0.35)} strokeWidth="1" fill="none" strokeLinecap="round" />
    </>)
  }

  function LeftArm() {
    return (<>
      <path d="M26,88 L13,121 L21,123 L30,92" fill={jacket} />
      <path d="M13,119 L21,121 L21,127 Q18,131 14,128 L13,119" fill={skin} />
    </>)
  }

  function RightArm() {
    if (sigItem !== 'none') {
      return (<>
        <path d="M94,88 L105,115 L97,117 L90,92" fill={jacket} />
        <path d="M97,113 L106,115 L107,121 Q104,125 100,122 L97,113" fill={skin} />
      </>)
    }
    return (<>
      <path d="M94,88 L107,121 L99,123 L90,92" fill={jacket} />
      <path d="M99,119 L108,121 L108,127 Q105,131 101,128 L99,119" fill={skin} />
    </>)
  }

  function Legs() {
    return (<>
      {/* Left leg */}
      <rect x="35" y="132" width="18" height="40" rx="5" fill={pants} />
      <rect x="33" y="148" width="10" height="15" rx="2.5" fill={pantsD} />
      <line x1="44" y1="133" x2="44" y2="170" stroke={pantsD} strokeWidth="0.9" opacity="0.55" />
      {/* Right leg */}
      <rect x="67" y="132" width="18" height="40" rx="5" fill={pants} />
      <rect x="77" y="148" width="10" height="15" rx="2.5" fill={pantsD} />
      <line x1="76" y1="133" x2="76" y2="170" stroke={pantsD} strokeWidth="0.9" opacity="0.55" />
      {/* Knee pads */}
      <ellipse cx="44" cy="157" rx="9" ry="7.5" fill={dk(pants,0.38)} />
      <ellipse cx="44" cy="156" rx="6" ry="5" fill={dk(pants,0.2)} opacity="0.6" />
      <ellipse cx="76" cy="157" rx="9" ry="7.5" fill={dk(pants,0.38)} />
      <ellipse cx="76" cy="156" rx="6" ry="5" fill={dk(pants,0.2)} opacity="0.6" />
    </>)
  }

  function Boots() {
    return (<>
      {/* Left boot */}
      <path d="M33,170 L57,170 L57,177 Q56,185 46,185 Q34,185 33,177 Z" fill="#2a1a0a" />
      <ellipse cx="41" cy="184" rx="9" ry="3" fill="#3a2a12" />
      <rect x="31" y="181" width="28" height="4" rx="2" fill="#1a1008" />
      {/* Boot laces left */}
      {[172,175,178].map((y,i) => (<line key={y} x1={35+i} y1={y} x2={45-i} y2={y} stroke="#8a7a6a" strokeWidth="0.9" />))}
      {/* Right boot */}
      <path d="M63,170 L87,170 L87,177 Q86,185 74,185 Q63,185 63,177 Z" fill="#2a1a0a" />
      <ellipse cx="78" cy="184" rx="9" ry="3" fill="#3a2a12" />
      <rect x="61" y="181" width="28" height="4" rx="2" fill="#1a1008" />
      {[172,175,178].map((y,i) => (<line key={y} x1={65+i} y1={y} x2={79-i} y2={y} stroke="#8a7a6a" strokeWidth="0.9" />))}
    </>)
  }

  function Body() {
    const bx = isGirl ? 28 : 24, bw = isGirl ? 64 : 72
    return (<>
      {/* Main jacket */}
      <rect x={bx} y="82" width={bw} height="50" rx="7" fill={jacket} />
      <rect x={bx} y="82" width={bw} height="50" rx="7" fill={jacketD} opacity="0.22" />
      {/* Shoulder seam */}
      {isGirl
        ? <path d="M22,87 Q60,80 98,87" fill="none" stroke={jacketD} strokeWidth="1.6" />
        : <path d="M14,87 Q60,79 106,87" fill="none" stroke={jacketD} strokeWidth="1.6" />
      }
      {/* Center seam */}
      <line x1="60" y1="82" x2="60" y2="132" stroke={jacketD} strokeWidth="0.9" opacity="0.6" />
      {/* Backpack strap */}
      <path d="M80,84 Q66,110 52,130" stroke={dk(jacket,0.5)} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.82" />
      {/* Breast pocket */}
      <rect x="42" y="90" width="20" height="22" rx="3" fill={jacketD} />
      <rect x="43" y="91" width="18" height="20" rx="2" fill="none" stroke={jacketL} strokeWidth="0.8" opacity="0.7" />
      {/* Patch on pocket */}
      <rect x="44" y="103" width="14" height="8" rx="1.5" fill="#f97316" opacity="0.9" />
      <text x="51" y="109" textAnchor="middle" fontSize="3.8" fill="white" fontWeight="bold" fontFamily="monospace">ZS</text>
      {/* Walkie-talkie */}
      <rect x="70" y="88" width="11" height="19" rx="2.5" fill="#2e2e2e" />
      <rect x="71" y="89" width="9" height="11" rx="1.5" fill="#1a2a18" />
      {[93,96,99].map(y => <line key={y} x1="71" y1={y} x2="80" y2={y} stroke="#3a3a3a" strokeWidth="0.8" />)}
      <line x1="75" y1="88" x2="75" y2="82" stroke="#555" strokeWidth="1.6" strokeLinecap="round" />
      {/* Belt */}
      <rect x={bx} y="128" width={bw} height="7" rx="2.5" fill={dk(pants,0.42)} />
      <rect x="55" y="126" width="10" height="9" rx="2" fill="#8a7a50" />
      <rect x="57" y="128" width="6" height="5" rx="1" fill="#c0a870" />
      {/* Torch */}
      <rect x="33" y="129" width="6" height="9" rx="2" fill="#4a4a2a" />
      <circle cx="36" cy="129" r="2.5" fill="#f5d073" opacity="0.8" />
      {/* Medkit */}
      <rect x="84" y="129" width="9" height="8" rx="1.5" fill="#cc2222" />
      <rect x="87.5" y="130" width="2" height="6" rx="0.5" fill="white" />
      <rect x="85" y="132" width="7" height="2" rx="0.5" fill="white" />
    </>)
  }

  function Neck() {
    return <rect x="52" y="73" width="16" height="13" rx="4" fill={skin} />
  }

  function Head() {
    if (isGirl) {
      return (<>
        <ellipse cx="60" cy="50" rx="32" ry="27" fill={skin} />
        {/* Skin highlight */}
        <ellipse cx="50" cy="36" rx="14" ry="9" fill={skinL} opacity="0.32" />
        {/* Jaw shadow */}
        <ellipse cx="60" cy="74" rx="20" ry="5" fill={skinD} opacity="0.18" />
      </>)
    }
    return (<>
      <path d="M28,50 A32,27 0 0,1 92,50 Q94,81 60,82 Q26,81 28,50" fill={skin} />
      <ellipse cx="50" cy="36" rx="14" ry="9" fill={skinL} opacity="0.30" />
      <ellipse cx="60" cy="78" rx="21" ry="5" fill={skinD} opacity="0.18" />
    </>)
  }

  function Goggles() {
    return (<>
      <rect x="25" y="24" width="70" height="11" rx="5.5" fill={goggleD} />
      <ellipse cx="44" cy="29" rx="13" ry="10" fill={goggle} opacity="0.92" />
      <ellipse cx="44" cy="29" rx="8" ry="6.5" fill={dk(goggle,0.18)} opacity="0.5" />
      <ellipse cx="44" cy="29" rx="13" ry="10" fill="none" stroke={goggleD} strokeWidth="2.2" />
      <ellipse cx="76" cy="29" rx="13" ry="10" fill={goggle} opacity="0.92" />
      <ellipse cx="76" cy="29" rx="8" ry="6.5" fill={dk(goggle,0.18)} opacity="0.5" />
      <ellipse cx="76" cy="29" rx="13" ry="10" fill="none" stroke={goggleD} strokeWidth="2.2" />
      <rect x="57" y="26" width="6" height="6" rx="1.5" fill={goggleD} />
      <path d="M35,23 Q37,21 43,21" stroke="rgba(255,255,255,0.72)" strokeWidth="2" fill="none" strokeLinecap="round" />
      <path d="M67,23 Q69,21 75,21" stroke="rgba(255,255,255,0.72)" strokeWidth="2" fill="none" strokeLinecap="round" />
    </>)
  }

  function Face() {
    const browStroke = isGirl ? 1.8 : 2.8
    const browY1 = isGirl ? 40 : 41
    const browY2 = isGirl ? 36.5 : 38
    return (<>
      {/* Eyebrows */}
      <path d={`M33,${browY1} Q42.5,${browY2} 53,${browY1}`} stroke={hairD} strokeWidth={browStroke} fill="none" strokeLinecap="round" />
      <path d={`M67,${browY1} Q77.5,${browY2} 87,${browY1}`} stroke={hairD} strokeWidth={browStroke} fill="none" strokeLinecap="round" />

      {/* Left eye */}
      <g transform="translate(42, 47)">
        {isGirl && (<>
          <line x1="-8.5" y1={-eyeRy+2} x2="-11" y2={-eyeRy-5.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-5" y1={-eyeRy+0.4} x2="-5.5" y2={-eyeRy-6} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-1" y1={-eyeRy} x2="-1" y2={-eyeRy-6.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="3" y1={-eyeRy} x2="3" y2={-eyeRy-6.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="7" y1={-eyeRy+0.4} x2="7.5" y2={-eyeRy-6} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="9" y1={-eyeRy+2} x2="11.5" y2={-eyeRy-4.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-9.5" y1="0" x2="-13" y2="-2.5" stroke="#1a1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="9.5" y1="0" x2="13" y2="-2.5" stroke="#1a1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="-6" y1={eyeRy-0.5} x2="-7.5" y2={eyeRy+3} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="0" y1={eyeRy} x2="0" y2={eyeRy+3.5} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="6" y1={eyeRy-0.5} x2="7.5" y2={eyeRy+3} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
        </>)}
        {!isGirl && (<>
          <line x1="-7" y1={-eyeRy+1.5} x2="-9" y2={-eyeRy-4} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="-2" y1={-eyeRy} x2="-2" y2={-eyeRy-5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1={-eyeRy} x2="3" y2={-eyeRy-5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7.5" y1={-eyeRy+1.5} x2="9.5" y2={-eyeRy-3.5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
        </>)}
        <ellipse cx="0" cy="0" rx="9.5" ry={eyeRy} fill="white" />
        <path d={`M${-9.5+1},${-eyeRy/2} Q0,${-eyeRy-1} ${9.5-1},${-eyeRy/2}`} stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" fill="none" />
        <circle cx="0" cy="0" r="5.5" fill={iris} />
        <circle cx="0" cy="0" r="5.5" fill="none" stroke={lt(iris, 0.3)} strokeWidth="1.5" opacity="0.4" />
        <circle cx="0" cy="0" r="3" fill="#0e0908" />
        <circle cx="-2" cy="-2.5" r="1.8" fill="white" />
        <circle cx="2.5" cy="1.5" r="0.9" fill="white" opacity="0.6" />
        <ellipse cx="0" cy="0" rx="9.5" ry={eyeRy} fill="none" stroke="#1a1008" strokeWidth="1.2" />
      </g>

      {/* Right eye — mirrored via scale(-1,1) */}
      <g transform="translate(78, 47) scale(-1, 1)">
        {isGirl && (<>
          <line x1="-8.5" y1={-eyeRy+2} x2="-11" y2={-eyeRy-5.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-5" y1={-eyeRy+0.4} x2="-5.5" y2={-eyeRy-6} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-1" y1={-eyeRy} x2="-1" y2={-eyeRy-6.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="3" y1={-eyeRy} x2="3" y2={-eyeRy-6.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="7" y1={-eyeRy+0.4} x2="7.5" y2={-eyeRy-6} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="9" y1={-eyeRy+2} x2="11.5" y2={-eyeRy-4.5} stroke="#1a1008" strokeWidth="1.3" strokeLinecap="round" />
          <line x1="-9.5" y1="0" x2="-13" y2="-2.5" stroke="#1a1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="9.5" y1="0" x2="13" y2="-2.5" stroke="#1a1008" strokeWidth="1.1" strokeLinecap="round" />
          <line x1="-6" y1={eyeRy-0.5} x2="-7.5" y2={eyeRy+3} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="0" y1={eyeRy} x2="0" y2={eyeRy+3.5} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
          <line x1="6" y1={eyeRy-0.5} x2="7.5" y2={eyeRy+3} stroke="#1a1008" strokeWidth="0.9" strokeLinecap="round" />
        </>)}
        {!isGirl && (<>
          <line x1="-7" y1={-eyeRy+1.5} x2="-9" y2={-eyeRy-4} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="-2" y1={-eyeRy} x2="-2" y2={-eyeRy-5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="3" y1={-eyeRy} x2="3" y2={-eyeRy-5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
          <line x1="7.5" y1={-eyeRy+1.5} x2="9.5" y2={-eyeRy-3.5} stroke="#1a1008" strokeWidth="1.2" strokeLinecap="round" />
        </>)}
        <ellipse cx="0" cy="0" rx="9.5" ry={eyeRy} fill="white" />
        <path d={`M${-9.5+1},${-eyeRy/2} Q0,${-eyeRy-1} ${9.5-1},${-eyeRy/2}`} stroke="rgba(0,0,0,0.10)" strokeWidth="1.5" fill="none" />
        <circle cx="0" cy="0" r="5.5" fill={iris} />
        <circle cx="0" cy="0" r="5.5" fill="none" stroke={lt(iris, 0.3)} strokeWidth="1.5" opacity="0.4" />
        <circle cx="0" cy="0" r="3" fill="#0e0908" />
        <circle cx="-2" cy="-2.5" r="1.8" fill="white" />
        <circle cx="2.5" cy="1.5" r="0.9" fill="white" opacity="0.6" />
        <ellipse cx="0" cy="0" rx="9.5" ry={eyeRy} fill="none" stroke="#1a1008" strokeWidth="1.2" />
      </g>

      {/* Nose */}
      <path d="M57,56 Q60,53 63,56" stroke={skinD} strokeWidth="1.2" fill="none" strokeLinecap="round" />
      <ellipse cx="60" cy="61" rx="4.5" ry="3" fill={skinD} opacity="0.32" />
      <ellipse cx="57" cy="62" rx="2.5" ry="1.5" fill={dk(skin,0.32)} opacity="0.7" />
      <ellipse cx="63" cy="62" rx="2.5" ry="1.5" fill={dk(skin,0.32)} opacity="0.7" />

      {/* Mouth */}
      <path d="M47,67 Q54,63.5 60,65 Q66,63.5 73,67 Q66,68.5 60,69 Q54,68.5 47,67" fill={dk(skin,0.28)} />
      <path d="M47,67 Q60,71 73,67" stroke={dk(skin,0.36)} strokeWidth="0.9" fill="none" />
      <path d="M48,68 Q60,76.5 72,68" stroke={dk(skin,0.2)} strokeWidth="0.8" fill={dk(skin,0.1)} />
      <path d="M52,72 Q60,75.5 68,72" stroke={skinL} strokeWidth="1.4" fill="none" strokeLinecap="round" opacity="0.5" />

      {/* Cheek blush — girls only */}
      {isGirl && (<>
        <ellipse cx="33" cy="58" rx="10" ry="7" fill="#ff8fa3" opacity="0.22" />
        <ellipse cx="87" cy="58" rx="10" ry="7" fill="#ff8fa3" opacity="0.22" />
      </>)}

      {/* Freckles */}
      {freckles && (<>
        {([
          [55,53],[59,52],[63,52],[57,55],[62,55],[60,57],[65,54],[53,55],
        ] as [number,number][]).map(([fx,fy]) => (
          <circle key={`${fx}${fy}`} cx={fx} cy={fy} r="1.3" fill={dk(skin,0.35)} opacity="0.72" />
        ))}
      </>)}

      {/* Skin highlight */}
      <ellipse cx="50" cy="36" rx="14" ry="9" fill={skinL} opacity="0.32" />

      {/* Dirt smudge */}
      <path d="M72,44 Q76,46 74,49 Q72,48 72,44" fill="#3a2810" opacity="0.10" />
      <path d="M34,62 Q38,64 36,67 Q33,66 34,62" fill="#3a2810" opacity="0.09" />
    </>)
  }

  function FrontHair() {
    const topCap = (<>
      <ellipse cx="60" cy="22" rx="33" ry="13" fill={hair} />
      <ellipse cx="60" cy="30" rx="33" ry="20" fill={hair} />
    </>)
    const highlight = <ellipse cx="50" cy="15" rx="13" ry="5" fill={hairL} opacity="0.4" />

    if (isGirl) {
      if (hStyle === 'ponytail' || hStyle === 'pigtails') return (<>
        {topCap}
        <ellipse cx="27" cy="46" rx="7" ry="16" fill={hair} />
        <ellipse cx="93" cy="46" rx="7" ry="16" fill={hair} />
        <ellipse cx="27" cy="64" rx="6.5" ry="5.5" fill={dk(hair,0.52)} />
        <ellipse cx="93" cy="64" rx="6.5" ry="5.5" fill={dk(hair,0.52)} />
        {highlight}
      </>)
      if (hStyle === 'long') return (<>
        {topCap}
        <ellipse cx="27" cy="48" rx="7" ry="18" fill={hair} />
        <ellipse cx="93" cy="48" rx="7" ry="18" fill={hair} />
        <path d="M36,28 Q42,36 50,34" stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round" />
        <path d="M62,25 Q65,34 72,33" stroke={hair} strokeWidth="4" fill="none" strokeLinecap="round" />
        {highlight}
      </>)
      if (hStyle === 'braided') return (<>
        {topCap}
        <ellipse cx="27" cy="46" rx="7" ry="14" fill={hair} />
        <ellipse cx="93" cy="46" rx="7" ry="14" fill={hair} />
        <ellipse cx="27" cy="60" rx="5.5" ry="4.5" fill={dk(hair,0.48)} />
        <ellipse cx="93" cy="60" rx="5.5" ry="4.5" fill={dk(hair,0.48)} />
        {highlight}
      </>)
      if (hStyle === 'curly') return (<>
        {([-15,-6,4,13] as number[]).map((dx,i) => (
          <ellipse key={i} cx={60+dx} cy={i%2===0 ? 16 : 12} rx="11" ry="12" fill={hair} />
        ))}
        <ellipse cx="60" cy="28" rx="32" ry="16" fill={hair} />
        <ellipse cx="28" cy="44" rx="8" ry="16" fill={hair} />
        <ellipse cx="92" cy="44" rx="8" ry="16" fill={hair} />
        {highlight}
      </>)
      // short/shaved girl: bob
      return (<>
        {topCap}
        <ellipse cx="27" cy="46" rx="6" ry="11" fill={hair} />
        <ellipse cx="93" cy="46" rx="6" ry="11" fill={hair} />
        {highlight}
      </>)
    }

    // BOY STYLES
    if (hStyle === 'bald') return null
    if (hStyle === 'shaved' || hStyle === 'buzz') return (
      <ellipse cx="60" cy="26" rx="33" ry="11" fill={hair} opacity="0.88" />
    )
    if (hStyle === 'curly') return (<>
      {([-14,-5,4,13] as number[]).map((dx,i) => (
        <ellipse key={i} cx={60+dx} cy={i%2===0 ? 17 : 13} rx="10" ry="11" fill={hair} />
      ))}
      <ellipse cx="60" cy="27" rx="33" ry="13" fill={hair} />
      <ellipse cx="28" cy="42" rx="7" ry="14" fill={hair} />
      <ellipse cx="92" cy="42" rx="7" ry="14" fill={hair} />
      {highlight}
    </>)
    if (hStyle === 'braided') return (<>
      {topCap}
      <rect x="27" y="28" width="7" height="18" rx="3" fill={hair} />
      <rect x="86" y="28" width="7" height="18" rx="3" fill={hair} />
      {highlight}
    </>)
    if (hStyle === 'ponytail') return (<>
      {topCap}
      <ellipse cx="28" cy="44" rx="6" ry="14" fill={hair} />
      <ellipse cx="92" cy="44" rx="6" ry="14" fill={hair} />
      <ellipse cx="60" cy="20" rx="4.5" ry="3.5" fill={dk(hair,0.52)} />
      {highlight}
    </>)
    if (hStyle === 'long') return (<>
      <ellipse cx="60" cy="24" rx="33" ry="15" fill={hair} />
      <rect x="26" y="26" width="8" height="28" rx="4" fill={hair} />
      <rect x="86" y="26" width="8" height="28" rx="4" fill={hair} />
      {highlight}
    </>)
    if (hStyle === 'spike') return (<>
      <ellipse cx="60" cy="24" rx="33" ry="15" fill={hair} />
      <path d="M38,22 L34,8 L42,18 L46,6 L52,18 L58,4 L64,18 L70,6 L76,18 L80,10 L82,22" fill={hair} />
      <rect x="27" y="28" width="7" height="20" rx="3.5" fill={hair} />
      <rect x="86" y="28" width="7" height="20" rx="3.5" fill={hair} />
      {highlight}
    </>)
    // Default: clean short boy
    return (<>
      <ellipse cx="60" cy="22" rx="33" ry="14" fill={hair} />
      <rect x="27" y="26" width="7" height="16" rx="3.5" fill={hair} />
      <rect x="86" y="26" width="7" height="16" rx="3.5" fill={hair} />
      {highlight}
    </>)
  }

  // ── Gear overlays ────────────────────────────────────────────────────────────

  function HatGearOverlay() {
    if (!gear?.head) return null
    const h = gear.head

    if (h === 'tactical-helmet' || h === 'combat-helmet' || h === 'flashlight-helmet') {
      return (<g>
        {/* Helmet dome */}
        <ellipse cx="60" cy="28" rx="34" ry="25" fill="#2a3a1a"/>
        <ellipse cx="60" cy="28" rx="34" ry="25" fill="#000" fillOpacity="0.12"/>
        {/* Visor brim */}
        <rect x="20" y="44" width="80" height="10" rx="4" fill="#1a2a0a"/>
        {/* NVG mount */}
        <rect x="46" y="12" width="28" height="8" rx="3" fill="#1a2a0a"/>
        {/* Chin strap hints */}
        <rect x="28" y="66" width="5" height="12" rx="2" fill="#1a2a0a" opacity="0.7"/>
        <rect x="87" y="66" width="5" height="12" rx="2" fill="#1a2a0a" opacity="0.7"/>
      </g>)
    }

    if (h === 'baseball-cap') {
      return (<g>
        <rect x="22" y="8" width="76" height="26" rx="12" fill="#cc2020"/>
        <rect x="14" y="28" width="60" height="9" rx="4" fill="#1a1a1a"/>
        <circle cx="60" cy="9" r="4" fill="#aa1010"/>
        <line x1="60" y1="10" x2="60" y2="34" stroke="#fff" strokeWidth="1" opacity="0.2"/>
      </g>)
    }

    if (h === 'starter-cap') {
      return (<g>
        <rect x="22" y="8" width="76" height="26" rx="12" fill="#3a2e7a"/>
        <rect x="14" y="28" width="60" height="9" rx="4" fill="#2a1e6a"/>
        <circle cx="60" cy="9" r="4" fill="#2a1e6a"/>
      </g>)
    }

    if (h === 'survivor-beanie') {
      return (<g>
        <ellipse cx="60" cy="24" rx="34" ry="22" fill="#4a2a1a"/>
        <circle cx="60" cy="8" r="10" fill="#6a3a2a"/>
        <rect x="26" y="38" width="68" height="4" rx="1" fill="#3a1a0a"/>
        <rect x="26" y="43" width="68" height="4" rx="1" fill="#3a1a0a"/>
      </g>)
    }

    return null
  }

  /** Bandana rendered before Goggles so goggles always appear on top. */
  function BandanaOverlay() {
    if (gear?.head !== 'survivor-bandana') return null
    return (<g>
      {/* Forehead band — sits above eyes (y≈47), below hairline (y≈28) */}
      <path d="M29,33 Q60,28 91,33 L91,43 Q60,48 29,43 Z" fill="#cc2020"/>
      {/* Top fold highlight */}
      <path d="M29,33 Q60,28 91,33 L91,37 Q60,32 29,37 Z" fill="#aa1010" opacity="0.5"/>
      {/* Fold crease line */}
      <line x1="29" y1="38" x2="91" y2="38" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8"/>
      {/* Knot tails at right side */}
      <path d="M89,34 L97,29 L94,40 Z" fill="#aa1010"/>
      <path d="M89,42 L97,48 L93,41 Z" fill="#aa1010"/>
    </g>)
  }

  function BeltGearOverlay() {
    if (!gear?.belt) return null
    const b = gear.belt

    if (b === 'survivor-rig') {
      return (<g>
        {/* Chest rig straps */}
        <path d="M40,82 L24,60" stroke="#2a3a18" strokeWidth="8" strokeLinecap="round"/>
        <path d="M80,82 L96,60" stroke="#2a3a18" strokeWidth="8" strokeLinecap="round"/>
        {/* Chest plate */}
        <rect x="40" y="94" width="40" height="28" rx="4" fill="#2a3a18"/>
        <rect x="40" y="94" width="40" height="28" rx="4" fill="none" stroke="#3a4a28" strokeWidth="1"/>
        {/* Pouches */}
        <rect x="28" y="98" width="12" height="16" rx="2" fill="#1a2a0a"/>
        <rect x="80" y="98" width="12" height="16" rx="2" fill="#1a2a0a"/>
      </g>)
    }

    if (b === 'legendary-war-belt') {
      return (<g>
        <rect x="24" y="126" width="72" height="10" rx="3" fill="#3a1a08"/>
        <rect x="52" y="122" width="16" height="18" rx="2" fill="#c8a820"/>
        <rect x="54" y="124" width="12" height="14" rx="1" fill="#8a6a00"/>
        {/* Holster */}
        <path d="M82,136 L96,136 L92,158 L86,158 Z" fill="#2a1008"/>
        {/* Studs */}
        {[30,38,44,78,84,90].map((x, i) => <circle key={i} cx={x} cy={131} r={2} fill="#c8a820"/>)}
      </g>)
    }

    if (b === 'tactical-belt') {
      return (<g>
        <rect x="24" y="126" width="72" height="10" rx="3" fill="#1a2a0a"/>
        <rect x="52" y="122" width="16" height="18" rx="2" fill="#4a5a3a"/>
        <rect x="82" y="126" width="10" height="10" rx="2" fill="#0a1a04"/>
        {/* MOLLE loops */}
        {[28,38,48,58,68].map((x, i) => <rect key={i} x={x} y={136} width="6" height="4" rx="1" fill="#0a1a04"/>)}
      </g>)
    }

    // Default belt (starter-belt, utility-belt, or any other accessory)
    return (<g>
      <rect x="24" y="126" width="72" height="8" rx="3" fill="#3a2010"/>
      <rect x="52" y="122" width="16" height="16" rx="2" fill="#888"/>
      <rect x="54" y="124" width="12" height="12" rx="1" fill="#0a0a0a"/>
    </g>)
  }

  function BackpackGearOverlay() {
    if (!gear?.backpack) return null
    const bp = gear.backpack

    const mainColor =
      bp === 'dimensional-pack' ? '#0a1a3a' :
      bp === 'tactical-pack'    ? '#2a3a1a' :
      bp === 'survival-duffel'  ? '#3a2a18' :
      bp === 'survival-pack'    ? '#7F1D1D' :
      bp === 'adventure-pack'   ? '#78350F' :
      bp === 'large-pack'       ? '#1A3A0F' :
      '#4B5563'

    return (<g>
      {/* Pack body — rendered behind character via layer order */}
      <rect x="8" y="76" width="26" height="50" rx="5" fill={mainColor}/>
      {/* Top flap */}
      <rect x="8" y="72" width="26" height="10" rx="3" fill={mainColor}/>
      {/* Strap over left shoulder */}
      <path d="M22,72 Q16,84 18,100" stroke={mainColor} strokeWidth="5" fill="none" strokeLinecap="round" opacity="0.9"/>
      {/* Glow for dimensional pack */}
      {bp === 'dimensional-pack' && (
        <rect x="10" y="82" width="22" height="24" rx="3" fill="none" stroke="#3dff7a" strokeWidth="1" opacity="0.6"/>
      )}
    </g>)
  }

  function SigItem() {
    if (sigItem === 'none') return null
    if (sigItem === 'wrench') return (
      <g transform="translate(108, 128)">
        <rect x="-4.5" y="-42" width="9" height="52" rx="4" fill="#8a8a8a" />
        <rect x="-4.5" y="-42" width="9" height="52" rx="4" fill="none" stroke="#666" strokeWidth="0.8" />
        <path d="M-10,-42 Q-10,-57 0,-60 Q10,-57 10,-42 L5,-42 Q5,-53 0,-55 Q-5,-53 -5,-42 Z" fill="#777" />
        <rect x="-10" y="-48" width="20" height="7" rx="2" fill="#666" />
      </g>
    )
    if (sigItem === 'broom') return (
      <g transform="translate(108, 128)">
        <rect x="-3" y="-42" width="6" height="58" rx="2.5" fill="#8a6030" />
        <path d="M-14,-42 L14,-42 L11,-57 L0,-60 L-11,-57 Z" fill="#c8a050" />
        <rect x="-14" y="-57" width="28" height="4" rx="1" fill={dk('#c8a050',0.25)} />
        {([-10,-5,0,5,10] as number[]).map(bx => (
          <line key={bx} x1={bx} y1="-42" x2={bx} y2="-56" stroke="#8a6030" strokeWidth="1.2" />
        ))}
      </g>
    )
    // Default: bat (ZOM-B-GONE)
    return (
      <g transform="translate(110, 128) rotate(12)">
        <rect x="-3.5" y="-44" width="7" height="44" rx="3" fill="#3a2010" />
        {([-4,-14,-24] as number[]).map(dy => (
          <rect key={dy} x="-3.5" y={dy-10} width="7" height="6" rx="1" fill="#1a1008" opacity="0.55" />
        ))}
        <rect x="-8" y="-82" width="16" height="42" rx="7" fill="#4a2a10" />
        <rect x="-8" y="-82" width="16" height="42" rx="7" fill="none" stroke="#2a1a08" strokeWidth="1.2" />
        <text x="0" y="-62" textAnchor="middle" fontSize="3.5" fill="#f97316" fontWeight="bold" fontFamily="monospace">ZOM-B</text>
        <text x="0" y="-55" textAnchor="middle" fontSize="3.5" fill="#f97316" fontWeight="bold" fontFamily="monospace">GONE</text>
        {([-72,-64,-56] as number[]).map(dy => (
          <circle key={dy} cx="6" cy={dy} r="1.5" fill="#aaa" />
        ))}
      </g>
    )
  }

  return (
    <svg
      viewBox={vb}
      width={width}
      height={cropToHead ? Math.round(width * 75 / 110) : H}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={style}
    >
      {/* 1. Ground shadow */}
      {!cropToHead && <ellipse cx="60" cy="192" rx="30" ry="6" fill="rgba(0,0,0,0.25)" />}
      {/* 2. Backpack gear overlay (behind everything) */}
      {!cropToHead && <BackpackGearOverlay />}
      {/* 3. Back hair */}
      <BackHair />
      {/* 4. Ears */}
      <Ears />
      {/* 5. Left arm */}
      {!cropToHead && <LeftArm />}
      {/* 6. Right arm */}
      {!cropToHead && <RightArm />}
      {/* 7. Legs */}
      {!cropToHead && <Legs />}
      {/* 8. Boots */}
      {!cropToHead && <Boots />}
      {/* 9. Body */}
      {!cropToHead && <Body />}
      {/* 10. Belt gear overlay (after body, before neck) */}
      {!cropToHead && <BeltGearOverlay />}
      {/* 11. Neck */}
      <Neck />
      {/* 12. Head */}
      <Head />
      {/* 13. Face */}
      <Face />
      {/* 14. Front hair */}
      <FrontHair />
      {/* 14.5. Bandana (forehead — before goggles so goggles stay topmost) */}
      <BandanaOverlay />
      {/* 15. Goggles (above hair and bandana) */}
      <Goggles />
      {/* 16. Hat gear overlay (helmets/caps — on top of goggles) */}
      <HatGearOverlay />
      {/* 17. Sig item */}
      {!cropToHead && <SigItem />}
    </svg>
  )
}
