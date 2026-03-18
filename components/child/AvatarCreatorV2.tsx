'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'
import { SKIN_COLORS, HAIR_COLORS, EYE_IRIS_COLORS } from '@/lib/constants/avatar-map'
import { useAvatar } from '@/lib/context/AvatarContext'
import type { SigItem, EyeStyleT } from '@/lib/context/AvatarContext'

type Tab = 'gender' | 'hair' | 'face' | 'outfit' | 'gear' | 'signature'

const TABS: { id: Tab; label: string; icon: string }[] = [
  { id: 'gender',    label: 'Gender',    icon: '🧬' },
  { id: 'hair',      label: 'Hair',      icon: '✂️' },
  { id: 'face',      label: 'Face',      icon: '👁️' },
  { id: 'outfit',    label: 'Outfit',    icon: '🎽' },
  { id: 'gear',      label: 'Gear',      icon: '🥽' },
  { id: 'signature', label: 'Weapon',    icon: '🔨' },
]

const BOY_STYLES  = ['Bald', 'Spike', 'Short']
const GIRL_STYLES = ['Curly', 'Long', 'Ponytail']

const JACKET_COLORS = [
  { label: 'Olive',  hex: '#2a4a2a' },
  { label: 'Forest', hex: '#1a3a1a' },
  { label: 'Navy',   hex: '#1a2a4a' },
  { label: 'Brown',  hex: '#4a2a1a' },
  { label: 'Gray',   hex: '#3a3a3a' },
  { label: 'Black',  hex: '#1a1a1a' },
]
const PANTS_COLORS = [
  { label: 'Slate', hex: '#2a3a4a' },
  { label: 'Olive', hex: '#3a4a2a' },
  { label: 'Brown', hex: '#3a2a1a' },
  { label: 'Black', hex: '#1a1a1a' },
]
const GOGGLE_COLORS = [
  { label: 'Orange', hex: '#f97316' },
  { label: 'Yellow', hex: '#f5d073' },
  { label: 'Red',    hex: '#ef4444' },
  { label: 'Blue',   hex: '#3b82f6' },
  { label: 'Green',  hex: '#22c55e' },
  { label: 'White',  hex: '#e2e8f0' },
]
const EYE_STYLES: { id: EyeStyleT; label: string }[] = [
  { id: 'round',  label: 'Round' },
  { id: 'almond', label: 'Almond' },
  { id: 'wide',   label: 'Wide' },
  { id: 'squint', label: 'Squint' },
]

// Props kept for API compat but context is the source of truth
interface Props {
  initialHairStyle?: string | null
  initialHairColor?: string | null
  initialSkinTone?:  string | null
  initialEyeColor?:  string | null
  initialGender?:    string | null
}

export function AvatarCreatorV2(_props: Props) {
  const router = useRouter()
  const { avatar, setField } = useAvatar()
  const [tab,    setTab]    = useState<Tab>('gender')
  const [saving, setSaving] = useState(false)
  const [saved,  setSaved]  = useState(false)
  const [error,  setError]  = useState('')

  const { gender, hairStyle, hairColor, skinTone, eyeColor, eyeStyle, freckles,
          jacketColor, pantsColor, goggleColor, sigItem } = avatar

  async function save() {
    setSaving(true); setError(''); setSaved(false)
    const res = await fetch('/api/child/profile/appearance', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        gender, hairStyle, hairColor, skinTone, eyeColor,
        eyeStyle, freckles, jacketColor, pantsColor, goggleColor, sigItem,
      }),
    })
    if (res.ok) { setSaved(true); router.refresh() }
    else { const d = await res.json(); setError(d.error ?? 'Save failed') }
    setSaving(false)
  }

  // Auto-save with 800ms debounce whenever avatar state changes
  const firstRender = useRef(true)
  useEffect(() => {
    if (firstRender.current) { firstRender.current = false; return }
    const timer = setTimeout(() => {
      fetch('/api/child/profile/appearance', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          gender, hairStyle, hairColor, skinTone, eyeColor,
          eyeStyle, freckles, jacketColor, pantsColor, goggleColor, sigItem,
        }),
      }).catch(() => {/* silent auto-save failure */})
    }, 800)
    return () => clearTimeout(timer)
  }, [gender, hairStyle, hairColor, skinTone, eyeColor, eyeStyle, freckles,
      jacketColor, pantsColor, goggleColor, sigItem])

  const avatarProps = { gender, skinTone, hairColor, hairStyle, eyeColor, eyeStyle, freckles, jacketColor, pantsColor, goggleColor, sigItem }

  // Ghost style variants
  const hairStyles = gender === 'girl' ? GIRL_STYLES : BOY_STYLES
  const curIdx = hairStyles.indexOf(hairStyle)
  const prevStyle = hairStyles[(curIdx - 1 + hairStyles.length) % hairStyles.length]
  const nextStyle = hairStyles[(curIdx + 1) % hairStyles.length]

  return (
    <div className="flex flex-col min-h-screen" style={{ background: '#0d1117', color: '#e2e8f0' }}>

      {/* ── PREVIEW ── */}
      <div className="relative flex items-end justify-center overflow-hidden flex-shrink-0"
        style={{ height: 'clamp(220px, 44dvh, 360px)', background: 'linear-gradient(180deg, #070d14 0%, #0f2027 60%, #0d1117 100%)', borderBottom: '1px solid rgba(34,197,94,0.15)' }}>
        {/* Green ground glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 pointer-events-none"
          style={{ width: 260, height: 90, background: 'radial-gradient(ellipse, rgba(34,197,94,0.2) 0%, transparent 70%)', filter: 'blur(10px)' }} />

        {/* Left ghost */}
        <div className="absolute bottom-8 pointer-events-none" style={{ left: '8%', filter: 'blur(2.5px)', opacity: 0.18 }}>
          <DetailedCharacter {...avatarProps} hairStyle={prevStyle} width={70} />
        </div>
        {/* Right ghost */}
        <div className="absolute bottom-8 pointer-events-none" style={{ right: '8%', filter: 'blur(2.5px)', opacity: 0.18 }}>
          <DetailedCharacter {...avatarProps} hairStyle={nextStyle} width={70} />
        </div>

        {/* Main character */}
        <div className="relative z-10 pb-6 idle-float">
          <DetailedCharacter {...avatarProps} width={108} />
        </div>

        {/* Info tags */}
        <div className="absolute top-3 left-3 flex flex-col gap-1 pointer-events-none">
          <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(34,197,94,0.3)', color: '#86efac' }}>
            {skinTone}
          </span>
          <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(59,130,246,0.3)', color: '#93c5fd' }}>
            {eyeColor} eyes
          </span>
        </div>
        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end pointer-events-none">
          <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(242,157,38,0.3)', color: '#fbbf24' }}>
            {hairStyle} · {hairColor}
          </span>
          <span className="text-[9px] font-bold px-2 py-1 rounded-full uppercase tracking-widest"
            style={{ background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(249,115,22,0.3)', color: '#fb923c' }}>
            {sigItem}
          </span>
        </div>

        <div className="absolute bottom-0 left-0 right-0 pointer-events-none"
          style={{ height: 1, background: 'linear-gradient(to right, transparent, rgba(34,197,94,0.3), transparent)' }} />
      </div>

      {/* ── TABS ── */}
      <div className="flex items-center gap-2 px-3 py-3 overflow-x-auto flex-shrink-0"
        style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className="flex-shrink-0 flex items-center gap-1.5 px-3.5 py-2 rounded-full text-xs font-bold transition-all"
            style={tab === t.id
              ? { background: '#ff6b00', color: '#1a0800', boxShadow: '0 0 16px rgba(255,107,0,0.5)' }
              : { background: 'rgba(255,255,255,0.06)', color: '#94a3b8' }}>
            <span>{t.icon}</span>{t.label}
          </button>
        ))}
      </div>

      {/* ── CONTENT ── */}
      <div className="flex-1 overflow-y-auto px-4 py-5 space-y-6">

        {/* GENDER */}
        {tab === 'gender' && (
          <div className="space-y-5">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Choose Character</p>
            <div className="grid grid-cols-2 gap-4">
              {(['boy', 'girl'] as const).map(g => (
                <button key={g} onClick={() => {
                  setField('gender', g)
                  // Swap to gender-appropriate default style
                  const styles = g === 'girl' ? GIRL_STYLES : BOY_STYLES
                  if (!styles.includes(hairStyle)) setField('hairStyle', styles[0])
                }}
                  className="relative rounded-2xl p-4 flex flex-col items-center gap-3 transition-all"
                  style={{ border: `2px solid ${gender === g ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: gender === g ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                  <DetailedCharacter gender={g} skinTone={skinTone} hairColor={hairColor} hairStyle={g === 'girl' ? 'Ponytail' : 'Short'} eyeColor={eyeColor} jacketColor={jacketColor} pantsColor={pantsColor} goggleColor={goggleColor} sigItem={sigItem} width={88} />
                  <span className="text-sm font-bold capitalize" style={{ color: gender === g ? '#86efac' : '#64748b' }}>
                    {g === 'boy' ? '🧒 Boy' : '👧 Girl'}
                  </span>
                  {gender === g && <span className="absolute top-2 right-2 text-xs font-black text-[#22c55e]">✓</span>}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* HAIR */}
        {tab === 'hair' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Style — {hairStyle}</p>
              <div className="grid grid-cols-3 gap-3">
                {(gender === 'girl' ? GIRL_STYLES : BOY_STYLES).map(s => (
                  <button key={s} onClick={() => setField('hairStyle', s)}
                    className="rounded-xl flex flex-col items-center gap-1.5 p-2 transition-all"
                    style={{ border: `2px solid ${hairStyle === s ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: hairStyle === s ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }}>
                    <DetailedCharacter {...avatarProps} hairStyle={s} width={48} cropToHead />
                    <span className="text-[9px] font-bold uppercase tracking-tight" style={{ color: hairStyle === s ? '#86efac' : '#64748b' }}>{s}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Color — {hairColor}</p>
              <div className="grid grid-cols-4 gap-3">
                {Object.entries(HAIR_COLORS).map(([name, hex]) => (
                  <button key={name} onClick={() => setField('hairColor', name)} className="flex flex-col items-center gap-2">
                    <div className="w-full aspect-square rounded-xl transition-all"
                      style={{ background: hex, border: `3px solid ${hairColor === name ? '#22c55e' : 'transparent'}`, boxShadow: hairColor === name ? '0 0 16px rgba(34,197,94,0.45)' : undefined, transform: hairColor === name ? 'scale(1.08)' : undefined, outline: hairColor === name ? undefined : '1px solid rgba(255,255,255,0.1)' }} />
                    <span className="text-[9px] font-bold uppercase tracking-tight leading-none" style={{ color: hairColor === name ? '#86efac' : '#475569' }}>{name}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* FACE */}
        {tab === 'face' && (
          <div className="space-y-6">
            {/* Skin tone */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Skin Tone — {skinTone}</p>
              <div className="grid grid-cols-5 gap-3">
                {Object.entries(SKIN_COLORS).map(([name, hex]) => (
                  <button key={name} onClick={() => setField('skinTone', name)} className="flex flex-col items-center gap-2">
                    <div className="w-full aspect-square rounded-2xl transition-all"
                      style={{ background: hex, border: `3px solid ${skinTone === name ? '#22c55e' : 'transparent'}`, boxShadow: skinTone === name ? '0 0 18px rgba(34,197,94,0.45)' : undefined, transform: skinTone === name ? 'scale(1.08)' : undefined, outline: skinTone === name ? undefined : '1px solid rgba(255,255,255,0.08)' }} />
                    <span className="text-[9px] font-bold uppercase tracking-tight leading-none" style={{ color: skinTone === name ? '#86efac' : '#475569' }}>{name.split('-')[0]}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Eye color */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Eye Color — {eyeColor}</p>
              <div className="grid grid-cols-2 gap-2.5">
                {Object.entries(EYE_IRIS_COLORS).map(([name, hex]) => (
                  <button key={name} onClick={() => setField('eyeColor', name)}
                    className="flex items-center gap-3 p-2.5 rounded-xl transition-all"
                    style={{ border: `2px solid ${eyeColor === name ? '#22c55e' : 'rgba(255,255,255,0.06)'}`, background: eyeColor === name ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                    <div className="w-8 h-8 rounded-full shrink-0" style={{ background: hex, outline: '2px solid rgba(255,255,255,0.15)' }} />
                    <span className="text-sm font-bold text-slate-200">{name}</span>
                    {eyeColor === name && <span className="ml-auto text-[#22c55e] font-black text-xs">✓</span>}
                  </button>
                ))}
              </div>
            </div>
            {/* Eye style */}
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Eye Style — {eyeStyle}</p>
              <div className="grid grid-cols-4 gap-2.5">
                {EYE_STYLES.map(({ id, label }) => (
                  <button key={id} onClick={() => setField('eyeStyle', id)}
                    className="rounded-xl flex flex-col items-center gap-1.5 p-2 transition-all"
                    style={{ border: `2px solid ${eyeStyle === id ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: eyeStyle === id ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)' }}>
                    <DetailedCharacter {...avatarProps} eyeStyle={id} width={40} cropToHead />
                    <span className="text-[9px] font-bold uppercase" style={{ color: eyeStyle === id ? '#86efac' : '#64748b' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            {/* Freckles */}
            <button onClick={() => setField('freckles', !freckles)}
              className="w-full flex items-center justify-between px-4 py-3.5 rounded-xl transition-all"
              style={{ border: `2px solid ${freckles ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: freckles ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
              <div>
                <p className="text-sm font-bold text-slate-200">Freckles</p>
                <p className="text-xs text-slate-500">Sprinkled across the nose</p>
              </div>
              <div className="w-10 h-6 rounded-full transition-all flex items-center px-1"
                style={{ background: freckles ? '#22c55e' : 'rgba(255,255,255,0.1)' }}>
                <div className="w-4 h-4 rounded-full bg-white transition-all" style={{ transform: freckles ? 'translateX(16px)' : 'translateX(0)' }} />
              </div>
            </button>
          </div>
        )}

        {/* OUTFIT */}
        {tab === 'outfit' && (
          <div className="space-y-6">
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Jacket Color</p>
              <div className="grid grid-cols-3 gap-3">
                {JACKET_COLORS.map(({ label, hex }) => (
                  <button key={hex} onClick={() => setField('jacketColor', hex)}
                    className="flex items-center gap-2.5 p-3 rounded-xl transition-all"
                    style={{ border: `2px solid ${jacketColor === hex ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: jacketColor === hex ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                    <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: hex, outline: '1px solid rgba(255,255,255,0.1)' }} />
                    <span className="text-xs font-bold" style={{ color: jacketColor === hex ? '#86efac' : '#94a3b8' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
            <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
            <div className="space-y-3">
              <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Pants Color</p>
              <div className="grid grid-cols-2 gap-3">
                {PANTS_COLORS.map(({ label, hex }) => (
                  <button key={hex} onClick={() => setField('pantsColor', hex)}
                    className="flex items-center gap-2.5 p-3 rounded-xl transition-all"
                    style={{ border: `2px solid ${pantsColor === hex ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: pantsColor === hex ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                    <div className="w-8 h-8 rounded-lg shrink-0" style={{ background: hex, outline: '1px solid rgba(255,255,255,0.1)' }} />
                    <span className="text-xs font-bold" style={{ color: pantsColor === hex ? '#86efac' : '#94a3b8' }}>{label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* GEAR */}
        {tab === 'gear' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Goggle Lens Color</p>
            <div className="grid grid-cols-3 gap-3">
              {GOGGLE_COLORS.map(({ label, hex }) => (
                <button key={hex} onClick={() => setField('goggleColor', hex)}
                  className="flex flex-col items-center gap-2 p-3 rounded-xl transition-all"
                  style={{ border: `2px solid ${goggleColor === hex ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: goggleColor === hex ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                  <div className="w-10 h-8 rounded-lg" style={{ background: hex, boxShadow: goggleColor === hex ? `0 0 12px ${hex}80` : undefined, outline: '1px solid rgba(255,255,255,0.12)' }} />
                  <span className="text-[9px] font-bold uppercase" style={{ color: goggleColor === hex ? '#86efac' : '#64748b' }}>{label}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* SIGNATURE */}
        {tab === 'signature' && (
          <div className="space-y-4">
            <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-slate-500">Signature Weapon</p>
            {([
              { id: 'bat',    label: 'ZOM-B-GONE Bat',   desc: 'Nail-studded apocalypse special' },
              { id: 'wrench', label: 'Repair Wrench',     desc: 'Fix things. Then hit things.' },
              { id: 'broom',  label: 'Survival Broom',    desc: 'Clean sweep of the undead' },
            ] as { id: SigItem; label: string; desc: string }[]).map(({ id, label, desc }) => (
              <button key={id} onClick={() => setField('sigItem', id)}
                className="w-full flex items-center gap-4 p-4 rounded-2xl transition-all"
                style={{ border: `2px solid ${sigItem === id ? '#22c55e' : 'rgba(255,255,255,0.07)'}`, background: sigItem === id ? 'rgba(34,197,94,0.08)' : 'rgba(255,255,255,0.03)' }}>
                <div className="shrink-0 rounded-xl overflow-hidden" style={{ background: 'rgba(0,0,0,0.3)', padding: 4 }}>
                  <DetailedCharacter {...avatarProps} sigItem={id} width={70} />
                </div>
                <div className="flex-1 text-left">
                  <p className="text-sm font-bold" style={{ color: sigItem === id ? '#86efac' : '#e2e8f0' }}>{label}</p>
                  <p className="text-xs text-slate-500">{desc}</p>
                </div>
                {sigItem === id && <span className="text-[#22c55e] font-black text-lg">✓</span>}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── SAVE ── */}
      <div className="flex-shrink-0 px-4 py-4" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', background: '#0d1117' }}>
        {error && <p className="text-red-400 text-sm text-center mb-2">{error}</p>}
        <button onClick={save} disabled={saving}
          className={`w-full py-4 rounded-xl font-extrabold uppercase tracking-wider text-base transition-all active:scale-95 disabled:opacity-50${saving || saved ? '' : ' btn-pulse'}`}
          style={{ background: saving ? 'rgba(255,107,0,0.25)' : saved ? '#3dff7a' : '#ff6b00', color: saving ? '#804000' : saved ? '#052e16' : '#1a0800' }}>
          {saving ? '⏳ Saving…' : saved ? '✓ Look Saved!' : '✔ Save Look'}
        </button>
      </div>
    </div>
  )
}
