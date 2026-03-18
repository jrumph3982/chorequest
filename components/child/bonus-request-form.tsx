'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export function BonusRequestForm() {
  const router = useRouter()
  const [description, setDescription] = useState('')
  const [requestedPoints, setRequestedPoints] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError('')
    setSuccess(false)

    const body: Record<string, unknown> = { description }
    if (requestedPoints) body.requestedPoints = Number(requestedPoints)

    const res = await fetch('/api/child/bonus-requests', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    })

    if (res.ok) {
      setSuccess(true)
      setDescription('')
      setRequestedPoints('')
      router.refresh()
    } else {
      const data = await res.json()
      setError(data.error ?? 'Failed to submit request')
    }
    setLoading(false)
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      {success && (
        <p className="text-green-400 text-sm bg-green-900/30 border border-green-800 rounded-lg px-3 py-2">
          ⭐ Request submitted! Wait for your parent to review it.
        </p>
      )}
      {error && <p className="text-red-400 text-sm">{error}</p>}

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          What did you do? *
        </label>
        <textarea
          required
          maxLength={500}
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the extra work you did…"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-300 mb-1">
          Points you think you deserve (optional)
        </label>
        <input
          type="number"
          min={1}
          max={1000}
          value={requestedPoints}
          onChange={(e) => setRequestedPoints(e.target.value)}
          placeholder="e.g. 20"
          className="w-full bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-green-600 text-white py-2.5 rounded-lg text-sm font-medium disabled:opacity-50"
      >
        {loading ? 'Submitting…' : '⭐ Submit Bonus Request'}
      </button>
    </form>
  )
}
