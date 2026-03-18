import { NextResponse } from 'next/server'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'

export async function GET(request: Request) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { searchParams } = new URL(request.url)
  const category = searchParams.get('category')
  const ageGroup = searchParams.get('ageGroup') // e.g. "4-6", "7-9", "10-12"
  const freq = searchParams.get('freq')
  const search = searchParams.get('search')

  // Build where clause
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const where: Record<string, any> = {
    OR: [{ isGlobal: true }, { householdId: session.householdId }],
  }

  if (category && category !== 'all') where.category = category
  if (freq && freq !== 'any') where.scheduleType = freq

  if (ageGroup && ageGroup !== 'all') {
    const [minStr, maxStr] = ageGroup.split('-')
    const min = parseInt(minStr, 10)
    const max = maxStr ? parseInt(maxStr, 10) : 99
    where.ageMin = { lte: max }
    where.ageMax_OR = [{ ageMax: null }, { ageMax: { gte: min } }]
  }

  if (search) {
    where.name = { contains: search, mode: 'insensitive' }
  }

  // Remove internal pseudo-field
  const { ageMax_OR, ...prismaWhere } = where
  // Handle ageMax as separate OR if present
  if (ageMax_OR) {
    // Combine with existing OR
    prismaWhere.AND = [
      { OR: prismaWhere.OR },
      { OR: ageMax_OR },
    ]
    delete prismaWhere.OR
  }

  const templates = await prisma.choreTemplate.findMany({
    where: prismaWhere,
    orderBy: [{ isGlobal: 'desc' }, { category: 'asc' }, { name: 'asc' }],
  })

  return NextResponse.json(templates)
}
