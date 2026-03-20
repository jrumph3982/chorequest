'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChildAppearanceFields } from '@/components/admin/child-appearance-fields'
import { ThemeSelector } from '@/components/admin/ThemeSelector'

interface Child {
  id: string
  name: string
  avatarUrl: string | null
  level: number
  childProfile: {
    hairStyle: string | null
    hairColor: string | null
    skinTone: string | null
    eyeColor: string | null
    gender: string | null
    visualTheme: string | null
  } | null
}

export function EditChildForm({ child }: { child: Child }) {
  const router = useRouter()

  // — Profile section —
  const [name, setName] = useState(child.name)
  const [gender, setGender] = useState<'boy' | 'girl' | ''>((child.childProfile as any)?.gender ?? '')
  const [skinTone, setSkinTone] = useState((child.childProfile as any)?.skinTone ?? '')
  const [hairStyle, setHairStyle] = useState((child.childProfile as any)?.hairStyle ?? '')
  const [hairColor, setHairColor] = useState((child.childProfile as any)?.hairColor ?? '')
  const [eyeColor, setEyeColor] = useState((child.childProfile as any)?.eyeColor ?? '')
  const [visualTheme, setVisualTheme] = useState((child.childProfile as any)?.visualTheme ?? 'zombie')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileMsg, setProfileMsg] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // — PIN section —
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({})
  const [pinMsg, setPinMsg] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

  function handleGenderChange(g: 'boy' | 'girl' | '') {
    setGender(g)
    // Apply default hair style when switching gender and none is set
    if (!hairStyle) {
      if (g === 'boy') setHairStyle('Short')
      else if (g === 'girl') setHairStyle('Long')
    }
  }

  async function handleProfileSave(e: React.FormEvent) {
    e.preventDefault()
    setProfileLoading(true)
    setProfileErrors({})
    setProfileMsg('')

    const res = await fetch(`/api/admin/children/${child.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name,
        gender: gender || undefined,
        hairStyle: hairStyle || undefined,
        hairColor: hairColor || undefined,
        skinTone: skinTone || undefined,
        eyeColor: eyeColor || undefined,
        visualTheme,
      }),
    })
    const data = await res.json()

    if (!res.ok) {
      setProfileErrors(data.errors ?? { _: data.error ?? 'Save failed' })
    } else {
      setProfileMsg('Saved!')
      router.refresh()
    }
    setProfileLoading(false)
  }

  async function handlePinReset(e: React.FormEvent) {
    e.preventDefault()
    setPinLoading(true)
    setPinErrors({})
    setPinMsg('')

    const res = await fetch(`/api/admin/children/${child.id}/reset-pin`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin, confirmPin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setPinErrors(data.errors ?? { _: data.error ?? 'Reset failed' })
    } else {
      setPinMsg('PIN updated!')
      setPin('')
      setConfirmPin('')
    }
    setPinLoading(false)
  }

  return (
    <div className="space-y-6 max-w-lg">
      {/* Page header */}
      <div className="flex items-center gap-3">
        <Link
          href="/admin/children"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-colors text-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">
            {child.name}
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">Level {child.level} Survivor</p>
        </div>
      </div>

      {/* Profile section */}
      <section className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#22c55e] text-sm">🪪</span>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Profile</h2>
        </div>

        <form onSubmit={handleProfileSave} className="space-y-4">
          {profileErrors._ && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {profileErrors._}
            </div>
          )}

          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">Codename / Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setProfileErrors((f) => ({ ...f, name: undefined as any })) }}
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40 border h-12 placeholder:text-slate-600 px-4 text-sm transition-all ${
                profileErrors.name ? 'border-red-500' : 'border-[#334155]'
              }`}
              required
            />
            {profileErrors.name && <p className="text-xs text-red-400 mt-1">{profileErrors.name}</p>}
          </label>

          <ChildAppearanceFields
            gender={gender}
            skinTone={skinTone}
            hairStyle={hairStyle}
            hairColor={hairColor}
            eyeColor={eyeColor}
            onGenderChange={handleGenderChange}
            onSkinToneChange={setSkinTone}
            onHairStyleChange={setHairStyle}
            onHairColorChange={setHairColor}
            onEyeColorChange={setEyeColor}
          />

          <ThemeSelector value={visualTheme} onChange={setVisualTheme} />

          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={profileLoading}
              className="bg-[#22c55e] hover:bg-[#22c55e]/90 disabled:bg-[#22c55e]/40 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#22c55e]/20 active:scale-[0.98]"
            >
              {profileLoading ? 'Saving…' : 'Save Changes'}
            </button>
            {profileMsg && <span className="text-sm font-medium text-[#22c55e]">✓ {profileMsg}</span>}
          </div>
        </form>
      </section>

      {/* Reset PIN section */}
      <section className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
        <div className="flex items-center gap-2 mb-1">
          <span className="text-[#f29d26] text-sm">🔒</span>
          <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reset PIN</h2>
        </div>

        <form onSubmit={handlePinReset} className="space-y-4">
          {pinErrors._ && (
            <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-lg px-4 py-3">
              {pinErrors._}
            </div>
          )}
          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">New PIN</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinErrors({}) }}
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#f29d26]/40 border h-12 placeholder:text-slate-600 px-4 text-sm tracking-widest transition-all ${
                pinErrors.pin ? 'border-red-500' : 'border-[#334155]'
              }`}
              placeholder="••••"
              required
            />
            {pinErrors.pin && <p className="text-xs text-red-400 mt-1">{pinErrors.pin}</p>}
          </label>
          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">Confirm new PIN</p>
            <input
              type="password"
              inputMode="numeric"
              maxLength={4}
              value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setPinErrors({}) }}
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#f29d26]/40 border h-12 placeholder:text-slate-600 px-4 text-sm tracking-widest transition-all ${
                pinErrors.confirmPin ? 'border-red-500' : 'border-[#334155]'
              }`}
              placeholder="••••"
              required
            />
            {pinErrors.confirmPin && <p className="text-xs text-red-400 mt-1">{pinErrors.confirmPin}</p>}
          </label>
          <div className="flex items-center gap-3 pt-1">
            <button
              type="submit"
              disabled={pinLoading}
              className="bg-[#f29d26] hover:bg-[#f29d26]/90 disabled:bg-[#f29d26]/40 text-slate-900 font-bold text-sm px-6 py-2.5 rounded-xl transition-all shadow-lg shadow-[#f29d26]/20 active:scale-[0.98]"
            >
              {pinLoading ? 'Updating…' : 'Update PIN'}
            </button>
            {pinMsg && <span className="text-sm font-medium text-[#22c55e]">✓ {pinMsg}</span>}
          </div>
        </form>
      </section>
    </div>
  )
}
