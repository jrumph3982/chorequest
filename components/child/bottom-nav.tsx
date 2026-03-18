'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

interface Tab {
  href: string
  label: string
  icon: string
}

const TABS: (Tab | 'center')[] = [
  { href: '/dashboard', label: 'Home', icon: '🏠' },
  { href: '/play/base', label: 'Base', icon: '🛡️' },
  'center', // Shop FAB
  { href: '/play/loadout', label: 'Loadout', icon: '🎒' },
  { href: '/play/appearance', label: 'Profile', icon: '👤' },
  { href: '/play/zombie', label: 'Defend', icon: '☣' },
]

export function BottomNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/play/base') return pathname === '/play/base'
    return pathname.startsWith(href)
  }

  const isShop = pathname.startsWith('/play/shop')

  return (
    <nav
      className="lg:hidden flex-shrink-0 flex items-center"
      style={{
        background: '#030703',
        borderTop: '2px solid #1a3018',
        height: 64,
      }}
    >
      {TABS.map((tab, i) => {
        if (tab === 'center') {
          return (
            <div key="shop" className="flex-1 flex justify-center" style={{ marginTop: -16 }}>
              <Link
                href="/play/shop"
                className="flex items-center justify-center rounded-full transition-transform active:scale-95"
                style={{
                  width: 52, height: 52,
                  background: '#f5c842',
                  color: '#0a140c',
                  border: '3px solid #030703',
                  boxShadow: isShop
                    ? '0 4px 20px rgba(245,200,66,0.5)'
                    : '0 4px 12px rgba(245,200,66,0.3)',
                  fontSize: 22,
                }}
              >
                📦
              </Link>
            </div>
          )
        }

        const active = isActive(tab.href)
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 transition-colors"
            style={{
              minHeight: 48,
              color: active ? '#3dff7a' : '#2a4a28',
              borderBottom: active ? '3px solid #3dff7a' : '3px solid transparent',
              background: active ? 'rgba(61,255,122,0.08)' : 'transparent',
              paddingTop: 6, paddingBottom: 6,
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 1 }}>{tab.icon}</span>
            <span style={{ fontFamily: "'Bungee', sans-serif", fontSize: 9, letterSpacing: 1, textTransform: 'uppercase' }}>{tab.label}</span>
          </Link>
        )
      })}
    </nav>
  )
}
