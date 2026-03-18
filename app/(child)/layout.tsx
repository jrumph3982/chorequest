import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { GameWrapper } from '@/components/ui/game-wrapper'
import { TopHUD } from '@/components/child/top-hud'
import { BottomNav } from '@/components/child/bottom-nav'
import { ChildSideNav } from '@/components/child/child-side-nav'
import { xpProgressInLevel } from '@/lib/game/leveling'
import { calcCurrentThreat, getOrCreateBaseState } from '@/lib/game/base'
import { getActiveEvents, applyEventThreatBump } from '@/lib/game/events'
import { AvatarProvider } from '@/lib/context/AvatarContext'
import { AchievementUnlockOverlay } from '@/components/child/AchievementUnlockOverlay'
import { OfflineIndicator } from '@/components/child/OfflineIndicator'
import { RaidCinematicLoader } from '@/components/child/RaidCinematic'

export default async function ChildLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    redirect('/child-login')
  }

  // Fetch child stats + child profile + base state + events in parallel
  const [child, childProfile, baseState, activeEvents] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.userId },
      select: {
        xp: true,
        level: true,
        gameCurrencyBalance: true,
        childProfile: { select: { streakCount: true } },
      },
    }),
    prisma.childProfile.findUnique({
      where: { userId: session.userId },
      select: {
        gender: true, hairStyle: true, hairColor: true, skinTone: true, eyeColor: true,
        eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true,
        goggleColor: true, sigItem: true,
      },
    }),
    getOrCreateBaseState(session.userId),
    getActiveEvents(),
  ])

  // Compute HUD values
  const { level, progress } = (() => {
    const data = xpProgressInLevel(child?.xp ?? 0)
    return {
      level: data.level,
      progress: Math.round(data.progress * 100),
    }
  })()

  const baseThreat = calcCurrentThreat(
    baseState.doorDamage,
    baseState.barricadeDamage,
    baseState.fenceDamage,
    baseState.lightDamage,
  )
  const threat = applyEventThreatBump(baseThreat, activeEvents)

  return (
    <AvatarProvider initialProfile={childProfile ?? {}}>
      <OfflineIndicator />
      <AchievementUnlockOverlay />
      <RaidCinematicLoader />
      <GameWrapper>
        {/* Desktop sidebar — hidden on mobile, flex-col on lg+ */}
        <ChildSideNav />

        {/* Main content column — fills remaining space */}
        <div className="flex flex-col flex-1 min-w-0 min-h-0">
          <TopHUD
            name={session.name}
            level={level}
            xpProgress={progress}
            scrap={child?.gameCurrencyBalance ?? 0}
            threat={threat}
            streakCount={child?.childProfile?.streakCount ?? 0}
          />

          {/* Scrollable content area */}
          <div className="flex-1 overflow-y-auto overscroll-contain">
            <div className="max-w-5xl mx-auto" style={{ zoom: 1.15 }}>
              {children}
            </div>
          </div>

          {/* Mobile bottom nav — hidden on desktop */}
          <BottomNav />
        </div>
      </GameWrapper>
    </AvatarProvider>
  )
}
