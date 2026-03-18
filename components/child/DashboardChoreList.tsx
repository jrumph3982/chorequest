'use client'

import { useState, useRef, useCallback } from 'react'

interface ChoreInst {
  id: string
  status: 'available' | 'submitted_complete' | 'approved' | 'rejected' | 'missed' | 'expired'
  dueDate: string
  pointsAwarded: number | null
  notes: string | null
  reviewedAt: string | null
  assignment: {
    chore: {
      title: string
      basePoints: number
      category: string
      scheduleType?: string
    }
  }
}

interface Props {
  instances: ChoreInst[]
}

type Status = ChoreInst['status']

function statusOrder(s: Status): number {
  if (s === 'available') return 0
  if (s === 'submitted_complete') return 1
  return 2
}

// ── Small badge components ────────────────────────────────────────────────────

function WeeklyBadge() {
  return (
    <span
      style={{
        background: 'rgba(96,176,255,0.15)',
        border: '1px solid #1a2a5a',
        color: '#60b0ff',
        fontFamily: "'Bungee', sans-serif",
        fontSize: 9,
        letterSpacing: 1,
        padding: '1px 5px',
        borderRadius: 3,
        flexShrink: 0,
      }}
    >
      WEEKLY
    </span>
  )
}

function RedoBadge() {
  return (
    <span
      style={{
        background: 'rgba(255,107,0,0.15)',
        border: '1px solid #5a3000',
        color: '#ff9a20',
        fontFamily: "'Bungee', sans-serif",
        fontSize: 9,
        letterSpacing: 1,
        padding: '1px 5px',
        borderRadius: 3,
        flexShrink: 0,
      }}
    >
      REDO
    </span>
  )
}

// ── Camera SVG icon ───────────────────────────────────────────────────────────

function CameraIcon() {
  return (
    <svg width="18" height="15" viewBox="0 0 18 15" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="1" y="4" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
      <path d="M6 4L7 1H11L12 4" stroke="currentColor" strokeWidth="1.4" strokeLinejoin="round"/>
      <circle cx="9" cy="9" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
    </svg>
  )
}

// ── Main component ────────────────────────────────────────────────────────────

export function DashboardChoreList({ instances }: Props) {
  const [localInstances, setLocalInstances] = useState<ChoreInst[]>(instances)
  const [animating, setAnimating] = useState<Set<string>>(new Set())
  const submittingRef = useRef<Set<string>>(new Set())

  // ── Submission modal state ────────────────────────────────────────────────
  const [modalId, setModalId]         = useState<string | null>(null)
  const [modalNotes, setModalNotes]   = useState('')
  const [modalPhoto, setModalPhoto]   = useState<File | null>(null)
  const [modalPreview, setModalPreview] = useState<string | null>(null)
  const [modalUploading, setModalUploading] = useState(false)
  const [modalLoading, setModalLoading]     = useState(false)
  const [modalError, setModalError]   = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const sorted = [...localInstances].sort((a, b) => {
    const oa = statusOrder(a.status)
    const ob = statusOrder(b.status)
    if (oa !== ob) return oa - ob
    return a.assignment.chore.title.localeCompare(b.assignment.chore.title)
  })

  // ── Helpers ───────────────────────────────────────────────────────────────

  function triggerPop(id: string) {
    setAnimating((prev) => new Set(prev).add(id))
    setTimeout(() => {
      setAnimating((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 350)
  }

  function applyOptimistic(id: string, status: Status, pointsAwarded?: number | null) {
    setLocalInstances((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, status, pointsAwarded: pointsAwarded ?? i.pointsAwarded, notes: null, reviewedAt: null }
          : i
      )
    )
  }

  function revert(id: string) {
    setLocalInstances((prev) =>
      prev.map((i) => (i.id === id ? instances.find((o) => o.id === id) ?? i : i))
    )
  }

  // ── Checkbox tap (quick complete, no photo) ───────────────────────────────

  async function handleTap(inst: ChoreInst) {
    if (inst.status !== 'available' && inst.status !== 'rejected') return
    if (submittingRef.current.has(inst.id)) return
    submittingRef.current.add(inst.id)

    applyOptimistic(inst.id, 'submitted_complete')
    triggerPop(inst.id)

    try {
      const res = await fetch(`/api/child/chore-instances/${inst.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })
      if (!res.ok) { revert(inst.id); return }
      const data = await res.json()
      const newStatus: Status = data.status === 'approved' ? 'approved' : 'submitted_complete'
      applyOptimistic(inst.id, newStatus, data.pointsAwarded ?? null)
    } catch {
      revert(inst.id)
    } finally {
      submittingRef.current.delete(inst.id)
    }
  }

  // ── Modal open / close ────────────────────────────────────────────────────

  function openModal(id: string) {
    setModalId(id)
    setModalNotes('')
    setModalPhoto(null)
    setModalPreview(null)
    setModalError('')
  }

  function closeModal() {
    setModalId(null)
    setModalPhoto(null)
    setModalPreview(null)
    setModalNotes('')
    setModalError('')
  }

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setModalPhoto(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setModalPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setModalPreview(null)
    }
  }

  // ── Modal submit ──────────────────────────────────────────────────────────

  const handleModalSubmit = useCallback(async (inst: ChoreInst) => {
    if (submittingRef.current.has(inst.id)) return
    submittingRef.current.add(inst.id)
    setModalLoading(true)
    setModalError('')

    try {
      // 1. Upload photo if provided
      let proofImageUrl: string | undefined
      if (modalPhoto) {
        setModalUploading(true)
        const form = new FormData()
        form.append('file', modalPhoto)
        const uploadRes = await fetch('/api/child/chore-instances/upload-proof', {
          method: 'POST',
          body: form,
        })
        setModalUploading(false)
        if (!uploadRes.ok) {
          const d = await uploadRes.json()
          setModalError(d.error ?? 'Photo upload failed')
          return
        }
        const { url } = await uploadRes.json()
        proofImageUrl = url as string
      }

      // 2. Submit chore
      const res = await fetch(`/api/child/chore-instances/${inst.id}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: modalNotes || undefined, proofImageUrl }),
      })
      if (!res.ok) {
        const d = await res.json()
        setModalError(d.error ?? 'Submission failed')
        return
      }
      const data = await res.json()
      const newStatus: Status = data.status === 'approved' ? 'approved' : 'submitted_complete'
      applyOptimistic(inst.id, newStatus, data.pointsAwarded ?? null)
      triggerPop(inst.id)
      closeModal()
    } catch (err) {
      setModalError(err instanceof Error ? err.message : 'Failed')
    } finally {
      setModalLoading(false)
      setModalUploading(false)
      submittingRef.current.delete(inst.id)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [modalPhoto, modalNotes])

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <section>
      {/* Section header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <h2
          style={{
            fontFamily: "'Bungee', sans-serif",
            color: '#ff6b00',
            fontSize: 13,
            letterSpacing: 2,
            textTransform: 'uppercase',
            margin: 0,
          }}
        >
          TODAY'S MISSIONS
        </h2>
        <div style={{ flex: 1, height: 1, background: '#1a3018' }} />
      </div>

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={handleFileChange}
      />

      <div
        style={{
          background: '#0d1810',
          border: '1px solid #1a3018',
          borderRadius: 10,
          overflow: 'hidden',
        }}
      >
        {sorted.length === 0 && (
          <div
            style={{
              padding: '32px 16px',
              textAlign: 'center',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>🏕️</span>
            <p style={{ color: '#4a6a4a', fontSize: 13, margin: 0 }}>No missions today. Stay alert.</p>
          </div>
        )}

        {sorted.map((inst, idx) => {
          const isPopping  = animating.has(inst.id)
          const isWeekly   = inst.assignment.chore.scheduleType === 'weekly'
          const isRedo     = (inst.status === 'available' && inst.reviewedAt !== null) || inst.status === 'rejected'
          const isModalOpen = modalId === inst.id

          const pts =
            inst.status === 'approved'
              ? inst.pointsAwarded ?? inst.assignment.chore.basePoints
              : inst.assignment.chore.basePoints

          return (
            <div
              key={inst.id}
              style={{
                borderBottom: idx < sorted.length - 1 ? '1px solid #1a3018' : 'none',
                transform: isPopping ? 'scale(1.03)' : 'scale(1)',
                transition: 'transform 0.3s ease',
              }}
            >
              {/* ── Main row ─────────────────────────────────────────────── */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 0 }}>
                {/* Checkbox area — 48×48 tap target */}
                <div
                  onClick={() => handleTap(inst)}
                  style={{
                    width: 48,
                    height: 48,
                    minWidth: 48,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: inst.status === 'available' || inst.status === 'rejected' ? 'pointer' : 'default',
                    flexShrink: 0,
                  }}
                  aria-label={inst.status === 'available' ? `Complete ${inst.assignment.chore.title}` : undefined}
                >
                  {(inst.status === 'available' || inst.status === 'rejected') && (
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: '50%',
                        border: isRedo ? '2px solid #ff9a20' : '2px solid #2a5028',
                        background: isRedo ? 'rgba(255,154,32,0.06)' : 'rgba(61,255,122,0.04)',
                      }}
                    />
                  )}
                  {inst.status === 'submitted_complete' && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '2px solid #f5c842',
                        background: 'rgba(245,200,66,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <span style={{ fontSize: 14 }}>⏳</span>
                    </div>
                  )}
                  {inst.status === 'approved' && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        background: '#3dff7a',
                        boxShadow: '0 0 10px rgba(61,255,122,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="14" height="10" viewBox="0 0 14 10" fill="none">
                        <path d="M1 5L5 9L13 1" stroke="#060a06" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>
                  )}
                  {(inst.status === 'missed' || inst.status === 'expired') && (
                    <div
                      style={{
                        width: 28, height: 28, borderRadius: '50%',
                        border: '2px solid #ff4a4a',
                        background: 'rgba(255,74,74,0.08)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}
                    >
                      <svg width="11" height="11" viewBox="0 0 11 11" fill="none">
                        <path d="M1 1L10 10M10 1L1 10" stroke="#ff4a4a" strokeWidth="2" strokeLinecap="round"/>
                      </svg>
                    </div>
                  )}
                </div>

                {/* Chore info */}
                <div style={{ flex: 1, minWidth: 0, padding: '10px 4px 10px 0' }}>
                  {/* Title row + badges */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}>
                    <p
                      style={{
                        margin: 0,
                        fontSize: 13,
                        color:
                          inst.status === 'approved'
                            ? '#4a6a4a'
                            : inst.status === 'missed' || inst.status === 'expired'
                            ? '#4a3030'
                            : '#e8f5e8',
                        textDecoration: inst.status === 'approved' ? 'line-through' : 'none',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        maxWidth: '100%',
                      }}
                    >
                      {inst.assignment.chore.title}
                    </p>
                    {isWeekly && <WeeklyBadge />}
                    {isRedo   && <RedoBadge />}
                  </div>

                  {/* Status sub-label */}
                  {inst.status === 'submitted_complete' && (
                    <p style={{ margin: 0, fontSize: 10, color: '#f5c842', marginTop: 2 }}>Pending review…</p>
                  )}
                  {inst.status === 'missed' && (
                    <p style={{ margin: 0, fontSize: 10, color: '#ff4a4a', marginTop: 2 }}>Missed</p>
                  )}
                  {inst.status === 'expired' && (
                    <p style={{ margin: 0, fontSize: 10, color: '#ff4a4a', marginTop: 2 }}>Expired</p>
                  )}

                  {/* Parent rejection note */}
                  {isRedo && inst.notes && (
                    <p style={{ margin: '3px 0 0', fontSize: 11, color: '#6a5a30', fontStyle: 'italic' }}>
                      Parent note: {inst.notes}
                    </p>
                  )}
                </div>

                {/* Camera / submit button (available or rejected chores) */}
                {(inst.status === 'available' || inst.status === 'rejected') && (
                  <button
                    onClick={(e) => { e.stopPropagation(); openModal(inst.id) }}
                    style={{
                      width: 32, height: 32,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: 'transparent',
                      border: '1px solid #2a4a28',
                      borderRadius: 6,
                      color: '#4a7a40',
                      cursor: 'pointer',
                      flexShrink: 0,
                      marginRight: 6,
                    }}
                    aria-label="Submit with photo or note"
                  >
                    <CameraIcon />
                  </button>
                )}

                {/* Points */}
                <div style={{ flexShrink: 0, padding: '0 14px 0 4px', textAlign: 'right' }}>
                  <span
                    style={{
                      fontFamily: "'VT323', monospace",
                      fontSize: 16,
                      color:
                        inst.status === 'approved'
                          ? '#3dff7a'
                          : inst.status === 'submitted_complete'
                          ? '#f5c842'
                          : inst.status === 'available'
                          ? '#f5c842'
                          : '#2a4a2a',
                    }}
                  >
                    +{pts}pts
                  </span>
                </div>
              </div>

              {/* ── Inline submission modal ───────────────────────────────── */}
              {isModalOpen && (
                <div
                  style={{
                    margin: '0 12px 12px',
                    background: '#060a06',
                    border: '1px solid #1a3018',
                    borderRadius: 10,
                    padding: '14px 14px 12px',
                  }}
                >
                  <p
                    style={{
                      fontFamily: "'Bungee', sans-serif",
                      color: '#3dff7a',
                      fontSize: 11,
                      letterSpacing: 1.5,
                      textTransform: 'uppercase',
                      margin: '0 0 10px',
                    }}
                  >
                    Submit Chore Proof
                  </p>

                  {modalError && (
                    <p style={{ color: '#ff4a4a', fontSize: 11, margin: '0 0 8px' }}>{modalError}</p>
                  )}

                  {/* Photo upload area */}
                  {modalPreview ? (
                    <div style={{ position: 'relative', marginBottom: 10 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={modalPreview}
                        alt="Proof photo preview"
                        style={{ width: '100%', maxHeight: 140, objectFit: 'cover', borderRadius: 8 }}
                      />
                      <button
                        onClick={() => { setModalPhoto(null); setModalPreview(null) }}
                        style={{
                          position: 'absolute', top: 6, right: 6,
                          width: 22, height: 22, borderRadius: '50%',
                          background: '#cc2020', border: 'none', color: 'white',
                          fontSize: 11, cursor: 'pointer',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        ✕
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => fileRef.current?.click()}
                      style={{
                        width: '100%',
                        height: 80,
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: 6,
                        background: 'rgba(61,255,122,0.04)',
                        border: '2px dashed #2a4a28',
                        borderRadius: 10,
                        color: '#4a7a40',
                        fontSize: 11,
                        cursor: 'pointer',
                        marginBottom: 10,
                      }}
                    >
                      <span style={{ fontSize: 20 }}>📷</span>
                      <span>TAP TO ADD PHOTO (optional)</span>
                    </button>
                  )}

                  {/* Text note */}
                  <textarea
                    placeholder="Describe what you did… (optional)"
                    value={modalNotes}
                    onChange={(e) => setModalNotes(e.target.value)}
                    rows={2}
                    maxLength={500}
                    style={{
                      width: '100%',
                      background: '#0a1208',
                      border: '1px solid #1a3018',
                      borderRadius: 8,
                      color: '#c8e0c0',
                      fontSize: 14,
                      fontFamily: "'Barlow Condensed', sans-serif",
                      padding: '10px',
                      resize: 'none',
                      marginBottom: 10,
                      boxSizing: 'border-box',
                    }}
                  />

                  {/* Submit button */}
                  <button
                    onClick={() => handleModalSubmit(inst)}
                    disabled={modalLoading || modalUploading}
                    style={{
                      width: '100%',
                      height: 48,
                      background: '#1a4020',
                      border: '2px solid #3dff7a',
                      borderRadius: 10,
                      color: '#3dff7a',
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 14,
                      letterSpacing: 1.5,
                      cursor: modalLoading || modalUploading ? 'wait' : 'pointer',
                      opacity: modalLoading || modalUploading ? 0.6 : 1,
                      marginBottom: 6,
                    }}
                  >
                    {modalUploading ? 'UPLOADING…' : modalLoading ? 'SUBMITTING…' : 'MARK COMPLETE'}
                  </button>

                  {/* Cancel */}
                  <button
                    onClick={closeModal}
                    style={{
                      width: '100%',
                      background: 'none',
                      border: 'none',
                      color: '#4a6a4a',
                      fontSize: 11,
                      cursor: 'pointer',
                      padding: '4px 0',
                    }}
                  >
                    CANCEL
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </section>
  )
}
