'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ChildAppearanceFields } from '@/components/admin/child-appearance-fields'

type FieldErrors = Partial<Record<'name' | 'avatarUrl' | 'pin' | 'confirmPin' | 'gender', string>>

export default function NewChildPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [gender, setGender] = useState<'boy' | 'girl' | ''>('')
  const [skinTone, setSkinTone] = useState('')
  const [hairStyle, setHairStyle] = useState('')
  const [hairColor, setHairColor] = useState('')
  const [eyeColor, setEyeColor] = useState('')
  const [pin, setPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setFieldErrors({})

    const res = await fetch('/api/admin/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name, pin, confirmPin,
        gender: gender || undefined,
        hairStyle: hairStyle || undefined,
        hairColor: hairColor || undefined,
        skinTone: skinTone || undefined,
        eyeColor: eyeColor || undefined,
      }),
    })

    const data = await res.json()
    if (!res.ok) {
      if (data.errors) setFieldErrors(data.errors)
      else setError(data.error ?? 'Failed to create child')
      setLoading(false)
      return
    }

    router.push('/admin/children')
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
          <h1 className="text-xl font-bold text-slate-100">Add New Survivor</h1>
          <p className="text-xs text-slate-400 mt-0.5">Create a child account</p>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {error && (
          <div className="bg-red-900/30 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
            {error}
          </div>
        )}

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

        {/* Survivor Identity */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-3">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] text-sm">🪪</span>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Survivor Identity</h3>
          </div>
          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">Codename / Name</p>
            <input
              type="text"
              value={name}
              onChange={(e) => { setName(e.target.value); setFieldErrors((f) => ({ ...f, name: undefined })) }}
              placeholder="e.g. Maverick"
              required
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40 border h-12 placeholder:text-slate-600 px-4 text-sm transition-all ${
                fieldErrors.name ? 'border-red-500' : 'border-[#334155]'
              }`}
            />
            {fieldErrors.name && <p className="text-xs text-red-400 mt-1">{fieldErrors.name}</p>}
          </label>
        </div>

        {/* Access Code */}
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-[#22c55e] text-sm">🔒</span>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Access Code</h3>
          </div>
          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">4-Digit PIN</p>
            <input
              type="password" inputMode="numeric" maxLength={4} value={pin}
              onChange={(e) => { setPin(e.target.value.replace(/\D/g, '')); setFieldErrors((f) => ({ ...f, pin: undefined })) }}
              placeholder="••••" required
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40 border h-12 placeholder:text-slate-600 px-4 text-sm tracking-widest transition-all ${
                fieldErrors.pin ? 'border-red-500' : 'border-[#334155]'
              }`}
            />
            {fieldErrors.pin && <p className="text-xs text-red-400 mt-1">{fieldErrors.pin}</p>}
          </label>
          <label className="flex flex-col">
            <p className="text-xs font-medium text-slate-400 mb-2">Confirm PIN</p>
            <input
              type="password" inputMode="numeric" maxLength={4} value={confirmPin}
              onChange={(e) => { setConfirmPin(e.target.value.replace(/\D/g, '')); setFieldErrors((f) => ({ ...f, confirmPin: undefined })) }}
              placeholder="••••" required
              className={`w-full rounded-xl text-slate-100 bg-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#22c55e]/40 border h-12 placeholder:text-slate-600 px-4 text-sm tracking-widest transition-all ${
                fieldErrors.confirmPin ? 'border-red-500' : 'border-[#334155]'
              }`}
            />
            {fieldErrors.confirmPin && <p className="text-xs text-red-400 mt-1">{fieldErrors.confirmPin}</p>}
          </label>
        </div>

        <button
          type="submit" disabled={loading}
          className="w-full bg-[#22c55e] hover:bg-[#22c55e]/90 disabled:bg-[#22c55e]/40 text-slate-900 font-bold py-3.5 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg shadow-[#22c55e]/20 active:scale-[0.98]"
        >
          <span>⚡</span>
          {loading ? 'Initializing…' : 'Initialize Survivor'}
        </button>
      </form>
    </div>
  )
}
