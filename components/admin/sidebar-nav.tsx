'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem =
  | { type: 'link'; href: string; label: string; icon: string; badge?: number }
  | { type: 'divider' }

interface Props {
  pendingApprovals: number
  pendingBonus: number
}

export function SidebarNav({ pendingApprovals, pendingBonus }: Props) {
  const pathname = usePathname()

  const items: NavItem[] = [
    { type: 'link', href: '/admin', label: 'Dashboard', icon: '🏠' },
    { type: 'link', href: '/admin/children', label: 'Children', icon: '👶' },
    { type: 'link', href: '/admin/chores', label: 'Chores', icon: '📋' },
    { type: 'divider' },
    {
      type: 'link',
      href: '/admin/approvals',
      label: 'Approvals',
      icon: '✅',
      badge: pendingApprovals,
    },
    {
      type: 'link',
      href: '/admin/bonus-requests',
      label: 'Bonus Requests',
      icon: '⭐',
      badge: pendingBonus,
    },
    { type: 'link', href: '/admin/weekly-review', label: 'Weekly Review', icon: '📅' },
    { type: 'link', href: '/admin/allowance', label: 'Allowance', icon: '💰' },
    { type: 'link', href: '/admin/leaderboard', label: 'Leaderboard', icon: '🏆' },
    { type: 'divider' },
    { type: 'link', href: '/admin/events', label: 'Events', icon: '🌍' },
    { type: 'link', href: '/admin/security', label: 'Security', icon: '🔒' },
    { type: 'link', href: '/admin/settings', label: 'Settings', icon: '⚙️' },
  ]

  function isActive(href: string) {
    if (href === '/admin') return pathname === '/admin'
    return pathname.startsWith(href)
  }

  return (
    <div className="flex flex-col gap-0.5">
      {items.map((item, i) => {
        if (item.type === 'divider') {
          return <div key={i} className="my-1.5 h-px bg-[#1e2d45]" />
        }
        const active = isActive(item.href)
        return (
          <Link
            key={item.href}
            href={item.href}
            className={[
              'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all',
              active
                ? 'bg-[#22c55e]/10 text-[#22c55e]'
                : 'text-slate-400 hover:text-slate-100 hover:bg-white/5',
            ].join(' ')}
          >
            <span className="text-base leading-none shrink-0">{item.icon}</span>
            <span className="flex-1 truncate">{item.label}</span>
            {item.badge && item.badge > 0 ? (
              <span className="bg-[#f29d26] text-slate-900 text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center leading-tight">
                {item.badge}
              </span>
            ) : null}
          </Link>
        )
      })}
    </div>
  )
}
