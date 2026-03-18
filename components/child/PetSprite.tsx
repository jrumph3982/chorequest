function darken(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.max(0, (n >> 16) - Math.round(2.55 * pct))
  const g = Math.max(0, ((n >> 8) & 0xff) - Math.round(2.55 * pct))
  const b = Math.max(0, (n & 0xff) - Math.round(2.55 * pct))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function lighten(hex: string, pct: number): string {
  const n = parseInt(hex.replace('#', ''), 16)
  const r = Math.min(255, (n >> 16) + Math.round(2.55 * pct))
  const g = Math.min(255, ((n >> 8) & 0xff) + Math.round(2.55 * pct))
  const b = Math.min(255, (n & 0xff) + Math.round(2.55 * pct))
  return '#' + [r, g, b].map((v) => v.toString(16).padStart(2, '0')).join('')
}

function Dog({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <ellipse cx="20" cy="26" rx="13" ry="9" fill={c} />
      <circle cx="20" cy="14" r="9" fill={c} />
      <ellipse cx="12" cy="11" rx="5" ry="7" fill={dk} transform="rotate(-15,12,11)" />
      <ellipse cx="28" cy="11" rx="5" ry="7" fill={dk} transform="rotate(15,28,11)" />
      <circle cx="16" cy="13" r="2.5" fill="#fff" />
      <circle cx="24" cy="13" r="2.5" fill="#fff" />
      <circle cx="17" cy="13" r="1.5" fill="#1a0e06" />
      <circle cx="25" cy="13" r="1.5" fill="#1a0e06" />
      <circle cx="17.6" cy="12.4" r="0.6" fill="#fff" />
      <circle cx="25.6" cy="12.4" r="0.6" fill="#fff" />
      <ellipse cx="20" cy="17" rx="3" ry="2" fill="#1a0e06" />
      <path d="M17,19 Q20,23 23,19" fill="#ff9090" stroke="none" />
      <path d="M33,23 Q38,17 35,25" fill="none" stroke={c} strokeWidth="3.5" strokeLinecap="round" />
      <rect x="11" y="32" width="4" height="5" rx="2" fill={dk} />
      <rect x="17" y="32" width="4" height="5" rx="2" fill={dk} />
      <rect x="21" y="32" width="4" height="5" rx="2" fill={dk} />
      <rect x="26" y="32" width="4" height="5" rx="2" fill={dk} />
    </g>
  )
}

function Cat({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <ellipse cx="20" cy="26" rx="11" ry="8" fill={c} />
      <circle cx="20" cy="14" r="8" fill={c} />
      <polygon points="12,9 8,1 17,7" fill={c} />
      <polygon points="28,9 32,1 23,7" fill={c} />
      <polygon points="13,8 10,2.5 16,6.5" fill="#ffb0c0" />
      <polygon points="27,8 30,2.5 24,6.5" fill="#ffb0c0" />
      <ellipse cx="16" cy="13" rx="3" ry="2.5" fill="#60c060" />
      <ellipse cx="24" cy="13" rx="3" ry="2.5" fill="#60c060" />
      <rect x="15" y="11.5" width="2" height="3" rx="1" fill="#1a0e06" />
      <rect x="23" y="11.5" width="2" height="3" rx="1" fill="#1a0e06" />
      <circle cx="15.5" cy="12.5" r="0.6" fill="#fff" />
      <circle cx="23.5" cy="12.5" r="0.6" fill="#fff" />
      <polygon points="20,17 18.5,18.5 21.5,18.5" fill="#ff9090" />
      <line x1="8" y1="16" x2="15" y2="17" stroke={dk} strokeWidth="0.9" />
      <line x1="8" y1="18" x2="15" y2="18" stroke={dk} strokeWidth="0.9" />
      <line x1="25" y1="17" x2="32" y2="16" stroke={dk} strokeWidth="0.9" />
      <line x1="25" y1="18" x2="32" y2="18" stroke={dk} strokeWidth="0.9" />
      <path d="M32,24 Q38,16 36,29 Q34,33 31,31" fill="none" stroke={c} strokeWidth="3" strokeLinecap="round" />
      <rect x="12" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="17" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="21" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="25" y="31" width="4" height="5" rx="2" fill={dk} />
    </g>
  )
}

function Rabbit({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <ellipse cx="20" cy="27" rx="10" ry="9" fill={c} />
      <circle cx="20" cy="15" r="8" fill={c} />
      <rect x="14" y="1" width="5" height="16" rx="2.5" fill={c} />
      <rect x="21" y="1" width="5" height="16" rx="2.5" fill={c} />
      <rect x="15" y="2" width="3" height="13" rx="1.5" fill="#ffb0c0" />
      <rect x="22" y="2" width="3" height="13" rx="1.5" fill="#ffb0c0" />
      <circle cx="16" cy="15" r="2.5" fill="#1a0e06" />
      <circle cx="24" cy="15" r="2.5" fill="#1a0e06" />
      <circle cx="16.6" cy="14.4" r="0.8" fill="#fff" />
      <circle cx="24.6" cy="14.4" r="0.8" fill="#fff" />
      <circle cx="20" cy="19" r="2" fill="#ff9090" />
      <circle cx="30" cy="29" r="3.5" fill="#fff" />
      <rect x="13" y="33" width="4" height="4" rx="2" fill={dk} />
      <rect x="18" y="33" width="4" height="4" rx="2" fill={dk} />
      <rect x="22" y="33" width="4" height="4" rx="2" fill={dk} />
      <rect x="26" y="33" width="4" height="4" rx="2" fill={dk} />
    </g>
  )
}

function Hamster({ c, dk, lt }: { c: string; dk: string; lt: string }) {
  return (
    <g>
      <ellipse cx="20" cy="27" rx="13" ry="10" fill={c} />
      <circle cx="20" cy="15" r="11" fill={c} />
      <circle cx="11" cy="18" r="5" fill={lt} />
      <circle cx="29" cy="18" r="5" fill={lt} />
      <circle cx="12" cy="7" r="4" fill={dk} />
      <circle cx="28" cy="7" r="4" fill={dk} />
      <circle cx="12" cy="7" r="2.5" fill="#ffb0c0" />
      <circle cx="28" cy="7" r="2.5" fill="#ffb0c0" />
      <circle cx="16" cy="14" r="2.5" fill="#1a0e06" />
      <circle cx="24" cy="14" r="2.5" fill="#1a0e06" />
      <circle cx="16.7" cy="13.3" r="0.8" fill="#fff" />
      <circle cx="24.7" cy="13.3" r="0.8" fill="#fff" />
      <ellipse cx="20" cy="19" rx="2" ry="1.5" fill="#1a0e06" />
      <rect x="14" y="35" width="4" height="3" rx="1.5" fill={dk} />
      <rect x="22" y="35" width="4" height="3" rx="1.5" fill={dk} />
    </g>
  )
}

function Parrot({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <path d="M14,31 Q10,37 12,37" fill={dk} />
      <path d="M20,32 Q18,37 20,37" fill={c} />
      <path d="M26,31 Q30,37 28,37" fill={dk} />
      <ellipse cx="20" cy="24" rx="10" ry="10" fill={c} />
      <ellipse cx="14" cy="25" rx="5" ry="8" fill={dk} transform="rotate(-10,14,25)" />
      <circle cx="20" cy="12" r="9" fill={c} />
      <path d="M15,5 Q13,1 16,3" fill={dk} />
      <path d="M20,4 Q20,0 21.5,2" fill={c} />
      <path d="M25,5 Q27,1 24,3" fill={dk} />
      <circle cx="17" cy="12" r="3" fill="#fff" />
      <circle cx="17" cy="12" r="2" fill="#1a0e06" />
      <circle cx="17.5" cy="11.5" r="0.7" fill="#fff" />
      <path d="M22,11 L27,13 L22,15 Z" fill="#f29d26" />
    </g>
  )
}

function Drone({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <rect x="10" y="18" width="20" height="10" rx="4" fill={c} />
      <rect x="14" y="15" width="12" height="6" rx="3" fill={dk} />
      <circle cx="20" cy="18" r="3" fill="#3db4ff" opacity="0.8" />
      <ellipse cx="8" cy="16" rx="7" ry="2.5" fill={dk} opacity="0.7" />
      <ellipse cx="32" cy="16" rx="7" ry="2.5" fill={dk} opacity="0.7" />
      <rect x="6" y="14" width="4" height="4" rx="2" fill={c} />
      <rect x="30" y="14" width="4" height="4" rx="2" fill={c} />
      <circle cx="8" cy="16" r="1.5" fill="#3db4ff" />
      <circle cx="32" cy="16" r="1.5" fill="#3db4ff" />
      <rect x="18" y="28" width="4" height="6" rx="1" fill={dk} />
      <line x1="12" y1="28" x2="10" y2="33" stroke={dk} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="28" y1="28" x2="30" y2="33" stroke={dk} strokeWidth="1.5" strokeLinecap="round" />
    </g>
  )
}

function Raccoon({ c, dk }: { c: string; dk: string }) {
  return (
    <g>
      <ellipse cx="20" cy="26" rx="11" ry="8" fill={c} />
      <circle cx="20" cy="14" r="8" fill={c} />
      <ellipse cx="12" cy="10" rx="5" ry="6" fill={dk} transform="rotate(-10,12,10)" />
      <ellipse cx="28" cy="10" rx="5" ry="6" fill={dk} transform="rotate(10,28,10)" />
      {/* Eye mask */}
      <ellipse cx="16" cy="13" rx="4" ry="3" fill="#222" />
      <ellipse cx="24" cy="13" rx="4" ry="3" fill="#222" />
      <circle cx="16" cy="13" r="2.2" fill="#fff" />
      <circle cx="24" cy="13" r="2.2" fill="#fff" />
      <circle cx="17" cy="13" r="1.3" fill="#1a0e06" />
      <circle cx="25" cy="13" r="1.3" fill="#1a0e06" />
      <circle cx="17.5" cy="12.5" r="0.5" fill="#fff" />
      <circle cx="25.5" cy="12.5" r="0.5" fill="#fff" />
      <ellipse cx="20" cy="17" rx="3" ry="2" fill="#1a0e06" />
      {/* Striped tail */}
      <path d="M31,22 Q38,15 36,26 Q34,32 30,30" fill="none" stroke={c} strokeWidth="4" strokeLinecap="round" />
      <path d="M31,22 Q38,15 36,26 Q34,32 30,30" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeDasharray="3,3" />
      <rect x="12" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="17" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="21" y="31" width="4" height="5" rx="2" fill={dk} />
      <rect x="25" y="31" width="4" height="5" rx="2" fill={dk} />
    </g>
  )
}

interface Props {
  type: string
  color?: string
  size?: number
}

export function PetSprite({ type, color = '#c87a3a', size = 40 }: Props) {
  const t = (type ?? 'dog').toLowerCase()
  const dk = darken(color, 15)
  const lt = lighten(color, 20)

  return (
    <svg
      viewBox="0 0 40 40"
      width={size}
      height={size}
      style={{ display: 'block', overflow: 'visible' }}
    >
      {t === 'dog'     && <Dog     c={color} dk={dk} />}
      {t === 'cat'     && <Cat     c={color} dk={dk} />}
      {t === 'rabbit'  && <Rabbit  c={color} dk={dk} />}
      {t === 'hamster' && <Hamster c={color} dk={dk} lt={lt} />}
      {t === 'parrot'  && <Parrot  c={color} dk={dk} />}
      {t === 'drone'   && <Drone   c={color} dk={dk} />}
      {t === 'raccoon' && <Raccoon c={color} dk={dk} />}
    </svg>
  )
}
