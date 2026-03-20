import { NextRequest, NextResponse } from 'next/server'
import { requireAdult } from '@/lib/auth/guards'
import { prisma } from '@/lib/db'
import { hashPassword } from '@/lib/auth/password'
import { createChildSchema } from '@/lib/validation/children'
import { StoryProgressStatus } from '@prisma/client'
import { logSecurityEvent, SECURITY_EVENT } from '@/lib/audit/security'
import { getOrCreateSettings } from '@/lib/game/settings'

// Universal starter gear slugs — always granted to every new child.
const UNIVERSAL_STARTER_SLUGS = [
  'starter-cap',
  'starter-jacket',
  'cargo-pants',
  'starter-sneakers',
  'basic-backpack',
  'starter-belt',
]

export async function GET() {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { householdId } = guard

  const children = await prisma.user.findMany({
    where: { role: 'child', householdMembers: { some: { householdId } } },
    select: {
      id: true,
      name: true,
      avatarUrl: true,
      level: true,
      xp: true,
      gameCurrencyBalance: true,
    },
    orderBy: { name: 'asc' },
  })

  return NextResponse.json(children)
}

export async function POST(request: NextRequest) {
  const guard = await requireAdult()
  if (!guard.ok) return guard.response
  const { session, householdId } = guard

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const result = createChildSchema.safeParse(body)
  if (!result.success) {
    const errors = Object.fromEntries(result.error.issues.map((i) => [i.path[0], i.message]))
    return NextResponse.json({ errors }, { status: 400 })
  }

  const { name, avatarUrl, pin, gender, hairStyle, hairColor, skinTone, eyeColor, eyeStyle, freckles, jacketColor, pantsColor, goggleColor, sigItem, visualTheme } = result.data

  const [pinHash, theme, chapters, starterItems, settings] = await Promise.all([
    hashPassword(pin),
    prisma.theme.findFirst(),
    prisma.storyChapter.findMany({ orderBy: { chapterNumber: 'asc' } }),
    prisma.inventoryItem.findMany({
      where: { slug: { in: UNIVERSAL_STARTER_SLUGS } },
      select: { id: true },
    }),
    getOrCreateSettings(householdId),
  ])

  const startingBalance = settings.startingAllowanceBalanceCents ?? 0

  const user = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        name,
        avatarUrl: avatarUrl ?? '🧒',
        pinHash,
        role: 'child',
        allowanceBalanceCents: startingBalance,
      },
    })

    await tx.childProfile.create({
      data: {
        userId:      user.id,
        householdId,
        themeId:     theme?.id,
        weeklyPointGoal: 50,
        streakCount: 0,
        currentStoryChapter: 1,
        gender:      gender      ?? null,
        hairStyle:   hairStyle   ?? null,
        hairColor:   hairColor   ?? null,
        skinTone:    skinTone    ?? null,
        eyeColor:    eyeColor    ?? null,
        eyeStyle:    eyeStyle    ?? null,
        freckles:    freckles    ?? false,
        jacketColor: jacketColor ?? null,
        pantsColor:  pantsColor  ?? null,
        goggleColor: goggleColor ?? null,
        sigItem:     sigItem     ?? null,
        visualTheme: visualTheme ?? 'zombie',
      } as any,
    })

    await tx.householdMember.create({
      data: { householdId, userId: user.id, role: 'child' },
    })

    if (chapters.length > 0) {
      await tx.userStoryProgress.create({
        data: {
          childUserId:    user.id,
          storyChapterId: chapters[0].id,
          householdId,
          status:         StoryProgressStatus.unlocked,
        },
      })
      if (chapters.length > 1) {
        await tx.userStoryProgress.createMany({
          data: chapters.slice(1).map((ch) => ({
            childUserId:    user.id,
            storyChapterId: ch.id,
            householdId,
            status:         StoryProgressStatus.locked,
          })),
        })
      }
    }

    if (starterItems.length > 0) {
      await tx.userInventory.createMany({
        data: starterItems.map((item) => ({
          childUserId:     user.id,
          inventoryItemId: item.id,
          householdId,
          equipped:        true,
          acquiredAt:      new Date(),
        })),
        skipDuplicates: true,
      })
    }

    return user
  })

  await logSecurityEvent({
    eventType:    SECURITY_EVENT.CHILD_ACCOUNT_CREATED,
    householdId,
    actorUserId:  session.userId,
    targetUserId: user.id,
    metadata:     { childName: user.name },
  })

  return NextResponse.json({ id: user.id, name: user.name }, { status: 201 })
}
