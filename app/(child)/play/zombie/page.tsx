'use client'

import Link from 'next/link'
import { useState, useEffect } from 'react'

export default function ZombieGamePage() {
  const [fullscreen, setFullscreen] = useState(false)
  const [petReady, setPetReady] = useState(false)

  // Fetch active companion and write to localStorage before the iframe loads.
  // The game reads chq-active-pet on startup.
  useEffect(() => {
    fetch('/api/child/companion-active')
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (data) {
          localStorage.setItem('chq-active-pet', JSON.stringify(data))
        } else {
          localStorage.removeItem('chq-active-pet')
        }
      })
      .catch(() => {})
      .finally(() => setPetReady(true))
  }, [])

  return (
    <div className="flex flex-col" style={{ minHeight: '100dvh', background: '#0a0e14' }}>
      {/* Header bar */}
      <div
        className="flex items-center justify-between px-4 py-3 shrink-0"
        style={{ background: '#0f172a', borderBottom: '1px solid #1e293b' }}
      >
        <Link
          href="/play"
          className="flex items-center gap-2 text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
        >
          ← Back
        </Link>

        <span
          className="text-xs font-bold tracking-widest uppercase"
          style={{ color: '#f97316', fontFamily: "'Press Start 2P', monospace", fontSize: '10px' }}
        >
          ☣ Zombie Defense
        </span>

        <button
          onClick={() => setFullscreen((f) => !f)}
          className="text-slate-400 hover:text-slate-200 transition-colors text-sm font-medium"
        >
          {fullscreen ? '⊠ Exit' : '⛶ Full'}
        </button>
      </div>

      {/* Game iframe — only rendered after pet data is written to localStorage */}
      <div className={fullscreen ? 'fixed inset-0 z-50 bg-black' : 'flex-1 relative'}>
        {fullscreen && (
          <button
            onClick={() => setFullscreen(false)}
            className="absolute top-3 right-3 z-10 text-slate-400 hover:text-white text-xs font-bold px-3 py-1 rounded"
            style={{ background: 'rgba(15,23,42,0.8)', border: '1px solid #334155' }}
          >
            ✕ Exit Fullscreen
          </button>
        )}
        {petReady ? (
          <iframe
            src="/zombie-game/index.html"
            className="w-full h-full"
            style={{
              border: 'none',
              minHeight: fullscreen ? '100dvh' : 'calc(100dvh - 52px)',
              display: 'block',
              touchAction: 'none',
            }}
            title="Zombie Shelter Defense"
            allow="autoplay"
          />
        ) : (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              minHeight: 'calc(100dvh - 52px)',
              color: '#3dff7a',
              fontFamily: "'Press Start 2P', monospace",
              fontSize: 11,
              opacity: 0.6,
            }}
          >
            LOADING…
          </div>
        )}
      </div>
    </div>
  )
}
