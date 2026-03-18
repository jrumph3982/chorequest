import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { AdminShell } from '@/components/admin/admin-shell'

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') {
    redirect('/login')
  }

  // Onboarding check is done per-page, not here in the layout,
  // to avoid redirect loops. The onboarding page handles its own redirect logic.

  const [household, pendingApprovals, pendingBonus] = await Promise.all([
    prisma.household.findFirst({
      where: { members: { some: { userId: session.userId } } },
      select: { displayName: true },
    }),
    prisma.choreInstance.count({
      where: {
        status: 'submitted_complete',
        child: {
          householdMembers: {
            some: { household: { members: { some: { userId: session.userId } } } },
          },
        },
      },
    }),
    prisma.bonusRequest.count({
      where: {
        status: 'pending',
        child: {
          householdMembers: {
            some: { household: { members: { some: { userId: session.userId } } } },
          },
        },
      },
    }),
  ])

  return (
    <AdminShell
      parentName={session.name}
      householdName={household?.displayName ?? 'Your Household'}
      pendingApprovals={pendingApprovals}
      pendingBonus={pendingBonus}
    >
      {children}
    </AdminShell>
  )
}
