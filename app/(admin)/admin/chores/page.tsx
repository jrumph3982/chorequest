import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { ChoreManagementList } from '@/components/admin/chore-management-list'

export default async function ChoresPage() {
  const session = await getSession()

  // Scope to this household only (OR null for legacy chores created before multi-tenant)
  const householdFilter = session.householdId
    ? { OR: [{ householdId: session.householdId }, { householdId: null }] }
    : {}

  const [chores, children] = await Promise.all([
    prisma.chore.findMany({
      where: householdFilter,
      orderBy: [{ active: 'desc' }, { createdAt: 'desc' }],
      include: {
        assignments: {
          where: { active: true },
          include: { child: { select: { name: true } } },
        },
      },
    }),
    prisma.user.findMany({
      where: {
        role: 'child',
        householdMembers: { some: { household: { members: { some: { userId: session.userId } } } } },
      },
      select: { id: true, name: true },
    }),
  ])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Chores</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage and assign missions</p>
        </div>
        <Link
          href="/admin/chores/new"
          className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-[#22c55e]/20"
        >
          + New Mission
        </Link>
      </div>

      <ChoreManagementList chores={chores} children={children} />
    </div>
  )
}
