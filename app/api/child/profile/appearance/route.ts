import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { getSession } from '@/lib/auth/session'
import { prisma } from '@/lib/db'
import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, EYE_COLORS } from '@/lib/constants/appearance'

const HEX_COLOR = z.string().regex(/^#[0-9a-f]{6}$/i).max(7)

const appearanceSchema = z
  .object({
    hairStyle:   z.enum(HAIR_STYLES  as unknown as [string, ...string[]]).optional(),
    hairColor:   z.enum(HAIR_COLORS  as unknown as [string, ...string[]]).optional(),
    skinTone:    z.enum(SKIN_TONES   as unknown as [string, ...string[]]).optional(),
    eyeColor:    z.enum(EYE_COLORS   as unknown as [string, ...string[]]).optional(),
    gender:      z.enum(['boy', 'girl']).optional(),
    // Extended fields
    eyeStyle:    z.enum(['round', 'almond', 'wide', 'squint']).optional(),
    freckles:    z.boolean().optional(),
    jacketColor: HEX_COLOR.optional(),
    pantsColor:  HEX_COLOR.optional(),
    goggleColor: HEX_COLOR.optional(),
    sigItem:     z.enum(['bat', 'wrench', 'broom']).optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: 'Nothing to update' },
  )

export async function PATCH(req: NextRequest) {
  const session = await getSession()
  if (!session.isLoggedIn || session.role !== 'child') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 })
  }

  const parsed = appearanceSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 422 })
  }

  const {
    hairStyle, hairColor, skinTone, eyeColor, gender,
    eyeStyle, freckles, jacketColor, pantsColor, goggleColor, sigItem,
  } = parsed.data

  const updated = await prisma.childProfile.update({
    where: { userId: session.userId },
    data: {
      ...(hairStyle   !== undefined && { hairStyle   }),
      ...(hairColor   !== undefined && { hairColor   }),
      ...(skinTone    !== undefined && { skinTone    }),
      ...(eyeColor    !== undefined && { eyeColor    }),
      ...(gender      !== undefined && { gender      }),
      ...(eyeStyle    !== undefined && { eyeStyle    }),
      ...(freckles    !== undefined && { freckles    }),
      ...(jacketColor !== undefined && { jacketColor }),
      ...(pantsColor  !== undefined && { pantsColor  }),
      ...(goggleColor !== undefined && { goggleColor }),
      ...(sigItem     !== undefined && { sigItem     }),
    },
    select: {
      hairStyle: true, hairColor: true, skinTone: true, eyeColor: true, gender: true,
      eyeStyle: true, freckles: true, jacketColor: true, pantsColor: true,
      goggleColor: true, sigItem: true,
    },
  })

  return NextResponse.json(updated)
}
