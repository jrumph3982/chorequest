'use client'

import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'

interface Props {
  instanceId: string
}

export function SubmitButton({ instanceId }: Props) {
  const router = useRouter()
  const fileRef = useRef<HTMLInputElement>(null)
  const [expanded, setExpanded] = useState(false)
  const [notes, setNotes] = useState('')
  const [photoFile, setPhotoFile] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [uploading, setUploading] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null
    setPhotoFile(file)
    if (file) {
      const reader = new FileReader()
      reader.onload = (ev) => setPhotoPreview(ev.target?.result as string)
      reader.readAsDataURL(file)
    } else {
      setPhotoPreview(null)
    }
  }

  async function uploadPhoto(): Promise<string | undefined> {
    if (!photoFile) return undefined
    setUploading(true)
    const form = new FormData()
    form.append('file', photoFile)
    const res = await fetch('/api/child/chore-instances/upload-proof', {
      method: 'POST',
      body: form,
    })
    setUploading(false)
    if (!res.ok) {
      const data = await res.json()
      throw new Error(data.error ?? 'Upload failed')
    }
    const { url } = await res.json()
    return url as string
  }

  async function submit() {
    setLoading(true)
    setError('')
    try {
      const proofImageUrl = await uploadPhoto()
      const res = await fetch(`/api/child/chore-instances/${instanceId}/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: notes || undefined, proofImageUrl }),
      })
      if (res.ok) {
        router.refresh()
      } else {
        const data = await res.json()
        setError(data.error ?? 'Failed')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed')
    }
    setLoading(false)
  }

  if (!expanded) {
    return (
      <button
        onClick={() => setExpanded(true)}
        className="bg-green-600 text-white text-xs px-4 py-2 rounded-lg font-medium hover:bg-green-500 transition-colors"
      >
        Mark Done
      </button>
    )
  }

  return (
    <div className="mt-2 bg-gray-800 rounded-lg p-3 space-y-2 w-full">
      {error && <p className="text-red-400 text-xs">{error}</p>}

      <textarea
        placeholder="Notes (optional)"
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        rows={2}
        maxLength={500}
        className="w-full bg-gray-700 border border-gray-600 rounded px-2 py-1 text-xs text-white placeholder-gray-500"
      />

      {/* Photo upload */}
      <div>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          capture="environment"
          className="hidden"
          onChange={handleFileChange}
        />
        {photoPreview ? (
          <div className="relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={photoPreview}
              alt="Proof photo"
              className="w-full max-h-32 object-cover rounded-lg"
            />
            <button
              onClick={() => { setPhotoFile(null); setPhotoPreview(null) }}
              className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-5 h-5 flex items-center justify-center text-[10px]"
            >
              ✕
            </button>
          </div>
        ) : (
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full py-2 rounded-lg border border-dashed border-gray-500 text-gray-400 text-xs hover:border-green-500 hover:text-green-400 transition-colors flex items-center justify-center gap-1.5"
          >
            📷 Add Photo Proof (optional)
          </button>
        )}
      </div>

      <div className="flex gap-2">
        <button
          onClick={submit}
          disabled={loading || uploading}
          className="bg-green-600 text-white text-xs px-3 py-1.5 rounded-lg font-medium disabled:opacity-50"
        >
          {uploading ? 'Uploading…' : loading ? '…' : 'Submit'}
        </button>
        <button onClick={() => setExpanded(false)} className="text-xs text-gray-400">
          Cancel
        </button>
      </div>
    </div>
  )
}
