'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  HAIR_STYLES,
  HAIR_COLORS,
  SKIN_TONES,
  EYE_COLORS,
  HAIR_COLOR_SWATCH,
  SKIN_TONE_SWATCH,
  EYE_COLOR_SWATCH,
} from '@/lib/constants/appearance'
import { CharacterSprite } from '@/components/child/CharacterSprite'

type Tab = 'face' | 'hair' | 'gear'

const HAIR_STYLE_ICON: Record<string, string> = {
  Short:    '🧑',
  Long:     '💇',
  Curly:    '〰️',
  Braided:  '🧶',
  Shaved:   '⚡',
  Ponytail: '🎀',
}

interface Props {
  initialHairStyle: string | null
  initialHairColor: string | null
  initialSkinTone:  string | null
  initialEyeColor:  string | null
}

export function AppearanceForm({
  initialHairStyle,
  initialHairColor,
  initialSkinTone,
  initialEyeColor,
}: Props) {
  const router  = useRouter()
  const [tab,       setTab]       = useState<Tab>('face')
  const [hairStyle, setHairStyle] = useState(initialHairStyle ?? '')
  const [hairColor, setHairColor] = useState(initialHairColor ?? '')
  const [skinTone,  setSkinTone]  = useState(initialSkinTone  ?? '')
  const [eyeColor,  setEyeColor]  = useState(initialEyeColor  ?? '')
  const [saving,    setSaving]    = useState(false)
  const [saved,     setSaved]     = useState(false)
  const [error,     setError]     = useState('')

  const hasSelection = !!(hairStyle || hairColor || skinTone || eyeColor)

  async function save() {
    setSaving(true)
    setError('')
    setSaved(false)

    const body: Record<string, string> = {}
    if (hairStyle) body.hairStyle = hairStyle
    if (hairColor) body.hairColor = hairColor
    if (skinTone)  body.skinTone  = skinTone
    if (eyeColor)  body.eyeColor  = eyeColor

    const res = await fetch('/api/child/profile/appearance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSaved(true)
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Save failed')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col bg-[#221b10] text-slate-100">

      {/* Character Preview */}
      <div className="flex flex-col items-center justify-center relative px-6 py-8">
        {/* Green aura glow */}
        <div className="absolute w-56 h-56 rounded-full blur-[70px] bg-[#22c55e]/10 pointer-events-none" />

        {/* Character sprite */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="w-56 h-64 rounded-xl bg-gradient-to-b from-transparent to-slate-900/30 flex items-end justify-center">
            <CharacterSprite
              hairStyle={hairStyle || null}
              hairColor={hairColor || null}
              skinTone={skinTone   || null}
              eyeColor={eyeColor   || null}
              width={140}
              animate={true}
            />
          </div>
          {/* Floor shadow */}
          <div className="w-28 h-4 bg-black/40 rounded-full blur-md -mt-2" />
        </div>

        {/* Name tag */}
        <div className="mt-5 px-6 py-2 rounded-lg border border-[#22c55e]/30 bg-[#221b10]/80 backdrop-blur-sm">
          <p className="text-xs font-bold text-[#22c55e] text-center tracking-widest uppercase">
            {[skinTone, hairColor, hairStyle].filter(Boolean).join(' · ') || 'NEW RECRUIT'}
          </p>
        </div>
      </div>

      {/* Customization Panel */}
      <div
        className="rounded-t-2xl p-5 space-y-6"
        style={{
          background: 'rgba(34,27,16,0.95)',
          backdropFilter: 'blur(10px)',
          border: '2px solid rgba(242,157,38,0.3)',
          borderBottom: 'none',
        }}
      >
        {/* Tabs */}
        <div className="flex items-center bg-slate-900/60 rounded-full p-1 border border-slate-700">
          {(['face', 'hair', 'gear'] as Tab[]).map((t) => (
            <button
              key={t}
              onClick={() => t !== 'gear' && setTab(t)}
              disabled={t === 'gear'}
              className={`flex-1 py-2 rounded-full font-bold text-xs uppercase transition-all flex items-center justify-center gap-1.5 ${
                tab === t
                  ? 'bg-[#22c55e] text-slate-900'
                  : t === 'gear'
                  ? 'text-slate-600 cursor-not-allowed'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <span className="text-sm">
                {t === 'face' ? '😊' : t === 'hair' ? '✂️' : '🎽'}
              </span>
              {t}
            </button>
          ))}
        </div>

        {/* ── FACE TAB ── */}
        {tab === 'face' && (
          <div className="space-y-5">
            {/* Skin Tone */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Skin Tone</label>
                {skinTone && (
                  <span className="text-[10px] text-[#22c55e] font-mono">{skinTone}</span>
                )}
              </div>
              <div className="flex gap-3 overflow-x-auto pb-1">
                {SKIN_TONES.map((t) => (
                  <button
                    key={t}
                    onClick={() => setSkinTone(t === skinTone ? '' : t)}
                    title={t}
                    className={`w-12 h-12 rounded-full shrink-0 border-4 transition-all ${
                      skinTone === t
                        ? 'border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.5)] scale-110'
                        : 'border-transparent hover:scale-105'
                    } ${SKIN_TONE_SWATCH[t]}`}
                  />
                ))}
              </div>
            </div>

            {/* Eye Color */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Eye Color</label>
              <div className="flex gap-4">
                {EYE_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setEyeColor(c === eyeColor ? '' : c)}
                    title={c}
                    className={`w-9 h-9 rounded-full border-4 transition-all ${
                      eyeColor === c
                        ? 'border-[#22c55e] shadow-[0_0_10px_rgba(34,197,94,0.5)] scale-110'
                        : 'border-transparent hover:scale-105'
                    } ${EYE_COLOR_SWATCH[c]}`}
                  />
                ))}
              </div>
              {eyeColor && (
                <p className="text-[10px] text-[#22c55e] font-mono">{eyeColor}</p>
              )}
            </div>
          </div>
        )}

        {/* ── HAIR TAB ── */}
        {tab === 'hair' && (
          <div className="space-y-5">
            {/* Hair Style */}
            <div className="space-y-3">
              <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hair Style</label>
              <div className="grid grid-cols-4 gap-3">
                {HAIR_STYLES.map((s) => (
                  <button
                    key={s}
                    onClick={() => setHairStyle(s === hairStyle ? '' : s)}
                    className={`aspect-square rounded-lg flex flex-col items-center justify-center gap-1 border-2 transition-all ${
                      hairStyle === s
                        ? 'border-[#22c55e] bg-[#22c55e]/10 shadow-[0_0_12px_rgba(34,197,94,0.3)]'
                        : 'border-slate-700 bg-slate-800 hover:border-slate-500'
                    }`}
                  >
                    <span className="text-xl">{HAIR_STYLE_ICON[s] ?? '💈'}</span>
                    <span className="text-[9px] font-bold uppercase tracking-tight text-slate-400">{s}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Hair Color */}
            <div className="space-y-3">
              <div className="flex justify-between items-end">
                <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">Hair Color</label>
                {hairColor && (
                  <span className="text-[10px] text-[#22c55e] font-mono">{hairColor}</span>
                )}
              </div>
              <div className="flex gap-3 flex-wrap">
                {HAIR_COLORS.map((c) => (
                  <button
                    key={c}
                    onClick={() => setHairColor(c === hairColor ? '' : c)}
                    title={c}
                    className={`w-10 h-10 rounded-full border-4 transition-all ${
                      hairColor === c
                        ? 'border-[#22c55e] shadow-[0_0_12px_rgba(34,197,94,0.5)] scale-110'
                        : 'border-transparent hover:scale-105'
                    } ${HAIR_COLOR_SWATCH[c]}`}
                  />
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ── GEAR TAB ── */}
        {tab === 'gear' && (
          <div className="flex flex-col items-center gap-3 py-6 text-slate-500">
            <span className="text-4xl">🔒</span>
            <p className="text-sm font-bold uppercase tracking-widest">Gear Unlocks via Shop</p>
          </div>
        )}
      </div>

      {/* Sticky Save Button */}
      <div className="sticky bottom-0 px-5 py-4 bg-[#221b10] border-t border-[#f29d26]/10">
        {error && (
          <p className="text-red-400 text-sm text-center mb-2">{error}</p>
        )}
        <button
          onClick={save}
          disabled={saving || !hasSelection}
          className="w-full flex items-center justify-center gap-3 font-extrabold text-base py-4 rounded-xl uppercase italic tracking-wider transition-all active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            background: saving || !hasSelection ? 'rgba(34,197,94,0.3)' : '#22c55e',
            color: '#0a1a0c',
            boxShadow: hasSelection && !saving ? '0 0 28px rgba(34,197,94,0.35)' : 'none',
          }}
        >
          <span className="text-lg">
            {saving ? '⏳' : saved ? '✓' : '✔'}
          </span>
          {saving ? 'Saving…' : saved ? 'Saved!' : 'Save Look'}
        </button>
      </div>
    </div>
  )
}
