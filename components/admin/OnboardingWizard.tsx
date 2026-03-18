'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  householdCode: string
  householdName: string
  existingChildren: { id: string; name: string }[]
  initialStep: number
}

const STARTER_CHORES = [
  { title: 'Make Bed',        category: 'bedroom',  basePoints: 10, scheduleType: 'daily' },
  { title: 'Tidy Bedroom',    category: 'bedroom',  basePoints: 15, scheduleType: 'daily' },
  { title: 'Clear Dishes',    category: 'kitchen',  basePoints: 10, scheduleType: 'daily' },
  { title: 'Brush Teeth AM',  category: 'hygiene',  basePoints: 5,  scheduleType: 'daily' },
  { title: 'Brush Teeth PM',  category: 'hygiene',  basePoints: 5,  scheduleType: 'daily' },
  { title: 'Tidy Living Room',category: 'household',basePoints: 15, scheduleType: 'daily' },
]

function StepIndicator({ step, total }: { step: number; total: number }) {
  return (
    <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginBottom: 32 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === step ? 24 : 8,
            height: 8,
            borderRadius: 99,
            background: i === step ? '#3dff7a' : i < step ? '#1a5a30' : '#1a3018',
            transition: 'all 0.3s ease',
          }}
        />
      ))}
    </div>
  )
}

export function OnboardingWizard({ householdCode, householdName, existingChildren, initialStep }: Props) {
  const router = useRouter()
  const [step, setStep] = useState(initialStep || 0)
  const [children, setChildren] = useState(existingChildren)
  const [newChildName, setNewChildName] = useState('')
  const [newChildPin, setNewChildPin] = useState('')
  const [selectedChores, setSelectedChores] = useState(STARTER_CHORES.map(() => true))
  const [allowanceEnabled, setAllowanceEnabled] = useState(false)
  const [pointsPerDollar, setPointsPerDollar] = useState(100)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState('')

  const TOTAL_STEPS = 6

  async function addChild() {
    if (!newChildName.trim() || newChildPin.length !== 4) {
      setError('Enter a name and 4-digit PIN')
      return
    }
    setLoading(true)
    setError('')
    const res = await fetch('/api/admin/children', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newChildName.trim(), pin: newChildPin }),
    })
    if (res.ok) {
      const data = await res.json()
      setChildren((prev) => [...prev, { id: data.id, name: data.name }])
      setNewChildName('')
      setNewChildPin('')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Failed to add child')
    }
    setLoading(false)
  }

  async function createStarterChores() {
    setLoading(true)
    const selected = STARTER_CHORES.filter((_, i) => selectedChores[i])
    for (const chore of selected) {
      await fetch('/api/admin/chores', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...chore,
          difficultyScore: 2,
          requiresApproval: true,
          childUserIds: children.map((c) => c.id),
        }),
      })
    }
    setLoading(false)
    setStep(4)
  }

  async function saveAllowanceSettings() {
    if (allowanceEnabled) {
      await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ allowancePointsPerDollar: pointsPerDollar }),
      })
    }
    setStep(5)
  }

  async function completeOnboarding() {
    setLoading(true)
    await fetch('/api/admin/onboarding/complete', { method: 'POST' })
    router.push('/admin/dashboard')
    router.refresh()
  }

  const panelStyle = {
    maxWidth: 480,
    margin: '0 auto',
    width: '100%',
  }

  const btnPrimary = {
    width: '100%',
    padding: '14px 0',
    background: '#3dff7a',
    border: 'none',
    borderRadius: 12,
    fontFamily: "'Bungee', sans-serif" as const,
    fontSize: 14,
    letterSpacing: 1,
    color: '#060e06',
    cursor: 'pointer',
    opacity: loading ? 0.6 : 1,
  }

  const inputStyle = {
    width: '100%',
    background: '#0d1810',
    border: '1px solid #1a3018',
    borderRadius: 8,
    padding: '10px 12px',
    color: '#e8f5e8',
    fontSize: 14,
    outline: 'none',
    boxSizing: 'border-box' as const,
  }

  return (
    <div style={{
      minHeight: '100vh',
      background: '#060a06',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      padding: '40px 20px',
    }}>
      <div style={panelStyle}>
        <StepIndicator step={step} total={TOTAL_STEPS} />

        {error && (
          <div style={{
            background: 'rgba(255,74,74,0.1)',
            border: '1px solid rgba(255,74,74,0.3)',
            borderRadius: 8, padding: '10px 14px',
            color: '#ff4a4a', fontSize: 13, marginBottom: 16,
          }}>
            {error}
          </div>
        )}

        {/* Step 0: Welcome */}
        {step === 0 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🏚️</div>
            <h1 style={{ fontFamily: "'Bungee', sans-serif", color: '#3dff7a', fontSize: 28, letterSpacing: 2, margin: '0 0 8px', textTransform: 'uppercase' }}>
              WELCOME TO
            </h1>
            <h2 style={{ fontFamily: "'Bungee', sans-serif", color: '#f5c842', fontSize: 22, letterSpacing: 1, margin: '0 0 20px' }}>
              CHORE QUEST
            </h2>
            <div style={{ background: '#0d1810', border: '1px solid #1a3018', borderRadius: 12, padding: 20, marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: '#e8f5e8', fontSize: 14, lineHeight: 1.6, margin: 0 }}>
                Turn chores into an epic zombie survival adventure for your kids. Here&apos;s how it works:
              </p>
              <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
                {[
                  ['📋', 'Assign chores to your kids as daily missions'],
                  ['⚡', 'Kids earn XP and scrap by completing them'],
                  ['🏚️', 'Their base survives nightly zombie attacks based on performance'],
                  ['💰', 'You track and pay out real allowance money'],
                ].map(([icon, text]) => (
                  <div key={text} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <span style={{ fontSize: 16, flexShrink: 0 }}>{icon}</span>
                    <p style={{ color: '#4a7a40', fontSize: 12, margin: 0, lineHeight: 1.4 }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
            <button style={btnPrimary} onClick={() => setStep(1)}>
              LET&apos;S SET UP YOUR BASE →
            </button>
          </div>
        )}

        {/* Step 1: Household Code */}
        {step === 1 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Bungee', sans-serif", color: '#f29d26', fontSize: 12, letterSpacing: 2, margin: '0 0 16px', textTransform: 'uppercase' }}>
              Step 1 of 5 — Household Code
            </p>
            <h2 style={{ fontFamily: "'Bungee', sans-serif", color: '#e8f5e8', fontSize: 22, margin: '0 0 8px' }}>
              YOUR HOUSEHOLD CODE
            </h2>
            <p style={{ color: '#4a7a40', fontSize: 13, margin: '0 0 24px', lineHeight: 1.5 }}>
              Kids use this code to find your household when logging in. Keep it safe!
            </p>
            {/* Code display */}
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginBottom: 16 }}>
              {householdCode.split('').map((char, i) => (
                <div key={i} style={{
                  width: 44, height: 54, borderRadius: 8,
                  background: '#0d1810', border: '2px solid #3dff7a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontFamily: "'Bungee', sans-serif", fontSize: 22, color: '#3dff7a',
                }}>
                  {char}
                </div>
              ))}
            </div>
            <button
              style={{
                background: 'transparent', border: '1px solid #1a3018',
                borderRadius: 8, padding: '8px 16px',
                color: copied ? '#3dff7a' : '#4a7a40', fontSize: 12,
                cursor: 'pointer', marginBottom: 24,
              }}
              onClick={() => {
                navigator.clipboard.writeText(householdCode)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
            >
              {copied ? '✓ COPIED!' : '📋 COPY CODE'}
            </button>
            <div style={{ background: '#0d1810', border: '1px solid #1a3018', borderRadius: 10, padding: '10px 14px', marginBottom: 24, textAlign: 'left' }}>
              <p style={{ color: '#4a7a40', fontSize: 12, margin: 0, lineHeight: 1.5 }}>
                Share this code with your kids. They&apos;ll need it to log in at the child login screen.
                You can find it again later under Settings.
              </p>
            </div>
            <button style={btnPrimary} onClick={() => setStep(2)}>
              GOT IT → ADD KIDS
            </button>
          </div>
        )}

        {/* Step 2: Add First Child */}
        {step === 2 && (
          <div>
            <p style={{ fontFamily: "'Bungee', sans-serif", color: '#f29d26', fontSize: 12, letterSpacing: 2, margin: '0 0 16px', textTransform: 'uppercase', textAlign: 'center' }}>
              Step 2 of 5 — Add Kids
            </p>
            <h2 style={{ fontFamily: "'Bungee', sans-serif", color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
              ADD YOUR KIDS
            </h2>
            <p style={{ color: '#4a7a40', fontSize: 13, margin: '0 0 20px', textAlign: 'center' }}>
              Each child gets their own survivor profile.
            </p>

            {/* Existing children */}
            {children.length > 0 && (
              <div style={{ background: '#0d1810', border: '1px solid #1a3018', borderRadius: 10, padding: 12, marginBottom: 16 }}>
                {children.map((c) => (
                  <div key={c.id} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '6px 0' }}>
                    <span style={{ fontSize: 16 }}>👤</span>
                    <span style={{ color: '#e8f5e8', fontSize: 14, fontWeight: 700 }}>{c.name}</span>
                    <span style={{ marginLeft: 'auto', fontSize: 10, color: '#3dff7a', textTransform: 'uppercase' }}>Added ✓</span>
                  </div>
                ))}
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, marginBottom: 16 }}>
              <input
                style={inputStyle}
                placeholder="Child's name"
                value={newChildName}
                onChange={(e) => setNewChildName(e.target.value)}
                maxLength={50}
              />
              <input
                style={inputStyle}
                placeholder="4-digit PIN"
                value={newChildPin}
                onChange={(e) => setNewChildPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                maxLength={4}
                type="tel"
                inputMode="numeric"
              />
              <button
                type="button"
                disabled={loading || newChildName.length < 1 || newChildPin.length !== 4}
                onClick={addChild}
                style={{
                  ...btnPrimary,
                  background: '#1a3018',
                  color: '#3dff7a',
                  border: '1px solid #3dff7a',
                }}
              >
                {loading ? 'Adding…' : '+ ADD CHILD'}
              </button>
            </div>

            <button
              style={{ ...btnPrimary, opacity: children.length === 0 ? 0.5 : 1 }}
              onClick={() => setStep(3)}
              disabled={children.length === 0}
            >
              CONTINUE →
            </button>
          </div>
        )}

        {/* Step 3: Quick Chore Setup */}
        {step === 3 && (
          <div>
            <p style={{ fontFamily: "'Bungee', sans-serif", color: '#f29d26', fontSize: 12, letterSpacing: 2, margin: '0 0 16px', textTransform: 'uppercase', textAlign: 'center' }}>
              Step 3 of 5 — Quick Chore Setup
            </p>
            <h2 style={{ fontFamily: "'Bungee', sans-serif", color: '#e8f5e8', fontSize: 22, margin: '0 0 8px', textAlign: 'center' }}>
              STARTER MISSIONS
            </h2>
            <p style={{ color: '#4a7a40', fontSize: 13, margin: '0 0 20px', textAlign: 'center' }}>
              We&apos;ll create these chores for you. Deselect any you don&apos;t want.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 }}>
              {STARTER_CHORES.map((chore, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setSelectedChores((prev) => prev.map((v, j) => j === i ? !v : v))}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12,
                    padding: '12px 14px',
                    background: selectedChores[i] ? '#0d1810' : '#080e08',
                    border: `1px solid ${selectedChores[i] ? '#3dff7a' : '#1a3018'}`,
                    borderRadius: 10, cursor: 'pointer',
                  }}
                >
                  <div style={{
                    width: 20, height: 20, borderRadius: 4, flexShrink: 0,
                    background: selectedChores[i] ? '#3dff7a' : 'transparent',
                    border: `2px solid ${selectedChores[i] ? '#3dff7a' : '#2a4a2a'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    {selectedChores[i] && <span style={{ color: '#060e06', fontSize: 12, fontWeight: 900 }}>✓</span>}
                  </div>
                  <div style={{ flex: 1, textAlign: 'left' }}>
                    <p style={{ color: '#e8f5e8', fontSize: 13, fontWeight: 700, margin: 0 }}>{chore.title}</p>
                    <p style={{ color: '#4a7a40', fontSize: 10, margin: 0, textTransform: 'uppercase' }}>
                      {chore.category} · {chore.basePoints} pts · daily
                    </p>
                  </div>
                </button>
              ))}
            </div>
            <button
              style={btnPrimary}
              disabled={loading}
              onClick={createStarterChores}
            >
              {loading ? 'CREATING…' : `CREATE ${selectedChores.filter(Boolean).length} CHORES →`}
            </button>
          </div>
        )}

        {/* Step 4: Configure Allowance */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <p style={{ fontFamily: "'Bungee', sans-serif", color: '#f29d26', fontSize: 12, letterSpacing: 2, margin: '0 0 16px', textTransform: 'uppercase' }}>
              Step 4 of 5 — Allowance
            </p>
            <h2 style={{ fontFamily: "'Bungee', sans-serif", color: '#e8f5e8', fontSize: 22, margin: '0 0 8px' }}>
              ALLOWANCE SETTINGS
            </h2>
            <p style={{ color: '#4a7a40', fontSize: 13, margin: '0 0 20px' }}>
              Do you want to track real money allowance?
            </p>

            <div style={{ marginBottom: 20, textAlign: 'left' }}>
              <button
                type="button"
                onClick={() => setAllowanceEnabled(!allowanceEnabled)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '14px 16px',
                  background: allowanceEnabled ? '#0d1810' : '#080e08',
                  border: `1px solid ${allowanceEnabled ? '#f5c842' : '#1a3018'}`,
                  borderRadius: 10, cursor: 'pointer',
                }}
              >
                <div>
                  <p style={{ color: '#e8f5e8', fontSize: 14, fontWeight: 700, margin: 0, textAlign: 'left' }}>Track Allowance</p>
                  <p style={{ color: '#4a7a40', fontSize: 11, margin: '2px 0 0', textAlign: 'left' }}>Convert chore points to real money</p>
                </div>
                <div style={{ width: 44, height: 24, borderRadius: 99, background: allowanceEnabled ? '#f5c842' : '#1a3018', position: 'relative', flexShrink: 0 }}>
                  <div style={{ position: 'absolute', top: 3, width: 18, height: 18, borderRadius: '50%', background: '#fff', left: allowanceEnabled ? 23 : 3, transition: 'left 0.2s' }} />
                </div>
              </button>

              {allowanceEnabled && (
                <div style={{ marginTop: 12, background: '#0d1810', border: '1px solid #1a3018', borderRadius: 10, padding: 16 }}>
                  <p style={{ color: '#4a7a40', fontSize: 12, margin: '0 0 12px' }}>
                    Points needed to earn $1.00:
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, justifyContent: 'center' }}>
                    <button type="button" onClick={() => setPointsPerDollar((p) => Math.max(10, p - 10))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a3018', border: 'none', color: '#3dff7a', fontSize: 20, cursor: 'pointer' }}>−</button>
                    <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: '#f5c842', minWidth: 60, textAlign: 'center' }}>{pointsPerDollar}</span>
                    <button type="button" onClick={() => setPointsPerDollar((p) => Math.min(1000, p + 10))} style={{ width: 36, height: 36, borderRadius: '50%', background: '#1a3018', border: 'none', color: '#3dff7a', fontSize: 20, cursor: 'pointer' }}>+</button>
                  </div>
                  <p style={{ color: '#4a7a40', fontSize: 11, textAlign: 'center', margin: '8px 0 0' }}>
                    Example: 100 points = $1.00
                  </p>
                </div>
              )}
            </div>

            <button style={btnPrimary} onClick={saveAllowanceSettings} disabled={loading}>
              {loading ? 'SAVING…' : 'CONTINUE →'}
            </button>
          </div>
        )}

        {/* Step 5: Ready to Play */}
        {step === 5 && (
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 64, marginBottom: 16 }}>🎉</div>
            <h1 style={{ fontFamily: "'Bungee', sans-serif", color: '#3dff7a', fontSize: 26, letterSpacing: 2, margin: '0 0 8px', textTransform: 'uppercase' }}>
              BASE READY!
            </h1>
            <p style={{ color: '#4a7a40', fontSize: 13, margin: '0 0 24px', lineHeight: 1.6 }}>
              Your Chore Quest household is set up and ready to go!
            </p>

            <div style={{ background: '#0d1810', border: '1px solid #1a3018', borderRadius: 12, padding: 16, marginBottom: 24, textAlign: 'left' }}>
              {[
                [`👨‍👩‍👧 Household`, householdName],
                [`👦 Survivors`, `${children.length} kids added`],
                [`📋 Missions`, `${selectedChores.filter(Boolean).length} starter chores created`],
                [`🏚️ Household Code`, householdCode],
              ].map(([label, value]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #0a1a08' }}>
                  <span style={{ color: '#4a7a40', fontSize: 12 }}>{label}</span>
                  <span style={{ color: '#e8f5e8', fontSize: 12, fontWeight: 700 }}>{value}</span>
                </div>
              ))}
            </div>

            <button style={btnPrimary} onClick={completeOnboarding} disabled={loading}>
              {loading ? 'LAUNCHING…' : '🚀 EXPLORE PARENT DASHBOARD'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
