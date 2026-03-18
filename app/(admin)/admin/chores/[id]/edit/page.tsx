import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/lib/db'
import { getSession } from '@/lib/auth/session'
import { ChoreForm } from '@/components/admin/chore-form'

export default async function EditChorePage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const session = await getSession()

  const [chore, children, assignments] = await Promise.all([
    prisma.chore.findUnique({ where: { id } }),
    prisma.user.findMany({
      where: {
        role: 'child',
        householdMembers: { some: { household: { members: { some: { userId: session.userId } } } } },
      },
      select: { id: true, name: true },
      orderBy: { name: 'asc' },
    }),
    prisma.choreAssignment.findMany({
      where: { choreId: id, active: true },
      select: { childUserId: true },
    }),
  ])

  if (!chore) notFound()

  const assignedChildIds = assignments.map((a) => a.childUserId)

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/admin/chores"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-[#1e293b] border border-[#334155] text-slate-400 hover:text-slate-100 hover:border-slate-500 transition-colors text-sm"
        >
          ←
        </Link>
        <div>
          <h1 className="text-xl font-bold text-slate-100">Edit Mission</h1>
          <p className="text-xs text-slate-400 mt-0.5">{chore.title}</p>
        </div>
      </div>

      <ChoreForm
        initialData={chore}
        children={children}
        initialAssignedChildIds={assignedChildIds}
      />
    </div>
  )
}
