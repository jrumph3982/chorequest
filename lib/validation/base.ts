import { z } from 'zod'

export const repairSchema = z.object({
  component: z.enum(['door', 'barricade', 'fence', 'light']),
  tier: z.enum(['light', 'heavy']),
})
