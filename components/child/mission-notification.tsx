'use client'

import { useState } from 'react'
import Link from 'next/link'

interface Props {
  choreName?: string
  onDismiss?: () => void
}

/**
 * MissionNotification — full-screen overlay shown when a new chore is assigned.
 * Render this inside a parent that controls visibility.
 *
 * Usage:
 *   const [show, setShow] = useState(true)
 *   {show && <MissionNotification choreName="Clean your room" onDismiss={() => setShow(false)} />}
 */
export function MissionNotification({ choreName, onDismiss }: Props) {
  const [dismissed, setDismissed] = useState(false)

  if (dismissed) return null

  function dismiss() {
    setDismissed(true)
    onDismiss?.()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div
        className="relative w-full max-w-sm rounded-2xl overflow-hidden"
        style={{ background: 'radial-gradient(circle at center, #1e293b 0%, #0f172a 100%)' }}
      >
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            backgroundImage: 'radial-gradient(circle, #22c55e 1px, transparent 1px)',
            backgroundSize: '20px 20px',
          }}
        />

        {/* Card */}
        <div
          className="relative border-2 rounded-xl overflow-hidden m-3"
          style={{
            borderColor: 'rgba(34,197,94,0.5)',
            boxShadow: '0 0 15px rgba(34,197,94,0.4)',
          }}
        >
          {/* Top scanner line */}
          <div className="absolute top-0 left-0 w-full h-1 bg-[#22c55e]/30 shadow-[0_0_10px_#22c55e]" />

          <div className="p-6">
            {/* Icon */}
            <div className="flex justify-center mb-4">
              <div
                className="w-16 h-16 rounded-full bg-[#22c55e]/10 border-2 border-[#22c55e] flex items-center justify-center animate-pulse"
              >
                <span className="text-4xl">🗑️</span>
              </div>
            </div>

            {/* Title */}
            <h4 className="text-[#22c55e] text-center text-lg font-extrabold leading-tight tracking-wider mb-2">
              NEW MISSION ASSIGNED!
            </h4>

            {/* Mission name */}
            <div className="bg-slate-800/50 rounded-lg p-4 border border-slate-700 mb-6">
              <p className="text-slate-200 text-sm text-center leading-relaxed">
                {choreName ? (
                  <>
                    New objective: <span className="text-[#22c55e] font-bold">{choreName}</span>
                    <br />
                    <span className="text-[#22c55e] font-bold">Gear up, recruit!</span>
                  </>
                ) : (
                  <>
                    A new objective has appeared on your terminal.{' '}
                    <span className="text-[#22c55e] font-bold">Gear up, recruit!</span>
                  </>
                )}
              </p>
            </div>

            {/* Buttons */}
            <div className="flex flex-col gap-3">
              <Link
                href="/play"
                className="w-full h-14 bg-[#22c55e] hover:bg-green-400 text-slate-950 font-extrabold rounded-xl flex items-center justify-center gap-2 transition-all"
                style={{ boxShadow: '0 0 20px rgba(34,197,94,0.5)' }}
                onClick={dismiss}
              >
                🚀 DEPLOY NOW
              </Link>
              <button
                onClick={dismiss}
                className="w-full h-12 bg-slate-800 hover:bg-slate-700 text-slate-400 font-bold rounded-xl border border-slate-700 transition-all uppercase text-xs tracking-widest"
              >
                Later
              </button>
            </div>
          </div>

          {/* Footer decor */}
          <div className="bg-[#22c55e]/5 py-2 px-4 border-t border-[#22c55e]/20 flex justify-between items-center">
            <span className="text-[8px] text-[#22c55e]/60 font-mono tracking-tighter">SECURE_LINK_ESTABLISHED</span>
            <span className="text-[8px] text-[#22c55e]/60 font-mono">V.2.0.4</span>
          </div>
        </div>
      </div>
    </div>
  )
}
