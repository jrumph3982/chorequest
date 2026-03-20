'use client'

import { THEMES, THEME_IDS } from '@/lib/constants/themes'

interface Props {
  value: string
  onChange: (themeId: string) => void
}

export function ThemeSelector({ value, onChange }: Props) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-[#22c55e] text-sm">🌍</span>
        <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Choose Adventure World</h3>
      </div>
      <div className="space-y-2">
        {THEME_IDS.map((id) => {
          const theme = THEMES[id]
          const isSelected = value === id
          return (
            <button
              key={id}
              type="button"
              onClick={() => onChange(id)}
              className="w-full text-left transition-all active:scale-[0.99]"
              style={{
                background: isSelected ? `rgba(${hexToRgb(theme.colors.primary)}, 0.06)` : '#0f172a',
                border: isSelected
                  ? `2px solid ${theme.colors.primary}`
                  : '2px solid #334155',
                borderRadius: 12,
                padding: '12px 14px',
                boxShadow: isSelected ? `0 0 16px rgba(${hexToRgb(theme.colors.primary)}, 0.2)` : 'none',
              }}
            >
              <div className="flex items-start gap-3">
                <span className="text-2xl leading-none mt-0.5">{theme.icon}</span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span
                      className="text-sm font-bold"
                      style={{ color: isSelected ? theme.colors.primary : '#e2e8f0' }}
                    >
                      {theme.name}
                    </span>
                    {isSelected && (
                      <span
                        className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                        style={{ background: theme.colors.primary, color: '#020202' }}
                      >
                        ✓ SELECTED
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mb-2">{theme.tagline}</p>
                  <div className="grid grid-cols-2 gap-1">
                    {theme.features.map((f) => (
                      <span
                        key={f}
                        className="text-[10px] px-2 py-1 rounded-md"
                        style={{
                          background: 'rgba(255,255,255,0.04)',
                          border: '1px solid #334155',
                          color: '#64748b',
                        }}
                      >
                        {f}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </button>
          )
        })}
      </div>
      <p className="text-[10px] text-slate-600 text-center italic">
        The child can change their world anytime from their profile.
      </p>
    </div>
  )
}

function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex)
  if (!result) return '0,0,0'
  return `${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)}`
}
