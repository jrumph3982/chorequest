import { z } from 'zod'
import { AVATAR_OPTIONS } from '@/lib/constants/avatars'
import { HAIR_STYLES, HAIR_COLORS, SKIN_TONES, EYE_COLORS } from '@/lib/constants/appearance'

const PIN_REGEX = /^\d{4}$/

// avatarUrl must be one of the known emoji options — not arbitrary client input.
const avatarValidator = z
  .string()
  .refine((v) => (AVATAR_OPTIONS as readonly string[]).includes(v), {
    message: 'Invalid avatar selection',
  })

export const createChildSchema = z
  .object({
    name:       z.string().min(1, 'Name is required').max(64).trim(),
    avatarUrl:  avatarValidator.optional(),
    pin:        z.string().regex(PIN_REGEX, 'PIN must be exactly 4 digits'),
    confirmPin: z.string(),
    gender:     z.enum(['boy', 'girl']).optional(),
    hairStyle:  z.enum(HAIR_STYLES as unknown as [string, ...string[]]).optional(),
    hairColor:  z.enum(HAIR_COLORS as unknown as [string, ...string[]]).optional(),
    skinTone:   z.enum(SKIN_TONES  as unknown as [string, ...string[]]).optional(),
    eyeColor:   z.enum(EYE_COLORS  as unknown as [string, ...string[]]).optional(),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  })

export const updateChildSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(64).trim().optional(),
    avatarUrl: avatarValidator.optional(),
    gender:    z.enum(['boy', 'girl']).optional(),
    hairStyle: z.enum(HAIR_STYLES as unknown as [string, ...string[]]).optional(),
    hairColor: z.enum(HAIR_COLORS as unknown as [string, ...string[]]).optional(),
    skinTone:  z.enum(SKIN_TONES  as unknown as [string, ...string[]]).optional(),
    eyeColor:  z.enum(EYE_COLORS  as unknown as [string, ...string[]]).optional(),
  })
  .refine(
    (d) =>
      d.name !== undefined ||
      d.avatarUrl !== undefined ||
      d.gender !== undefined ||
      d.hairStyle !== undefined ||
      d.hairColor !== undefined ||
      d.skinTone !== undefined ||
      d.eyeColor !== undefined,
    { message: 'Nothing to update' },
  )

export const resetPinSchema = z
  .object({
    pin: z.string().regex(PIN_REGEX, 'PIN must be exactly 4 digits'),
    confirmPin: z.string(),
  })
  .refine((d) => d.pin === d.confirmPin, {
    message: 'PINs do not match',
    path: ['confirmPin'],
  })

export type CreateChildInput = z.infer<typeof createChildSchema>
export type UpdateChildInput = z.infer<typeof updateChildSchema>
export type ResetPinInput = z.infer<typeof resetPinSchema>
