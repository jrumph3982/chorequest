import { z } from 'zod'

export const loginSchema = z.object({
  username: z
    .string()
    .min(1, 'Username is required')
    .max(64)
    .trim()
    .toLowerCase(),
  password: z.string().min(1, 'Password is required').max(256),
})

export type LoginInput = z.infer<typeof loginSchema>

export const registerSchema = z
  .object({
    name: z.string().min(1, 'Name is required').max(64).trim(),
    username: z
      .string()
      .min(3, 'Username must be at least 3 characters')
      .max(32)
      .trim()
      .toLowerCase()
      .regex(/^[a-z0-9_]+$/, 'Letters, numbers, and underscores only'),
    password: z.string().min(8, 'Password must be at least 8 characters').max(256),
    confirmPassword: z.string(),
    email: z.string().email('Invalid email address').max(254).trim().toLowerCase().optional(),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  })

export type RegisterInput = z.infer<typeof registerSchema>

export const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email address').max(254).trim().toLowerCase(),
})

export const resetPasswordSchema = z.object({
  token: z.string().min(1).max(128),
  password: z.string().min(8, 'Password must be at least 8 characters').max(256),
  confirmPassword: z.string(),
}).refine((d) => d.password === d.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
})

// Validates and normalises a 6-character alphanumeric household code.
// Accepts mixed case; output is always uppercase.
export const householdCodeLookupSchema = z.object({
  householdCode: z
    .string()
    .min(1, 'Household code is required')
    .max(8) // generous upper bound to catch clearly wrong input before the regex
    .regex(/^[A-Za-z0-9]{6}$/, 'Household code must be exactly 6 alphanumeric characters')
    .transform((s) => s.toUpperCase()),
})

export type HouseholdCodeLookupInput = z.infer<typeof householdCodeLookupSchema>

// Used by the child PIN login endpoint.
// All three fields are validated; errors return a generic message to avoid
// leaking which field was wrong.
export const childLoginSchema = z.object({
  householdCode: z
    .string()
    .min(1)
    .max(8)
    .regex(/^[A-Za-z0-9]{6}$/, 'Invalid household code')
    .transform((s) => s.toUpperCase()),
  // childUserId is a CUID — lowercase alphanumeric, bounded length
  childUserId: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z0-9]+$/, 'Invalid user ID'),
  // PIN is exactly 4 digits; trimming prevents invisible-space bypass
  pin: z
    .string()
    .trim()
    .regex(/^\d{4}$/, 'PIN must be exactly 4 digits'),
})

export type ChildLoginInput = z.infer<typeof childLoginSchema>
