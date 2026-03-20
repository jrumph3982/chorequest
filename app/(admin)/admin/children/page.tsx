import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { DetailedCharacter } from '@/components/child/DetailedCharacter'
import { RemoveChildButton } from '@/components/admin/remove-child-button'
import { getTheme } from '@/lib/constants/themes'

export default async function ChildrenPage() {
  const session = await getSession()

  const where = session.householdId
    ? { role: 'child' as const, householdMembers: { some: { householdId: session.householdId } } }
    : { role: 'child' as const }

  const children = await prisma.user.findMany({
    where,
    select: {
      id: true,
      name: true,
      level: true,
      xp: true,
      gameCurrencyBalance: true,
      childProfile: {
        select: {
          gender: true, hairStyle: true, hairColor: true, skinTone: true, eyeColor: true,
          eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true,
          goggleColor: true, sigItem: true, visualTheme: true,
        } as any,
      },
    },
    orderBy: { name: 'asc' },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-100">Children</h1>
          <p className="text-sm text-slate-400 mt-0.5">Manage survivor accounts</p>
        </div>
        <Link
          href="/admin/children/new"
          className="flex items-center gap-1.5 bg-[#22c55e] hover:bg-[#22c55e]/90 text-slate-900 text-sm font-bold px-4 py-2 rounded-lg transition-colors shadow-lg shadow-[#22c55e]/20"
        >
          + Add Survivor
        </Link>
      </div>

      {children.length === 0 ? (
        <div className="bg-[#1e293b] border border-[#334155] rounded-xl p-12 text-center">
          <div className="text-5xl mb-4">👶</div>
          <p className="text-slate-300 font-semibold">No survivors yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-5">Add your first child to get started.</p>
          <Link
            href="/admin/children/new"
            className="inline-flex items-center gap-1.5 bg-[#22c55e] text-slate-900 text-sm font-bold px-4 py-2 rounded-lg"
          >
            + Add Survivor
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {children.map((child) => (
            <div
              key={child.id}
              className="bg-[#1e293b] border border-[#334155] rounded-xl p-4 flex items-center gap-4 hover:border-[#22c55e]/20 transition-colors"
            >
              <div className="shrink-0 flex items-end" style={{ width: 44, height: 52 }}>
                <DetailedCharacter
                  gender={(child.childProfile as any)?.gender}
                  skinTone={(child.childProfile as any)?.skinTone}
                  hairStyle={(child.childProfile as any)?.hairStyle}
                  hairColor={(child.childProfile as any)?.hairColor}
                  eyeColor={(child.childProfile as any)?.eyeColor}
                  eyeStyle={(child.childProfile as any)?.eyeStyle}
                  freckles={(child.childProfile as any)?.freckles ?? false}
                  jacketColor={(child.childProfile as any)?.jacketColor}
                  pantsColor={(child.childProfile as any)?.pantsColor}
                  goggleColor={(child.childProfile as any)?.goggleColor}
                  sigItem={(child.childProfile as any)?.sigItem}
                  width={44}
                />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-slate-100 text-sm">{child.name}</p>
                  {(() => {
                    const t = getTheme((child.childProfile as any)?.visualTheme)
                    return (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300">
                        {t.icon} {t.name}
                      </span>
                    )
                  })()}
                </div>
                <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                  <span className="text-xs text-slate-400">
                    Level <span className="font-bold text-slate-200">{child.level}</span>
                  </span>
                  <span className="text-xs text-slate-500">{child.xp.toLocaleString()} XP</span>
                  <span className="text-xs text-[#f29d26]/80">
                    🔩 {child.gameCurrencyBalance.toLocaleString()} Scrap
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <Link
                  href={`/admin/children/${child.id}/gift-companion`}
                  className="text-xs font-semibold text-[#f97316] hover:text-[#f97316]/80 border border-[#f97316]/20 hover:border-[#f97316]/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Gift
                </Link>
                <Link
                  href={`/admin/children/${child.id}/edit`}
                  className="text-xs font-semibold text-[#3b82f6] hover:text-[#3b82f6]/80 border border-[#3b82f6]/20 hover:border-[#3b82f6]/40 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Edit
                </Link>
                <RemoveChildButton childId={child.id} childName={child.name} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
