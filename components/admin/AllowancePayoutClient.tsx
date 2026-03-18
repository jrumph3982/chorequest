'use client'

import { useState } from 'react'

interface PendingPayout {
  id: string
  childId: string
  childName: string
  childBalanceCents: number
  amountCents: number
  periodStart: string
  periodEnd: string
  status: string
}

interface RecentPayout {
  id: string
  childName: string
  amountCents: number
  paidAt: string | null
  paymentMethod: string | null
  paidByName: string | null
  periodStart: string
  periodEnd: string
}

interface Props {
  pending: PendingPayout[]
  recent: RecentPayout[]
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

function fmtMoney(cents: number) {
  return `$${(cents / 100).toFixed(2)}`
}

export function AllowancePayoutClient({ pending: initialPending, recent }: Props) {
  const [pending, setPending] = useState(initialPending)
  const [payModal, setPayModal] = useState<PendingPayout | null>(null)
  const [paymentMethod, setPaymentMethod] = useState('cash')
  const [parentNote, setParentNote] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handlePay() {
    if (!payModal) return
    setLoading(true)
    setError('')
    const res = await fetch(`/api/admin/allowance/payouts/${payModal.id}/pay`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ paymentMethod, parentNote }),
    })
    if (res.ok) {
      setPending((p) => p.filter((x) => x.id !== payModal.id))
      setPayModal(null)
      setParentNote('')
    } else {
      const d = await res.json()
      setError(d.error ?? 'Something went wrong')
    }
    setLoading(false)
  }

  async function handleHold(id: string) {
    await fetch(`/api/admin/allowance/payouts/${id}/hold`, { method: 'POST' })
    setPending((p) => p.filter((x) => x.id !== id))
  }

  // Group pending by child
  const byChild: Record<string, PendingPayout[]> = {}
  for (const p of pending) {
    if (!byChild[p.childId]) byChild[p.childId] = []
    byChild[p.childId].push(p)
  }

  const cardStyle = {
    background: '#1e293b',
    border: '1px solid #334155',
    borderRadius: 12,
    padding: 20,
  }

  return (
    <div className="space-y-6">
      {/* Pending payouts */}
      <div>
        <h2 className="text-base font-bold text-slate-200 mb-3">Pending Payouts</h2>
        {pending.length === 0 ? (
          <div style={cardStyle} className="text-center py-8">
            <p className="text-2xl mb-2">✅</p>
            <p className="text-slate-400 text-sm">All caught up! No pending payouts.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {Object.entries(byChild).map(([, payouts]) => {
              const child = payouts[0]
              const totalCents = payouts.reduce((s, p) => s + p.amountCents, 0)
              return (
                <div key={child.childId} style={cardStyle}>
                  <div className="flex items-center justify-between mb-3">
                    <div>
                      <p className="font-bold text-slate-100">{child.childName}</p>
                      <p className="text-xs text-slate-400">
                        Wallet balance: {fmtMoney(child.childBalanceCents)}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-slate-400 uppercase tracking-wider font-bold">Total Due</p>
                      <p className="text-xl font-bold text-yellow-400" style={{ fontFamily: "'Bungee', sans-serif" }}>
                        {fmtMoney(totalCents)}
                      </p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {payouts.map((p) => (
                      <div
                        key={p.id}
                        className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                        style={{ background: 'rgba(34,197,94,0.05)', border: '1px solid rgba(34,197,94,0.15)' }}
                      >
                        <div>
                          <p className="text-sm text-slate-200">
                            {fmtDate(p.periodStart)} – {fmtDate(p.periodEnd)}
                          </p>
                        </div>
                        <p className="font-bold text-green-400">{fmtMoney(p.amountCents)}</p>
                        <div className="flex gap-2">
                          <button
                            onClick={() => setPayModal(p)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-green-500/20 border border-green-500/40 text-green-400 hover:bg-green-500/30 transition-colors"
                          >
                            PAY
                          </button>
                          <button
                            onClick={() => handleHold(p.id)}
                            className="px-3 py-1 rounded-lg text-xs font-bold bg-orange-500/10 border border-orange-500/30 text-orange-400 hover:bg-orange-500/20 transition-colors"
                          >
                            HOLD
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Payment history */}
      {recent.length > 0 && (
        <div>
          <h2 className="text-base font-bold text-slate-200 mb-3">Recent Payments (30 days)</h2>
          <div style={cardStyle}>
            <div className="space-y-2">
              {recent.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between gap-3 px-3 py-2 rounded-lg"
                  style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.06)' }}
                >
                  <div>
                    <p className="text-sm font-semibold text-slate-200">{r.childName}</p>
                    <p className="text-xs text-slate-500">
                      {fmtDate(r.periodStart)} – {fmtDate(r.periodEnd)}
                      {r.paymentMethod && ` · ${r.paymentMethod}`}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-slate-400">{fmtMoney(r.amountCents)}</p>
                    <p className="text-xs text-slate-600">
                      {r.paidAt ? new Date(r.paidAt).toLocaleDateString() : ''}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 9000,
            background: 'rgba(0,0,0,0.7)',
            display: 'flex', alignItems: 'flex-end', justifyContent: 'center',
          }}
          onClick={(e) => { if (e.target === e.currentTarget) setPayModal(null) }}
        >
          <div
            style={{
              width: '100%', maxWidth: 480,
              background: '#1e293b',
              borderTop: '1px solid #334155',
              borderRadius: '16px 16px 0 0',
              padding: 24,
            }}
          >
            <h3 className="text-lg font-bold text-slate-100 mb-1">Mark as Paid</h3>
            <p className="text-sm text-slate-400 mb-4">
              {payModal.childName} · {fmtMoney(payModal.amountCents)}
            </p>

            {error && (
              <div className="mb-4 px-3 py-2 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 text-sm">
                {error}
              </div>
            )}

            <div className="space-y-3 mb-4">
              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Payment Method</p>
                <div className="grid grid-cols-3 gap-2">
                  {['cash', 'bank', 'venmo', 'check', 'other'].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setPaymentMethod(m)}
                      className={`py-2 px-1 rounded-lg border text-xs font-bold capitalize transition-colors ${
                        paymentMethod === m
                          ? 'border-green-500 bg-green-500/20 text-green-400'
                          : 'border-slate-700 bg-slate-800 text-slate-400 hover:border-slate-500'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1.5">Note (optional)</p>
                <input
                  value={parentNote}
                  onChange={(e) => setParentNote(e.target.value)}
                  placeholder="e.g., Paid in cash at dinner"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-slate-100 text-sm outline-none focus:border-green-500/50"
                  maxLength={200}
                />
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => setPayModal(null)}
                className="flex-1 py-3 rounded-xl border border-slate-700 text-slate-400 font-bold text-sm hover:bg-slate-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handlePay}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-green-500 text-slate-900 font-bold text-sm hover:bg-green-400 transition-colors disabled:opacity-50"
              >
                {loading ? 'Saving…' : '✓ CONFIRM PAID'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
