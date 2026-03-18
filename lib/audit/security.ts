import { Prisma } from '@prisma/client'
import { prisma } from '@/lib/db'

// ─── Event type constants ─────────────────────────────────────────────────────

export const SECURITY_EVENT = {
  PARENT_SIGNUP:            'parent_signup',
  HOUSEHOLD_CREATED:        'household_created',
  PARENT_LOGIN_SUCCESS:     'parent_login_success',
  PARENT_LOGIN_FAILURE:     'parent_login_failure',
  CHILD_LOGIN_SUCCESS:      'child_login_success',
  CHILD_LOGIN_FAILURE:      'child_login_failure',
  CHILD_ACCOUNT_CREATED:    'child_account_created',
  CHILD_PIN_RESET:          'child_pin_reset',
  HOUSEHOLD_LOOKUP_FAILURE: 'household_lookup_failure',
  SETTINGS_CHANGED:         'settings_changed',
} as const

export type SecurityEventType = (typeof SECURITY_EVENT)[keyof typeof SECURITY_EVENT]

// ─── Logger ───────────────────────────────────────────────────────────────────

interface LogParams {
  eventType: SecurityEventType
  householdId?: string
  actorUserId?: string
  targetUserId?: string
  /** Safe metadata only — never passwords, PIN values, or hashes. */
  metadata?: Record<string, unknown>
  ipAddress?: string
  userAgent?: string
}

/**
 * Write a security-relevant event to the SecurityAuditLog table.
 * Errors are caught and logged to stderr so they never crash the caller.
 */
export async function logSecurityEvent(params: LogParams): Promise<void> {
  try {
    await prisma.securityAuditLog.create({
      data: {
        eventType:    params.eventType,
        householdId:  params.householdId  ?? null,
        actorUserId:  params.actorUserId  ?? null,
        targetUserId: params.targetUserId ?? null,
        metadataJson: params.metadata
          ? (params.metadata as Prisma.InputJsonValue)
          : Prisma.JsonNull,
        ipAddress:    params.ipAddress    ?? null,
        userAgent:    params.userAgent    ?? null,
      },
    })
  } catch (err) {
    // Never let audit logging crash the main auth/account flow
    console.error('[security-audit] Failed to write log:', err)
  }
}
