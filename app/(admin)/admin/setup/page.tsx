import Link from 'next/link'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export default async function SetupPage() {
  const session = await getSession()

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: session.userId } } },
    select: { householdCode: true },
  })

  return (
    <main className="min-h-[70vh] flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md text-center">
        <div className="text-6xl mb-4">🏚️</div>
        <h1 className="text-2xl font-bold text-green-400 mb-2">Your family is set up!</h1>
        <p className="text-gray-400 text-sm mb-8">
          Share your household code with family members so they can join your base.
        </p>

        {/* Household code display */}
        <div className="bg-gray-900 border border-gray-700 rounded-2xl px-8 py-6 mb-8">
          <p className="text-xs text-gray-500 uppercase tracking-widest mb-3">Household Code</p>
          <p className="text-4xl font-bold font-mono text-white tracking-[0.2em]">
            {household?.householdCode ?? '——'}
          </p>
          <p className="text-xs text-gray-600 mt-3">
            Keep this safe — it&apos;s how your family joins.
          </p>
        </div>

        <Link
          href="/admin"
          className="inline-block bg-green-600 hover:bg-green-500 text-white font-semibold rounded-lg px-8 py-3 text-sm transition-colors"
        >
          Go to Dashboard →
        </Link>
      </div>
    </main>
  )
}
