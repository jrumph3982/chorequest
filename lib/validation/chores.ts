import { z } from 'zod'

export const CHORE_CATEGORIES = [
  'bedroom',
  'kitchen',
  'hygiene',
  'pet',
  'school',
  'outside',
  'household',
  'other',
] as const

export type ChoreCategory = (typeof CHORE_CATEGORIES)[number]

export const createChoreSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100).trim(),
  description: z.string().max(500).trim().optional(),
  category: z.enum(CHORE_CATEGORIES),
  scheduleType: z.enum(['daily', 'weekly', 'specific_days', 'monthly', 'once']).default('daily'),
  scheduleDays: z.array(z.number().int().min(1).max(7)).default([]),
  timeWindow: z.enum(['any', 'morning', 'afternoon', 'evening']).default('any'),
  rolloverEnabled: z.boolean().default(true),
  rolloverGraceDays: z.number().int().min(0).max(7).default(0),
  difficultyScore: z.number().int().min(1).max(10),
  basePoints: z.number().int().min(1).max(1000),
  requiresApproval: z.boolean().default(true),
  // optional — create assignment(s) immediately on chore creation
  childUserIds: z.array(z.string()).optional(),
})

export const updateChoreSchema = z.object({
  title: z.string().min(1).max(100).trim().optional(),
  description: z.string().max(500).trim().optional(),
  category: z.enum(CHORE_CATEGORIES).optional(),
  scheduleType: z.enum(['daily', 'weekly', 'specific_days', 'monthly', 'once']).optional(),
  scheduleDays: z.array(z.number().int().min(1).max(7)).optional(),
  timeWindow: z.enum(['any', 'morning', 'afternoon', 'evening']).optional(),
  rolloverEnabled: z.boolean().optional(),
  rolloverGraceDays: z.number().int().min(0).max(7).optional(),
  difficultyScore: z.number().int().min(1).max(10).optional(),
  basePoints: z.number().int().min(1).max(1000).optional(),
  requiresApproval: z.boolean().optional(),
  active: z.boolean().optional(),
  // When present, replaces the chore's active assignments with this exact set.
  childUserIds: z.array(z.string()).optional(),
})

export const assignChoreSchema = z.object({
  choreId: z.string().min(1),
  childUserId: z.string().min(1),
})

export const submitInstanceSchema = z.object({
  notes:         z.string().max(500).trim().optional(),
  proofImageUrl: z.string().url().max(2048).optional(),
})

export const reviewInstanceSchema = z.object({
  notes: z.string().max(500).trim().optional(),
  pointsOverride: z.number().int().min(1).max(1000).optional(),
})
