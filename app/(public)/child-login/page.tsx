'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'
import { FeedbackButton } from '@/components/FeedbackButton'

type Step = 'code' | 'pick' | 'pin'

interface ChildAppearance {
  hairStyle:   string | null
  hairColor:   string | null
  skinTone:    string | null
  eyeColor:    string | null
  gender?:     string | null
  eyeStyle?:   string | null
  freckles?:   boolean | null
  jacketColor?: string | null
  pantsColor?:  string | null
  goggleColor?: string | null
  sigItem?:     string | null
}

interface ChildProfile {
  id:           string
  name:         string
  avatarUrl:    string | null
  level:        number
  childProfile?: ChildAppearance | null
}

const LS_CODE_KEY    = 'chq-household-code'
const LS_PROFILE_KEY = 'chq-last-profile'

interface RememberedProfile {
  id:        string
  name:      string
  avatarUrl: string | null
}

function loadRememberedProfile(): RememberedProfile | null {
  try {
    const raw = localStorage.getItem(LS_PROFILE_KEY)
    if (!raw) return null
    return JSON.parse(raw) as RememberedProfile
  } catch {
    localStorage.removeItem(LS_PROFILE_KEY)
    return null
  }
}

export default function ChildLoginPage() {
  const router = useRouter()

  const [step,          setStep]          = useState<Step>('code')
  const [householdCode, setHouseholdCode] = useState('')
  const [rememberCode,  setRememberCode]  = useState(false)
  const [householdName, setHouseholdName] = useState('')
  const [children,      setChildren]      = useState<ChildProfile[]>([])
  const [selectedChild, setSelectedChild] = useState<ChildProfile | null>(null)
  const [pin,           setPin]           = useState('')
  const [error,         setError]         = useState('')
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    const saved = localStorage.getItem(LS_CODE_KEY)
    if (saved) {
      setHouseholdCode(saved)
      setRememberCode(true)
    }
  }, [])

  async function handleCodeSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res  = await fetch('/api/auth/child-login/lookup', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ householdCode }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Household not found')
      setLoading(false)
      return
    }

    if (rememberCode) {
      localStorage.setItem(LS_CODE_KEY, householdCode.trim().toUpperCase())
    } else {
      localStorage.removeItem(LS_CODE_KEY)
    }

    setHouseholdName(data.displayName)
    setChildren(data.children as ChildProfile[])

    // Auto-skip to PIN if remembered profile matches
    const remembered = loadRememberedProfile()
    if (remembered) {
      const match = (data.children as ChildProfile[]).find((c) => c.id === remembered.id)
      if (match) {
        setSelectedChild(match)
        setPin('')
        setStep('pin')
        setLoading(false)
        return
      }
    }

    setStep('pick')
    setLoading(false)
  }

  function handleSelectChild(child: ChildProfile) {
    setSelectedChild(child)
    setPin('')
    setError('')
    setStep('pin')
  }

  function handleChooseDifferentProfile() {
    localStorage.removeItem(LS_PROFILE_KEY)
    setSelectedChild(null)
    setPin('')
    setError('')
    setStep('pick')
  }

  async function handlePinSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res  = await fetch('/api/auth/child-login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ householdCode, childUserId: selectedChild!.id, pin }),
    })
    const data = await res.json()

    if (!res.ok) {
      setError(data.error ?? 'Invalid household code or PIN')
      setPin('')
      setSelectedChild(null)
      setStep('code')
      setLoading(false)
      return
    }

    if (selectedChild) {
      localStorage.setItem(
        LS_PROFILE_KEY,
        JSON.stringify({ id: selectedChild.id, name: selectedChild.name, avatarUrl: selectedChild.avatarUrl }),
      )
    }

    window.location.href = '/dashboard'
  }

  const cardCls = 'rounded-2xl border p-6 space-y-5'
  const cardStyle = { background: 'rgba(34,27,16,0.95)', borderColor: 'rgba(242,157,38,0.25)' }
  const inputCls =
    'w-full rounded-xl px-4 py-3 text-sm outline-none focus:ring-2 border placeholder-slate-600 text-slate-100'
  const inputStyle = { background: 'rgba(15,10,5,0.7)', borderColor: 'rgba(242,157,38,0.2)' }

  return (
    <main
      className="min-h-screen flex items-center justify-center px-4 py-8"
      style={{ background: 'linear-gradient(to bottom, #0f0b05, #221b10)' }}
    >
      <div className="w-full max-w-sm">

        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-6xl mb-3">🧟</div>
          <h1 className="text-3xl font-black text-[#f29d26] tracking-tight">Chore Quest</h1>
          <p
            className="text-xs font-bold uppercase tracking-widest mt-2"
            style={{ color: 'rgba(242,157,38,0.5)' }}
          >
            Survivor Login
          </p>
        </div>

        {/* ── Step 1: Household code ──────────────────────────────── */}
        {step === 'code' && (
          <form onSubmit={handleCodeSubmit} className={cardCls} style={cardStyle}>
            <div className="text-center">
              <p className="text-sm font-bold text-slate-300">Enter your base code</p>
            </div>

            {/* Ask a parent callout */}
            <div
              className="flex items-start gap-3 px-4 py-3 rounded-xl"
              style={{ borderLeft: '3px solid #f5c842', background: 'rgba(245,200,66,0.06)' }}
            >
              <span className="text-lg mt-0.5">🔑</span>
              <p className="text-xs text-slate-400 leading-relaxed">
                <span className="font-bold text-[#f5c842]">Ask a parent</span> for your household code — it&apos;s 6 characters and never changes.
              </p>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <input
              type="text"
              value={householdCode}
              onChange={(e) => setHouseholdCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
              className={`${inputCls} text-center uppercase`}
              style={{
                ...inputStyle,
                fontFamily: "'VT323', monospace",
                fontSize: '2.2rem',
                letterSpacing: '0.45em',
                caretColor: '#3dff7a',
                lineHeight: 1.2,
              }}
              placeholder="XXXXXX"
              maxLength={6}
              autoComplete="off"
              autoCapitalize="characters"
              spellCheck={false}
              required
            />

            <label className="flex items-center gap-2.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberCode}
                onChange={(e) => setRememberCode(e.target.checked)}
                className="w-4 h-4 rounded"
                style={{ accentColor: '#f29d26' }}
              />
              <span className="text-xs text-slate-400">Remember this device</span>
            </label>

            <button
              type="submit"
              disabled={loading || householdCode.length < 1}
              className="w-full font-bold rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#f29d26', color: '#0f0b05' }}
            >
              {loading ? 'Looking up…' : 'Continue →'}
            </button>
          </form>
        )}

        {/* ── Step 2: Profile picker ──────────────────────────────── */}
        {step === 'pick' && (
          <div className={cardCls} style={cardStyle}>
            <div className="text-center">
              <p className="text-xs text-slate-500 uppercase tracking-widest font-bold">Welcome to</p>
              <p className="text-lg font-extrabold text-slate-100 mt-1">{householdName}</p>
              <p className="text-xs text-slate-500 mt-1">Select your survivor</p>
            </div>

            {children.length === 0 ? (
              <div className="text-center py-6">
                <p className="text-3xl mb-3">🏚️</p>
                <p className="text-sm font-bold text-slate-400">No survivors found</p>
                <p className="text-xs text-slate-600 mt-1">Ask a parent to create your profile</p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {children.map((child) => (
                  <button
                    key={child.id}
                    onClick={() => handleSelectChild(child)}
                    className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all active:scale-95"
                    style={{
                      background:   'rgba(15,10,5,0.6)',
                      borderColor:  'rgba(242,157,38,0.2)',
                    }}
                    onMouseEnter={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(242,157,38,0.7)'
                    }}
                    onMouseLeave={(e) => {
                      ;(e.currentTarget as HTMLButtonElement).style.borderColor = 'rgba(242,157,38,0.2)'
                    }}
                  >
                    {/* Sprite */}
                    <div className="relative">
                      <DetailedCharacter
                        gender={child.childProfile?.gender ?? undefined}
                        skinTone={child.childProfile?.skinTone ?? undefined}
                        hairStyle={child.childProfile?.hairStyle ?? undefined}
                        hairColor={child.childProfile?.hairColor ?? undefined}
                        eyeColor={child.childProfile?.eyeColor ?? undefined}
                        eyeStyle={(child.childProfile?.eyeStyle as any) ?? undefined}
                        freckles={child.childProfile?.freckles ?? false}
                        jacketColor={child.childProfile?.jacketColor ?? undefined}
                        pantsColor={child.childProfile?.pantsColor ?? undefined}
                        goggleColor={child.childProfile?.goggleColor ?? undefined}
                        sigItem={(child.childProfile?.sigItem as any) ?? undefined}
                        width={56}
                      />
                      {/* Level badge */}
                      <span
                        className="absolute -bottom-1 -right-1 text-[9px] font-black px-1.5 py-0.5 rounded-full border"
                        style={{
                          background:  'rgba(242,157,38,0.15)',
                          borderColor: 'rgba(242,157,38,0.5)',
                          color:       '#f29d26',
                        }}
                      >
                        LV{child.level ?? 1}
                      </span>
                    </div>
                    <p className="text-xs font-bold text-slate-200 truncate w-full text-center">
                      {child.name}
                    </p>
                  </button>
                ))}
              </div>
            )}

            <button
              onClick={() => { setStep('code'); setError('') }}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
            >
              ← Different base code
            </button>
          </div>
        )}

        {/* ── Step 3: PIN ─────────────────────────────────────────── */}
        {step === 'pin' && selectedChild && (
          <form onSubmit={handlePinSubmit} className={cardCls} style={cardStyle}>
            <div className="text-center space-y-2">
              <div className="flex justify-center">
                <DetailedCharacter
                  gender={selectedChild.childProfile?.gender ?? undefined}
                  skinTone={selectedChild.childProfile?.skinTone ?? undefined}
                  hairStyle={selectedChild.childProfile?.hairStyle ?? undefined}
                  hairColor={selectedChild.childProfile?.hairColor ?? undefined}
                  eyeColor={selectedChild.childProfile?.eyeColor ?? undefined}
                  eyeStyle={(selectedChild.childProfile?.eyeStyle as any) ?? undefined}
                  freckles={selectedChild.childProfile?.freckles ?? false}
                  jacketColor={selectedChild.childProfile?.jacketColor ?? undefined}
                  pantsColor={selectedChild.childProfile?.pantsColor ?? undefined}
                  goggleColor={selectedChild.childProfile?.goggleColor ?? undefined}
                  sigItem={(selectedChild.childProfile?.sigItem as any) ?? undefined}
                  width={72}
                />
              </div>
              <p className="text-base font-extrabold text-slate-100">{selectedChild.name}</p>
              <span
                className="inline-block text-[9px] font-black px-2 py-0.5 rounded-full border"
                style={{
                  background: 'rgba(242,157,38,0.1)',
                  borderColor: 'rgba(242,157,38,0.4)',
                  color: '#f29d26',
                }}
              >
                LEVEL {selectedChild.level ?? 1} SURVIVOR
              </span>
            </div>

            {error && (
              <div className="bg-red-500/10 border border-red-500/30 text-red-400 text-sm rounded-xl px-4 py-3">
                {error}
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-400 mb-2 text-center uppercase tracking-wider">
                Enter your PIN
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value.replace(/\D/g, ''))}
                className={`${inputCls} text-center text-2xl tracking-[0.6em]`}
                style={inputStyle}
                placeholder="••••"
                autoFocus
                autoComplete="off"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading || pin.length !== 4}
              className="w-full font-bold rounded-xl py-3 text-sm transition-all active:scale-95 disabled:opacity-40"
              style={{ background: '#f29d26', color: '#0f0b05' }}
            >
              {loading ? 'Entering base…' : 'Enter the Base 🧟'}
            </button>

            <button
              type="button"
              onClick={handleChooseDifferentProfile}
              className="w-full text-xs text-slate-500 hover:text-slate-300 py-1 transition-colors"
            >
              ← Choose a different survivor
            </button>
          </form>
        )}

        <p className="text-center text-xs mt-5" style={{ color: 'rgba(242,157,38,0.3)' }}>
          Parent?{' '}
          <Link href="/login" className="hover:underline" style={{ color: '#f29d26' }}>
            Sign in here →
          </Link>
        </p>
      </div>
      <FeedbackButton />
    </main>
  )
}
