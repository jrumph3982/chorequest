import Link from 'next/link'
import { prisma } from '@/lib/db'
import { ChoreForm } from '@/components/admin/chore-form'
import { getSession } from '@/lib/auth/session'

export default async function NewChorePage() {
  const session = await getSession()

  const children = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { household: { members: { some: { userId: session.userId } } } } },
    },
    select: { id: true, name: true },
    orderBy: { name: 'asc' },
  })

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
          <h1 className="text-xl font-bold text-slate-100">Create New Mission</h1>
          <p className="text-xs text-slate-400 mt-0.5">Define a new chore assignment</p>
        </div>
      </div>

      <ChoreForm children={children} />
    </div>
  )
}
