'use client'

import { useState, useCallback } from 'react'

interface PendingInst {
  id: string
  choreTitle: string
  basePoints: number
  submittedAt: string | null
  notes: string | null
  proofImageUrl: string | null
  reviewedAt: string | null
}

interface ChildProfile {
  skinTone: string | null
  hairColor: string | null
  eyeColor: string | null
  gender: string | null
}

export interface ChildSection {
  childId: string
  childName: string
  childProfile: ChildProfile
  instances: PendingInst[]
}

interface Props {
  children: ChildSection[]
}

// ── Mini avatar (head only) ────────────────────────────────────────────────────
function MiniAvatar({ profile }: { profile: ChildProfile }) {
  const skin = profile.skinTone ?? '#c8956a'
  const hair = profile.hairColor ?? '#4a2800'
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" style={{ borderRadius: '50%', flexShrink: 0 }}>
      <circle cx="18" cy="18" r="18" fill="#0a1208" />
      <ellipse cx="18" cy="30" rx="10" ry="7" fill={skin} />
      <circle cx="18" cy="16" r="9" fill={skin} />
      <ellipse cx="18" cy="9" rx="9" ry="5" fill={hair} />
      <ellipse cx="18" cy="8" rx="9" ry="3" fill={hair} />
      <circle cx="15" cy="15" r="1.5" fill="#1a0e06" />
      <circle cx="21" cy="15" r="1.5" fill="#1a0e06" />
      <circle cx="15.5" cy="14.5" r="0.5" fill="#fff" />
      <circle cx="21.5" cy="14.5" r="0.5" fill="#fff" />
    </svg>
  )
}

const QUICK_REASONS = ['Try again', 'Needs more effort', 'Not done yet']

// ── Main component ─────────────────────────────────────────────────────────────
export function ApprovalsGroupedClient({ children: childData }: Props) {
  const [expanded, setExpanded] = useState<Set<string>>(
    () => new Set(childData.filter((c) => c.instances.length > 0).map((c) => c.childId)),
  )

  const [instsByChild, setInstsByChild] = useState<Map<string, PendingInst[]>>(
    () => new Map(childData.map((c) => [c.childId, [...c.instances]])),
  )

  const [dismissing, setDismissing] = useState<Set<string>>(new Set())
  const [loadingIds, setLoadingIds] = useState<Set<string>>(new Set())
  const [bulkLoading, setBulkLoading] = useState<string | null>(null)

  // Reject modal
  const [rejectModal, setRejectModal] = useState<{
    instanceId: string
    choreTitle: string
    childId: string
  } | null>(null)
  const [rejectNote, setRejectNote] = useState('')
  const [rejectLoading, setRejectLoading] = useState(false)
  const [rejectError, setRejectError] = useState('')

  // Bulk confirm modal
  const [bulkConfirm, setBulkConfirm] = useState<{
    childId: string
    childName: string
    action: 'approve' | 'reject'
    count: number
  } | null>(null)

  // Photo lightbox
  const [photoModal, setPhotoModal] = useState<string | null>(null)

  // ── Helpers ──────────────────────────────────────────────────────────────────

  const toggleExpand = (childId: string) =>
    setExpanded((prev) => {
      const next = new Set(prev)
      next.has(childId) ? next.delete(childId) : next.add(childId)
      return next
    })

  const removeInstance = useCallback((instanceId: string, childId: string) => {
    setDismissing((prev) => new Set(prev).add(instanceId))
    setTimeout(() => {
      setInstsByChild((prev) => {
        const next = new Map(prev)
        next.set(childId, (next.get(childId) ?? []).filter((i) => i.id !== instanceId))
        return next
      })
      setDismissing((prev) => {
        const next = new Set(prev)
        next.delete(instanceId)
        return next
      })
    }, 320)
  }, [])

  // ── Individual actions ────────────────────────────────────────────────────────

  async function handleApprove(inst: PendingInst, childId: string) {
    if (loadingIds.has(inst.id)) return
    setLoadingIds((prev) => new Set(prev).add(inst.id))
    try {
      const res = await fetch(`/api/admin/chore-instances/${inst.id}/approve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pointsOverride: inst.basePoints }),
      })
      if (res.ok) removeInstance(inst.id, childId)
    } finally {
      setLoadingIds((prev) => {
        const n = new Set(prev)
        n.delete(inst.id)
        return n
      })
    }
  }

  async function handleRejectConfirm() {
    if (!rejectModal) return
    setRejectLoading(true)
    setRejectError('')
    try {
      const res = await fetch(`/api/admin/chore-instances/${rejectModal.instanceId}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: rejectNote || undefined }),
      })
      if (res.ok) {
        removeInstance(rejectModal.instanceId, rejectModal.childId)
        setRejectModal(null)
      } else {
        const d = await res.json()
        setRejectError(typeof d.error === 'string' ? d.error : 'Request failed')
      }
    } finally {
      setRejectLoading(false)
    }
  }

  // ── Bulk actions ──────────────────────────────────────────────────────────────

  async function runBulkApprove(childId: string, insts: PendingInst[]) {
    setBulkLoading(childId)
    try {
      await Promise.all(
        insts.map((inst) =>
          fetch(`/api/admin/chore-instances/${inst.id}/approve`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pointsOverride: inst.basePoints }),
          }),
        ),
      )
      insts.forEach((inst) => removeInstance(inst.id, childId))
    } finally {
      setBulkLoading(null)
      setBulkConfirm(null)
    }
  }

  async function runBulkReject(childId: string, insts: PendingInst[]) {
    setBulkLoading(childId)
    try {
      await Promise.all(
        insts.map((inst) =>
          fetch(`/api/admin/chore-instances/${inst.id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({}),
          }),
        ),
      )
      insts.forEach((inst) => removeInstance(inst.id, childId))
    } finally {
      setBulkLoading(null)
      setBulkConfirm(null)
    }
  }

  async function runBulkConfirmAction() {
    if (!bulkConfirm) return
    if (bulkConfirm.childId === '__all__') {
      // Approve all across all children
      const entries = Array.from(instsByChild.entries())
      setBulkLoading('__all__')
      await Promise.all(
        entries.flatMap(([cid, insts]) =>
          insts.map((inst) =>
            fetch(`/api/admin/chore-instances/${inst.id}/approve`, {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ pointsOverride: inst.basePoints }),
            }).then(() => removeInstance(inst.id, cid)),
          ),
        ),
      )
      setBulkLoading(null)
      setBulkConfirm(null)
    } else {
      const insts = instsByChild.get(bulkConfirm.childId) ?? []
      if (bulkConfirm.action === 'approve') await runBulkApprove(bulkConfirm.childId, insts)
      else await runBulkReject(bulkConfirm.childId, insts)
    }
  }

  // ── Derived totals ────────────────────────────────────────────────────────────

  const totalPending = Array.from(instsByChild.values()).reduce((s, a) => s + a.length, 0)
  const childrenWithPending = Array.from(instsByChild.values()).filter((a) => a.length > 0).length

  // ── Render ────────────────────────────────────────────────────────────────────

  return (
    <>
      {/* ── Summary header ─────────────────────────────────────────────────────── */}
      <div
        style={{
          background: '#0a1208',
          border: '1px solid #1a3018',
          borderRadius: 10,
          padding: '12px 14px',
          display: 'flex',
          alignItems: 'center',
          gap: 14,
          marginBottom: 8,
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: '#ff6b00', lineHeight: 1 }}>
            {totalPending}
          </div>
          <div style={{ fontSize: 10, color: '#4a7a40', textTransform: 'uppercase', letterSpacing: 1 }}>
            Total Pending
          </div>
        </div>
        <div style={{ width: 1, height: 32, background: '#1a3018', flexShrink: 0 }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontFamily: "'Bungee', sans-serif", fontSize: 28, color: '#f5c842', lineHeight: 1 }}>
            {childrenWithPending}
          </div>
          <div style={{ fontSize: 10, color: '#4a7a40', textTransform: 'uppercase', letterSpacing: 1 }}>
            Waiting
          </div>
        </div>
        {totalPending > 0 && (
          <button
            onClick={() =>
              setBulkConfirm({
                childId: '__all__',
                childName: 'all children',
                action: 'approve',
                count: totalPending,
              })
            }
            style={{
              marginLeft: 'auto',
              height: 36,
              padding: '0 14px',
              background: '#1a4020',
              border: '1px solid #3dff7a',
              borderRadius: 8,
              color: '#3dff7a',
              fontFamily: "'Bungee', sans-serif",
              fontSize: 11,
              letterSpacing: 1,
              cursor: 'pointer',
            }}
          >
            ✓ APPROVE ALL
          </button>
        )}
      </div>

      {totalPending === 0 && (
        <div
          style={{
            background: '#0d1810',
            border: '1px solid #1a3018',
            borderRadius: 10,
            padding: '32px 16px',
            textAlign: 'center',
          }}
        >
          <div style={{ fontSize: 40, marginBottom: 8 }}>✅</div>
          <p style={{ color: '#4a7a40', fontSize: 13, margin: 0 }}>All caught up! No missions awaiting review.</p>
        </div>
      )}

      {/* ── Child sections ──────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {childData.map((child) => {
          const insts = instsByChild.get(child.childId) ?? []
          const isExpanded = expanded.has(child.childId)
          const isBulkLoading = bulkLoading === child.childId || bulkLoading === '__all__'

          return (
            <div
              key={child.childId}
              style={{
                background: '#0d1810',
                border: '1px solid #1a3018',
                borderRadius: 10,
                overflow: 'hidden',
              }}
            >
              {/* Header row */}
              <div
                onClick={() => toggleExpand(child.childId)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  padding: '12px 14px',
                  cursor: 'pointer',
                  borderBottom: isExpanded && insts.length > 0 ? '1px solid #1a3018' : 'none',
                }}
              >
                <div style={{ border: '2px solid #2a5028', borderRadius: '50%', flexShrink: 0 }}>
                  <MiniAvatar profile={child.childProfile} />
                </div>
                <span
                  style={{
                    fontFamily: "'Bungee', sans-serif",
                    fontSize: 15,
                    color: '#fff',
                    letterSpacing: 1,
                  }}
                >
                  {child.childName}
                </span>
                {insts.length > 0 ? (
                  <span
                    style={{
                      background: '#ff6b00',
                      color: '#fff',
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    {insts.length} PENDING
                  </span>
                ) : (
                  <span
                    style={{
                      background: '#1a3018',
                      color: '#4a7a40',
                      fontFamily: "'Bungee', sans-serif",
                      fontSize: 11,
                      padding: '2px 8px',
                      borderRadius: 10,
                    }}
                  >
                    ALL CLEAR
                  </span>
                )}
                <span
                  style={{
                    marginLeft: 'auto',
                    color: '#4a7a40',
                    fontSize: 12,
                    transition: 'transform 0.2s',
                    transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                    display: 'inline-block',
                  }}
                >
                  ▼
                </span>
              </div>

              {/* Chore rows */}
              {isExpanded && insts.length > 0 && (
                <div>
                  {insts.map((inst, idx) => {
                    const isDismissing = dismissing.has(inst.id)
                    const isLoading = loadingIds.has(inst.id)
                    const isRedo = inst.reviewedAt !== null
                    const submittedTime = inst.submittedAt
                      ? new Date(inst.submittedAt).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })
                      : ''

                    return (
                      <div
                        key={inst.id}
                        style={{
                          padding: isDismissing ? '0 14px' : '10px 14px',
                          borderBottom:
                            idx < insts.length - 1 ? '1px solid rgba(26,48,24,0.5)' : 'none',
                          display: 'flex',
                          alignItems: 'center',
                          gap: 10,
                          transition: 'opacity 0.3s, max-height 0.3s, padding 0.3s',
                          opacity: isDismissing ? 0 : 1,
                          maxHeight: isDismissing ? 0 : 120,
                          overflow: 'hidden',
                        }}
                      >
                        {/* Chore icon */}
                        <div
                          style={{
                            width: 32,
                            height: 32,
                            borderRadius: 8,
                            background: '#0a1208',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: 16,
                            flexShrink: 0,
                          }}
                        >
                          📋
                        </div>

                        {/* Info */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div
                            style={{ display: 'flex', alignItems: 'center', gap: 5, flexWrap: 'wrap' }}
                          >
                            <span
                              style={{
                                fontSize: 13,
                                fontFamily: "'Bungee', sans-serif",
                                color: '#fff',
                              }}
                            >
                              {inst.choreTitle}
                            </span>
                            {isRedo && (
                              <span
                                style={{
                                  background: 'rgba(255,107,0,0.15)',
                                  border: '1px solid #5a3000',
                                  color: '#ff9a20',
                                  fontSize: 8,
                                  fontFamily: "'Bungee', sans-serif",
                                  padding: '1px 5px',
                                  borderRadius: 3,
                                }}
                              >
                                REDO
                              </span>
                            )}
                          </div>
                          <div
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              marginTop: 2,
                              flexWrap: 'wrap',
                            }}
                          >
                            <span style={{ fontSize: 11, color: '#4a7a40' }}>
                              submitted {submittedTime}
                            </span>
                            {inst.notes && (
                              <span style={{ fontSize: 11, color: '#6a8a60', fontStyle: 'italic' }}>
                                &ldquo;{inst.notes}&rdquo;
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Photo thumbnail */}
                        {inst.proofImageUrl && (
                          <button
                            onClick={() => setPhotoModal(inst.proofImageUrl!)}
                            style={{
                              width: 36,
                              height: 36,
                              borderRadius: 6,
                              overflow: 'hidden',
                              flexShrink: 0,
                              border: '1px solid #2a5028',
                              cursor: 'pointer',
                              padding: 0,
                              background: 'none',
                            }}
                          >
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={inst.proofImageUrl}
                              alt="proof"
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                          </button>
                        )}

                        {/* Points */}
                        <span
                          style={{
                            fontFamily: "'Bungee', sans-serif",
                            fontSize: 13,
                            color: '#f5c842',
                            flexShrink: 0,
                          }}
                        >
                          +{inst.basePoints}pts
                        </span>

                        {/* Approve / Reject buttons */}
                        <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                          <button
                            onClick={() => handleApprove(inst, child.childId)}
                            disabled={isLoading || isBulkLoading}
                            style={{
                              width: 72,
                              height: 36,
                              background: '#1a4020',
                              border: '1px solid #3dff7a',
                              borderRadius: 6,
                              color: '#3dff7a',
                              fontFamily: "'Bungee', sans-serif",
                              fontSize: 11,
                              letterSpacing: 1,
                              cursor: isLoading ? 'wait' : 'pointer',
                              opacity: isLoading || isBulkLoading ? 0.5 : 1,
                            }}
                          >
                            {isLoading ? '⏳' : '✓ OK'}
                          </button>
                          <button
                            onClick={() =>
                              setRejectModal({
                                instanceId: inst.id,
                                choreTitle: inst.choreTitle,
                                childId: child.childId,
                              })
                            }
                            disabled={isLoading || isBulkLoading}
                            style={{
                              width: 72,
                              height: 36,
                              background: '#1a0808',
                              border: '1px solid #ff4a4a',
                              borderRadius: 6,
                              color: '#ff4a4a',
                              fontFamily: "'Bungee', sans-serif",
                              fontSize: 11,
                              cursor: 'pointer',
                              opacity: isLoading || isBulkLoading ? 0.5 : 1,
                            }}
                          >
                            ✗ NO
                          </button>
                        </div>
                      </div>
                    )
                  })}

                  {/* Bulk action row */}
                  <div style={{ display: 'flex', gap: 8, padding: '8px 14px 12px' }}>
                    <button
                      onClick={() =>
                        setBulkConfirm({
                          childId: child.childId,
                          childName: child.childName,
                          action: 'approve',
                          count: insts.length,
                        })
                      }
                      disabled={isBulkLoading}
                      style={{
                        flex: 1,
                        height: 38,
                        background: 'rgba(61,255,122,0.1)',
                        border: '1px solid #2a5a28',
                        color: '#3dff7a',
                        fontFamily: "'Bungee', sans-serif",
                        fontSize: 12,
                        borderRadius: 8,
                        cursor: 'pointer',
                        opacity: isBulkLoading ? 0.5 : 1,
                      }}
                    >
                      {isBulkLoading ? '⏳' : `✓ APPROVE ALL (${insts.length})`}
                    </button>
                    <button
                      onClick={() =>
                        setBulkConfirm({
                          childId: child.childId,
                          childName: child.childName,
                          action: 'reject',
                          count: insts.length,
                        })
                      }
                      disabled={isBulkLoading}
                      style={{
                        flex: 1,
                        height: 38,
                        background: 'rgba(255,74,74,0.1)',
                        border: '1px solid #5a1818',
                        color: '#ff4a4a',
                        fontFamily: "'Bungee', sans-serif",
                        fontSize: 12,
                        borderRadius: 8,
                        cursor: 'pointer',
                        opacity: isBulkLoading ? 0.5 : 1,
                      }}
                    >
                      ✗ REJECT ALL ({insts.length})
                    </button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* ── Rejection modal ─────────────────────────────────────────────────────── */}
      {rejectModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setRejectModal(null)
          }}
        >
          <div
            style={{
              background: '#0d1810',
              border: '1px solid #5a1818',
              borderRadius: 12,
              padding: 16,
              maxWidth: 320,
              width: '100%',
            }}
          >
            <p
              style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: 16,
                color: '#ff4a4a',
                margin: '0 0 4px',
              }}
            >
              REJECT CHORE?
            </p>
            <p style={{ fontSize: 13, color: '#fff', margin: '0 0 12px' }}>
              {rejectModal.choreTitle}
            </p>
            {rejectError && (
              <p style={{ color: '#ff4a4a', fontSize: 11, margin: '0 0 8px' }}>{rejectError}</p>
            )}
            {/* Quick reason pills */}
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 10 }}>
              {QUICK_REASONS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRejectNote(r)}
                  style={{
                    background: '#1a0808',
                    border: '1px solid #3a1818',
                    color: '#ff6a6a',
                    fontSize: 11,
                    fontFamily: "'Bungee', sans-serif",
                    borderRadius: 12,
                    padding: '4px 10px',
                    cursor: 'pointer',
                  }}
                >
                  {r}
                </button>
              ))}
            </div>
            <textarea
              placeholder="Tell them why (optional)..."
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
              rows={3}
              maxLength={300}
              style={{
                width: '100%',
                background: '#0a1208',
                border: '1px solid #1a3018',
                color: '#c8e0c0',
                fontSize: 14,
                fontFamily: "'Barlow Condensed', sans-serif",
                borderRadius: 8,
                padding: 10,
                resize: 'none',
                marginBottom: 12,
                boxSizing: 'border-box',
                outline: 'none',
              }}
              onFocus={(e) => (e.target.style.borderColor = '#ff4a4a')}
              onBlur={(e) => (e.target.style.borderColor = '#1a3018')}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <button
                onClick={() => setRejectModal(null)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#4a7a40',
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                CANCEL
              </button>
              <button
                onClick={handleRejectConfirm}
                disabled={rejectLoading}
                style={{
                  background: '#cc2020',
                  color: '#fff',
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 13,
                  borderRadius: 8,
                  padding: '10px 20px',
                  border: 'none',
                  cursor: rejectLoading ? 'wait' : 'pointer',
                  opacity: rejectLoading ? 0.6 : 1,
                }}
              >
                {rejectLoading ? '⏳ REJECTING…' : 'CONFIRM REJECT'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Bulk confirm modal ──────────────────────────────────────────────────── */}
      {bulkConfirm && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 16,
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setBulkConfirm(null)
          }}
        >
          <div
            style={{
              background: '#0d1810',
              border: `1px solid ${bulkConfirm.action === 'approve' ? '#2a5028' : '#5a1818'}`,
              borderRadius: 12,
              padding: 20,
              maxWidth: 300,
              width: '100%',
              textAlign: 'center',
            }}
          >
            <p
              style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: 14,
                color: bulkConfirm.action === 'approve' ? '#3dff7a' : '#ff4a4a',
                margin: '0 0 8px',
              }}
            >
              {bulkConfirm.action === 'approve' ? '✓ APPROVE ALL?' : '✗ REJECT ALL?'}
            </p>
            <p style={{ fontSize: 12, color: '#c8e0c0', margin: '0 0 16px' }}>
              {bulkConfirm.action === 'approve' ? 'Approve' : 'Reject'} {bulkConfirm.count} chore
              {bulkConfirm.count !== 1 ? 's' : ''} for{' '}
              <strong>{bulkConfirm.childName}</strong>?
            </p>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => setBulkConfirm(null)}
                style={{
                  flex: 1,
                  height: 40,
                  background: '#1a3018',
                  border: '1px solid #1a3018',
                  borderRadius: 8,
                  color: '#4a7a40',
                  cursor: 'pointer',
                  fontSize: 12,
                }}
              >
                Cancel
              </button>
              <button
                onClick={runBulkConfirmAction}
                style={{
                  flex: 1,
                  height: 40,
                  background: bulkConfirm.action === 'approve' ? '#1a4020' : '#cc2020',
                  border: `1px solid ${bulkConfirm.action === 'approve' ? '#3dff7a' : '#ff4a4a'}`,
                  borderRadius: 8,
                  color: bulkConfirm.action === 'approve' ? '#3dff7a' : '#fff',
                  fontFamily: "'Bungee', sans-serif",
                  fontSize: 12,
                  cursor: 'pointer',
                }}
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Photo lightbox ──────────────────────────────────────────────────────── */}
      {photoModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            zIndex: 1000,
            background: 'rgba(0,0,0,0.92)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          onClick={() => setPhotoModal(null)}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={photoModal}
            alt="Proof"
            style={{
              maxWidth: '90vw',
              maxHeight: '90vh',
              objectFit: 'contain',
              borderRadius: 8,
            }}
          />
        </div>
      )}
    </>
  )
}
