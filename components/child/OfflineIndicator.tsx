'use client'

import { useEffect, useState } from 'react'

export function OfflineIndicator() {
  const [offline, setOffline] = useState(false)
  const [justReconnected, setJustReconnected] = useState(false)

  useEffect(() => {
    // Initialize from navigator state
    setOffline(!navigator.onLine)

    const goOffline = () => setOffline(true)
    const goOnline = () => {
      setOffline(false)
      setJustReconnected(true)
      setTimeout(() => setJustReconnected(false), 3000)
    }

    window.addEventListener('offline', goOffline)
    window.addEventListener('online', goOnline)
    return () => {
      window.removeEventListener('offline', goOffline)
      window.removeEventListener('online', goOnline)
    }
  }, [])

  if (!offline && !justReconnected) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        background: offline ? '#1a0808' : '#081808',
        borderBottom: `2px solid ${offline ? '#ff6b00' : '#3dff7a'}`,
        padding: '6px 16px',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 11,
        fontFamily: "'Bungee', sans-serif",
        color: offline ? '#ff6b00' : '#3dff7a',
        letterSpacing: 1,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: '50%',
          background: offline ? '#ff6b00' : '#3dff7a',
          flexShrink: 0,
        }}
      />
      {offline
        ? 'OFFLINE MODE — Changes will sync when connected'
        : 'CONNECTED — Syncing your progress...'}
    </div>
  )
}
