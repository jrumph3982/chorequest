import { z } from 'zod'

export const createBonusRequestSchema = z.object({
  description: z.string().min(1, 'Description is required').max(500).trim(),
  requestedPoints: z.number().int().min(1).max(1000).optional(),
})

export const reviewBonusRequestSchema = z.object({
  approvedPoints: z.number().int().min(1).max(1000).optional(),
  notes: z.string().max(500).trim().optional(),
})

export const finalizeWeekSchema = z.object({
  childUserId: z.string().min(1).max(64),
  // Must be a calendar date in YYYY-MM-DD format.
  // Downstream code splits on '-' and calls Number() — this regex makes that safe.
  weekStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'weekStart must be a date in YYYY-MM-DD format'),
})
