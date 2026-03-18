import { notFound } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { EditChildForm } from './edit-child-form'

export default async function EditChildPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const session = await getSession()

  const child = await prisma.user.findFirst({
    where: {
      id,
      role: 'child',
      ...(session.householdId
        ? { householdMembers: { some: { householdId: session.householdId } } }
        : {}),
    },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      level: true,
      childProfile: {
        select: { hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true },
      },
    },
  })

  if (!child) notFound()

  return <EditChildForm child={child} />
}
