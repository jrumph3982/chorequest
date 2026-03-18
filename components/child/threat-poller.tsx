'use client'

import { useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'

/**
 * Invisible client component that keeps server-rendered game state fresh.
 *
 * Every intervalMs it polls /api/child/game-state-version, a cheap endpoint
 * that returns the latest-change timestamp for this child's game state
 * (base damage, chore approvals, bonus approvals, survival settings).
 * router.refresh() is called only when that timestamp has advanced — avoiding
 * unnecessary re-renders when nothing has changed.
 *
 * This makes the threat meter and chore list update automatically after:
 *   - Admin chore approval / rejection
 *   - Admin bonus approval
 *   - Admin survival-settings changes
 *   - Nightly attack processing
 *
 * Child-initiated actions (repair, upgrade, submit, equip, buy) call
 * router.refresh() directly in their own components and are not affected here.
 *
 * The component also re-checks immediately whenever the tab becomes visible
 * (e.g. the child switches back from another app or tab).
 */
export function ThreatPoller({ intervalMs = 10_000 }: { intervalMs?: number }) {
  const router = useRouter()
  // Tracks the last-seen version timestamp. null means "not yet initialised".
  const lastTs = useRef<number | null>(null)

  useEffect(() => {
    async function checkAndRefresh() {
      try {
        const res = await fetch('/api/child/game-state-version', { cache: 'no-store' })
        if (!res.ok) return
        const { ts } = (await res.json()) as { ts: number }

        if (lastTs.current === null) {
          // First call on mount — record the baseline without triggering a refresh.
          lastTs.current = ts
        } else if (ts > lastTs.current) {
          lastTs.current = ts
          router.refresh()
        }
      } catch {
        // Silently ignore network errors; the next poll will catch up.
      }
    }

    function onVisible() {
      if (document.visibilityState === 'visible') checkAndRefresh()
    }

    checkAndRefresh() // Establish baseline immediately on mount.
    document.addEventListener('visibilitychange', onVisible)
    const id = setInterval(checkAndRefresh, intervalMs)

    return () => {
      document.removeEventListener('visibilitychange', onVisible)
      clearInterval(id)
    }
  }, [router, intervalMs])

  return null
}
