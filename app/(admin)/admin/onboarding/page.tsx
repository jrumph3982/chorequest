import { redirect } from 'next/navigation'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { OnboardingWizard } from '@/components/admin/OnboardingWizard'

export default async function OnboardingPage() {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'adult') {
    redirect('/login')
  }

  const household = await prisma.household.findFirst({
    where: { members: { some: { userId: session.userId } } },
    select: {
      id: true,
      displayName: true,
      householdCode: true,
      onboardingComplete: true,
      onboardingStep: true,
    },
  })

  // Already onboarded — redirect to dashboard
  if (household?.onboardingComplete) {
    redirect('/admin/dashboard')
  }

  if (!household) {
    redirect('/login')
  }

  // Fetch existing children to show in step 3
  const existingChildren = await prisma.user.findMany({
    where: {
      role: 'child',
      householdMembers: { some: { householdId: household.id } },
    },
    select: { id: true, name: true },
  })

  return (
    <OnboardingWizard
      householdCode={household.householdCode}
      householdName={household.displayName}
      existingChildren={existingChildren}
      initialStep={household.onboardingStep}
    />
  )
}
