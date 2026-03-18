// Server component — no client state needed
const THREAT_LABEL: Record<string, string> = {
  none:     '🟢 CLEAR',
  low:      '🟡 LOW',
  moderate: '🟠 MOD',
  high:     '🔴 HIGH',
  critical: '💀 CRIT',
}

const THREAT_STYLE: Record<string, string> = {
  none:     'bg-[#22c55e]/10 border-[#22c55e]/30 text-[#22c55e]',
  low:      'bg-yellow-500/10 border-yellow-500/30 text-yellow-300',
  moderate: 'bg-orange-500/10 border-orange-500/30 text-orange-300',
  high:     'bg-red-500/10 border-red-500/30 text-red-400',
  critical: 'bg-red-700/10 border-red-600/40 text-red-300 animate-pulse',
}

interface Props {
  name: string
  level: number
  xpProgress: number
  scrap: number
  threat: string
  streakCount: number
}

export function TopHUD({ name, level, xpProgress, scrap, threat, streakCount }: Props) {
  const threatStyle = THREAT_STYLE[threat] ?? THREAT_STYLE.none
  const threatLabel = THREAT_LABEL[threat] ?? THREAT_LABEL.none

  return (
    <div
      className="flex-shrink-0 px-3 pt-2.5 pb-2"
      style={{
        background: '#040804',
        borderBottom: '2px solid #1a3018',
      }}
    >
      {/* Row 1: avatar + name/level + scrap + threat */}
      <div className="flex items-center gap-2.5 mb-2">
        {/* Avatar */}
        <div
          className="rounded-full flex items-center justify-center text-lg shrink-0 border-2"
          style={{
            width: 40, height: 40,
            background: 'rgba(61,255,122,0.10)',
            borderColor: 'rgba(61,255,122,0.4)',
          }}
        >
          🧟
        </div>

        {/* Name + level */}
        <div className="flex-1 min-w-0">
          <p
            className="uppercase leading-tight"
            style={{ color: '#3dff7a', fontSize: 9, fontWeight: 900, letterSpacing: 2 }}
          >
            LV.{level} SURVIVOR
          </p>
          <p className="leading-tight truncate" style={{ fontFamily: "'Bungee', sans-serif", fontSize: 17, color: '#fff' }}>{name}</p>
        </div>

        {/* Streak badge */}
        {streakCount > 0 && (
          <div
            className="flex items-center gap-1 px-2 py-0.5 rounded-full"
            style={{ background: 'rgba(255,107,0,0.1)', border: '1px solid #1a3018' }}
          >
            <span className="text-xs">🔥</span>
            <span className="text-[10px] font-bold text-[#ff6b00]">{streakCount}d</span>
          </div>
        )}

        {/* Scrap */}
        <div
          className="flex items-center gap-1.5 px-2.5 rounded-full border shrink-0"
          style={{
            minHeight: 44,
            background: '#080e08',
            border: '1px solid #1a3018',
          }}
        >
          <span className="text-sm leading-none">🔩</span>
          <span className="text-sm font-bold" style={{ color: '#f29d26' }}>
            {scrap.toLocaleString()}
          </span>
        </div>

        {/* Threat */}
        <div
          className={`flex items-center px-2 py-0.5 rounded-full border text-[9px] font-black uppercase tracking-wide shrink-0 ${threatStyle}`}
          style={{ minHeight: 44 }}
        >
          {threatLabel}
        </div>
      </div>

      {/* Row 2: XP bar */}
      <div className="flex items-center gap-2">
        <div
          className="flex-1 rounded-full overflow-hidden"
          style={{ height: 3, background: '#1a3018' }}
        >
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${xpProgress}%`,
              background: 'linear-gradient(to right, #16a34a, #4ade80)',
              boxShadow: '0 0 6px rgba(34,197,94,0.6)',
            }}
          />
        </div>
        <span className="text-[9px] font-bold shrink-0 leading-none" style={{ color: '#2a4a28' }}>
          {xpProgress}%→LV{level + 1}
        </span>
      </div>
    </div>
  )
}
