'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ChildAppearanceFields } from '@/components/admin/child-appearance-fields'

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
  } | null
}

export function EditChildForm({ child }: { child: Child }) {
  const router = useRouter()

  // — Profile section —
  const [name, setName] = useState(child.name)
  const [avatarUrl] = useState(child.avatarUrl ?? '??')
  const [gender, setGender] = useState<'boy' | 'girl' | ''>((child.childProfile as any)?.gender ?? '')
  const [skinTone, setSkinTone] = useState((child.childProfile as any)?.skinTone ?? '')
  const [hairStyle, setHairStyle] = useState((child.childProfile as any)?.hairStyle ?? '')
  const [hairColor, setHairColor] = useState((child.childProfile as any)?.hairColor ?? '')
  const [eyeColor, setEyeColor] = useState((child.childProfile as any)?.eyeColor ?? '')
  const [profileErrors, setProfileErrors] = useState<Record<string, string>>({})
  const [profileMsg, setProfileMsg] = useState('')
  const [profileLoading, setProfileLoading] = useState(false)

  // — PIN section —
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinErrors, setPinErrors] = useState<Record<string, string>>({})
  const [pinMsg, setPinMsg] = useState('')
  const [pinLoading, setPinLoading] = useState(false)

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
        avatarUrl,
        gender: gender || undefined,
        hairStyle: hairStyle || undefined,
        hairColor: hairColor || undefined,
        skinTone: skinTone || undefined,
        eyeColor: eyeColor || undefined,
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
    <main className="py-8">
      <div className="mb-6">
        <Link href="/admin/children" className="text-xs text-gray-400 hover:text-gray-600 mb-1 block">
          ← Children
        </Link>
        <h1 className="text-2xl font-bold text-gray-900">
          {child.avatarUrl ?? '🧒'} {child.name}
        </h1>
        <p className="text-xs text-gray-400 mt-0.5">Level {child.level}</p>
      </div>

      <div className="max-w-md space-y-8">
        {/* Profile section */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Profile</h2>
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Display name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 ${profileErrors.name ? 'border-red-400' : 'border-gray-300'}`}
                required
              />
              {profileErrors.name && <p className="text-xs text-red-600 mt-1">{profileErrors.name}</p>}
            </div>

            <ChildAppearanceFields
              gender={gender}
              skinTone={skinTone}
              hairStyle={hairStyle}
              hairColor={hairColor}
              eyeColor={eyeColor}
              onGenderChange={setGender}
              onSkinToneChange={setSkinTone}
              onHairStyleChange={setHairStyle}
              onHairColorChange={setHairColor}
              onEyeColorChange={setEyeColor}
            />

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={profileLoading}
                className="bg-gray-900 text-white text-sm font-medium rounded-lg px-5 py-2 hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
              >
                {profileLoading ? 'Saving…' : 'Save'}
              </button>
              {profileMsg && <span className="text-sm text-green-600">{profileMsg}</span>}
            </div>
          </form>
        </section>

        {/* Reset PIN section */}
        <section className="bg-white border border-gray-200 rounded-xl p-5">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Reset PIN</h2>
          <form onSubmit={handlePinReset} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">New PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setPinErrors({}) }}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 tracking-widest ${pinErrors.pin ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="••••"
                required
              />
              {pinErrors.pin && <p className="text-xs text-red-600 mt-1">{pinErrors.pin}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Confirm new PIN</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={confirmPin}
                onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setPinErrors({}) }}
                className={`w-full border rounded-lg px-4 py-2.5 text-sm text-gray-900 outline-none focus:ring-2 focus:ring-gray-900 tracking-widest ${pinErrors.confirmPin ? 'border-red-400' : 'border-gray-300'}`}
                placeholder="••••"
                required
              />
              {pinErrors.confirmPin && <p className="text-xs text-red-600 mt-1">{pinErrors.confirmPin}</p>}
              {pinErrors._ && <p className="text-xs text-red-600 mt-1">{pinErrors._}</p>}
            </div>
            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={pinLoading}
                className="bg-gray-900 text-white text-sm font-medium rounded-lg px-5 py-2 hover:bg-gray-700 disabled:bg-gray-300 transition-colors"
              >
                {pinLoading ? 'Updating…' : 'Update PIN'}
              </button>
              {pinMsg && <span className="text-sm text-green-600">{pinMsg}</span>}
            </div>
          </form>
        </section>
      </div>
    </main>
  )
}
