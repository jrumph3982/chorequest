'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

const NAV_ITEMS = [
  { href: '/dashboard',        label: 'Home',    icon: '🏠' },
  { href: '/play/base',        label: 'Base',    icon: '🛡️' },
  { href: '/play/shop',        label: 'Shop',    icon: '📦' },
  { href: '/play/loadout',     label: 'Loadout', icon: '🎒' },
  { href: '/play/appearance',  label: 'Profile', icon: '👤' },
  { href: '/play/zombie',      label: 'Defend',  icon: '☣️' },
]

export function ChildSideNav() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/dashboard') return pathname === '/dashboard'
    if (href === '/play/base') return pathname === '/play/base'
    return pathname.startsWith(href)
  }

  return (
    <aside
      className="hidden lg:flex flex-col flex-shrink-0"
      style={{
        width: 200,
        background: '#040804',
        borderRight: '2px solid #1a3018',
      }}
    >
      {/* Brand */}
      <div style={{ padding: '20px 16px 16px', borderBottom: '1px solid #1a3018' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 28 }}>🧟</span>
          <div>
            <p style={{
              fontFamily: "'Bungee', sans-serif",
              color: '#3dff7a',
              fontSize: 13,
              margin: 0,
              lineHeight: 1.1,
            }}>
              CHORE QUEST
            </p>
            <p style={{
              color: '#2a4a28',
              fontSize: 8,
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: 2,
              margin: '3px 0 0',
            }}>
              Survivor Portal
            </p>
          </div>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: '12px 8px', display: 'flex', flexDirection: 'column', gap: 2 }}>
        {NAV_ITEMS.map((item) => {
          const active = isActive(item.href)
          const isShop = item.href === '/play/shop'
          const accent = isShop ? '#f5c842' : '#3dff7a'
          return (
            <Link
              key={item.href}
              href={item.href}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '11px 12px',
                borderRadius: 8,
                borderLeft: `3px solid ${active ? accent : 'transparent'}`,
                background: active
                  ? isShop
                    ? 'rgba(245,200,66,0.08)'
                    : 'rgba(61,255,122,0.08)'
                  : 'transparent',
                color: active ? accent : '#2a4a28',
                textDecoration: 'none',
                transition: 'background 0.15s, color 0.15s',
              }}
            >
              <span style={{ fontSize: 18, width: 24, textAlign: 'center', flexShrink: 0 }}>
                {item.icon}
              </span>
              <span style={{
                fontFamily: "'Bungee', sans-serif",
                fontSize: 11,
                letterSpacing: 1,
                textTransform: 'uppercase',
              }}>
                {item.label}
              </span>
            </Link>
          )
        })}
      </nav>

      {/* Footer */}
      <div style={{ padding: '12px 16px', borderTop: '1px solid #1a3018' }}>
        <p style={{ color: '#1a3018', fontSize: 9, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 1, margin: 0 }}>
          Chore Quest v1
        </p>
      </div>
    </aside>
  )
}
