'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  childUserId: string
  weekStart: string // YYYY-MM-DD
  alreadyFinalized: boolean
}

export function FinalizeWeekButton({ childUserId, weekStart, alreadyFinalized }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<'idle' | 'confirm' | 'loading'>('idle')
  const [error, setError] = useState('')

  if (alreadyFinalized) {
    return (
      <span className="inline-flex items-center gap-1 text-green-700 text-sm font-medium bg-green-50 border border-green-200 rounded-lg px-3 py-1.5">
        ✓ Finalized
      </span>
    )
  }

  async function finalize() {
    setStep('loading')
    setError('')

    const res = await fetch('/api/admin/weekly-review/finalize', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ childUserId, weekStart }),
    })

    if (res.ok) {
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to finalize')
      setStep('idle')
    }
  }

  return (
    <div className="space-y-1">
      {error && <p className="text-red-600 text-xs">{error}</p>}

      {step === 'idle' && (
        <button
          onClick={() => setStep('confirm')}
          className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg font-medium"
        >
          Finalize Week
        </button>
      )}

      {step === 'confirm' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-600">Lock in and pay out?</span>
          <button
            onClick={finalize}
            className="bg-gray-900 text-white text-sm px-3 py-1.5 rounded-lg font-medium"
          >
            Yes, Finalize
          </button>
          <button onClick={() => setStep('idle')} className="text-sm text-gray-500">
            Cancel
          </button>
        </div>
      )}

      {step === 'loading' && (
        <span className="text-sm text-gray-400">Finalizing…</span>
      )}
    </div>
  )
}
