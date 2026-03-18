import Link from 'next/link'
import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { PetSprite } from '@/components/child/PetSprite'
import { GiftCompanionButton } from '@/components/admin/GiftCompanionButton'

export default async function GiftCompanionPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') redirect('/login')

  const { id: childId } = await params

  const [child, companions, owned] = await Promise.all([
    prisma.user.findFirst({
      where: {
        id: childId,
        role: 'child',
        householdMembers: { some: { householdId: session.householdId } },
      },
      select: { name: true },
    }),
    prisma.companion.findMany({ orderBy: { unlockLevel: 'asc' } }),
    prisma.userCompanion.findMany({
      where: { childUserId: childId },
      select: { companionId: true },
    }),
  ])

  if (!child) redirect('/admin/children')

  const ownedIds = new Set(owned.map((uc) => uc.companionId))

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/children"
          className="text-slate-400 hover:text-slate-200 text-sm transition-colors"
        >
          ← Children
        </Link>
        <span className="text-slate-600">/</span>
        <span className="text-slate-300 text-sm font-semibold">Gift Companion</span>
      </div>

      <div>
        <h1 className="text-2xl font-bold text-slate-100">Gift Companion</h1>
        <p className="text-sm text-slate-400 mt-0.5">
          Gift a companion to <span className="text-[#f29d26] font-semibold">{child.name}</span> — no scrap cost
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {companions.map((c) => (
          <div
            key={c.id}
            className="rounded-xl p-4 flex flex-col items-center gap-3"
            style={{
              background: '#1e293b',
              border: `1px solid ${ownedIds.has(c.id) ? 'rgba(34,197,94,0.25)' : '#334155'}`,
            }}
          >
            <PetSprite type={c.type} color={c.color} size={52} />
            <div className="text-center">
              <p className="text-sm font-bold text-slate-100">{c.name}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wide mt-0.5">
                {c.type} · Lvl {c.unlockLevel}+
              </p>
              <p className="text-[10px] text-[#3b82f6] mt-1">
                +{c.bonusValue} {c.bonusType}
              </p>
            </div>
            <GiftCompanionButton
              childId={childId}
              companionId={c.id}
              alreadyOwned={ownedIds.has(c.id)}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
