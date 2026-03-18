'use client'

import { useState } from 'react'
import {
  HAIR_STYLES,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_COLORS,
  HAIR_COLOR_SWATCH,
  SKIN_TONE_SWATCH,
  EYE_COLOR_SWATCH,
} from '@/lib/constants/appearance'
import { CharacterRenderer } from '@/components/child/CharacterRenderer'

interface Props {
  gender: 'boy' | 'girl' | ''
  skinTone: string
  hairStyle: string
  hairColor: string
  eyeColor: string
  onGenderChange: (value: 'boy' | 'girl' | '') => void
  onSkinToneChange: (value: string) => void
  onHairStyleChange: (value: string) => void
  onHairColorChange: (value: string) => void
  onEyeColorChange: (value: string) => void
}

type Tab = 'skin' | 'eyes' | 'hair'

export function ChildAppearanceFields({
  gender,
  skinTone,
  hairStyle,
  hairColor,
  eyeColor,
  onGenderChange,
  onSkinToneChange,
  onHairStyleChange,
  onHairColorChange,
  onEyeColorChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('skin')

  return (
    <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
      <div className="flex items-center gap-3">
        <div className="bg-[#0f172a] rounded-xl p-3 flex items-end justify-center"
          style={{ width: 90, height: 100, border: '1px solid rgba(242,157,38,0.2)' }}>
          <CharacterRenderer
            gender={gender || null}
            hairStyle={hairStyle || null}
            hairColor={hairColor || null}
            skinTone={skinTone || null}
            eyeColor={eyeColor || null}
            width={70}
            animate={false}
          />
        </div>
        <div className="flex-1">
          <p className="text-xs font-bold text-slate-300 mb-1">Appearance Preview</p>
          <div className="grid grid-cols-2 gap-2">
            {(['boy', 'girl'] as const).map((g) => (
              <button key={g} type="button" onClick={() => onGenderChange(gender === g ? '' : g)}
                className={`py-2 rounded-lg text-xs font-bold capitalize transition-all border ${
                  gender === g
                    ? 'bg-[#f29d26]/10 border-[#f29d26] text-[#f29d26]'
                    : 'bg-[#0f172a] border-[#334155] text-slate-400'
                }`}>
                {g === 'boy' ? '🧒' : '👧'} {g}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-2">
        {(['skin', 'eyes', 'hair'] as const).map((t) => (
          <button key={t} type="button" onClick={() => setTab(t)}
            className="flex-1 py-1.5 rounded-lg text-xs font-bold capitalize transition-all"
            style={tab === t
              ? { background: '#22c55e', color: '#052e16' }
              : { background: 'rgba(255,255,255,0.06)', color: '#64748b' }}>
            {t === 'skin' ? '🎨 Skin' : t === 'eyes' ? '👁️ Eyes' : '✂️ Hair'}
          </button>
        ))}
      </div>

      {tab === 'skin' && (
        <div className="grid grid-cols-5 gap-2">
          {SKIN_TONES.map((t) => (
            <button key={t} type="button" onClick={() => onSkinToneChange(t === skinTone ? '' : t)} title={t}
              className={`aspect-square rounded-xl transition-all ${SKIN_TONE_SWATCH[t]}`}
              style={{ border: skinTone === t ? '3px solid #22c55e' : '3px solid transparent', outline: '1px solid rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
      )}

      {tab === 'eyes' && (
        <div className="grid grid-cols-4 gap-2">
          {EYE_COLORS.map((c) => (
            <button key={c} type="button" onClick={() => onEyeColorChange(c === eyeColor ? '' : c)} title={c}
              className={`aspect-square rounded-xl transition-all ${EYE_COLOR_SWATCH[c]}`}
              style={{ border: eyeColor === c ? '3px solid #22c55e' : '3px solid transparent', outline: '1px solid rgba(255,255,255,0.08)' }}
            />
          ))}
        </div>
      )}

      {tab === 'hair' && (
        <div className="space-y-3">
          <div className="grid grid-cols-3 gap-2">
            {HAIR_STYLES.map((s) => (
              <button key={s} type="button" onClick={() => onHairStyleChange(s === hairStyle ? '' : s)}
                className="py-2 rounded-lg text-[10px] font-bold transition-all"
                style={{
                  border: hairStyle === s ? '2px solid #22c55e' : '2px solid rgba(255,255,255,0.07)',
                  background: hairStyle === s ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
                  color: hairStyle === s ? '#86efac' : '#64748b',
                }}>
                {s}
              </button>
            ))}
          </div>
          <div className="grid grid-cols-4 gap-2">
            {HAIR_COLORS.map((c) => (
              <button key={c} type="button" onClick={() => onHairColorChange(c === hairColor ? '' : c)}
                title={c}
                className={`aspect-square rounded-xl transition-all ${HAIR_COLOR_SWATCH[c]}`}
                style={{ border: hairColor === c ? '3px solid #22c55e' : '3px solid transparent', outline: '1px solid rgba(255,255,255,0.08)' }}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
