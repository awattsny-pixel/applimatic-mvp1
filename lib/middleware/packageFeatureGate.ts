/**
 * Package Feature Gate Middleware
 *
 * This middleware enforces package tier access control and rate limiting.
 * Use this in any endpoint that requires feature gating.
 *
 * Example usage in an API route:
 *
 * ```typescript
 * import { gateFeatureAccess } from '@/lib/middleware/packageFeatureGate'
 *
 * export async function POST(request: NextRequest) {
 *   const featureGate = await gateFeatureAccess({
 *     request,
 *     featureKey: 'linkedin_messages',
 *     logRequestId: request.headers.get('x-request-id'),
 *   })
 *
 *   if (!featureGate.allowed) {
 *     return NextResponse.json(
 *       { error: featureGate.error, details: featureGate.details },
 *       { status: featureGate.statusCode }
 *     )
 *   }
 *
 *   // Feature is allowed, continue with business logic
 *   // featureGate.userId and featureGate.packageTier are available
 * }
 * ```
 */

import { NextRequest } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// ─── Types ──────────────────────────────────────────────────
export type FeatureKey =
  | 'tailor'
  | 'differential'
  | 'keyword_analysis'
  | 'linkedin_messages'
  | 'interview_prep'
  | 'docx_export'

export type PackageTier = 'free' | 'starter' | 'pro'

export interface FeatureGateResult {
  allowed: boolean
  userId?: string
  packageTier?: PackageTier
  featureKey: FeatureKey
  usageStats?: {
    used: number
    limit: number | null
    remaining: number | null
  }
  error?: string
  details?: string
  statusCode: number
}

interface GateFeatureAccessOptions {
  request: NextRequest
  featureKey: FeatureKey
  logRequestId?: string | null
}

// ─── Main gate function ─────────────────────────────────────
/**
 * Check if a user has access to a feature based on their package tier.
 * Also enforces rate limiting.
 *
 * @param options Configuration for feature gating
 * @returns FeatureGateResult with access status and usage info
 */
export async function gateFeatureAccess(
  options: GateFeatureAccessOptions
): Promise<FeatureGateResult> {
  const { request, featureKey, logRequestId } = options

  try {
    // ── 1. Authenticate user ────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.warn(`[${featureKey}] Unauthenticated access attempt`)
      return {
        allowed: false,
        featureKey,
        error: 'Not authenticated',
        details: 'Please log in to access this feature.',
        statusCode: 401,
      }
    }

    console.log(`[${featureKey}] User ${user.id} attempting access`)

    // ── 2. Get user's package tier ──────────────────────────
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('package_tier')
      .eq('id', user.id)
      .single()

    if (profileError || !profile) {
      console.error(`[${featureKey}] Profile fetch error for user ${user.id}:`, profileError)
      return {
        allowed: false,
        userId: user.id,
        featureKey,
        error: 'Profile not found',
        details: 'Unable to determine your package tier.',
        statusCode: 500,
      }
    }

    const packageTier = (profile.package_tier || 'free') as PackageTier
    console.log(`[${featureKey}] User tier: ${packageTier}`)

    // ── 3. Check feature access based on tier ───────────────
    const hasAccess = await checkFeatureAccess(
      supabase,
      user.id,
      featureKey,
      packageTier,
      logRequestId
    )

    if (!hasAccess.allowed) {
      console.warn(`[${featureKey}] Access denied for user ${user.id} (${packageTier})`, {
        reason: hasAccess.reason,
        logRequestId,
      })
      return {
        allowed: false,
        userId: user.id,
        packageTier,
        featureKey,
        error: hasAccess.reason,
        details: hasAccess.details,
        statusCode: hasAccess.statusCode || 403,
      }
    }

    // ── 4. Check rate limiting ──────────────────────────────
    const rateLimitCheck = await checkRateLimit(
      supabase,
      user.id,
      featureKey,
      packageTier
    )

    if (!rateLimitCheck.allowed) {
      console.warn(`[${featureKey}] Rate limit exceeded for user ${user.id}`, {
        used: rateLimitCheck.used,
        limit: rateLimitCheck.limit,
      })
      return {
        allowed: false,
        userId: user.id,
        packageTier,
        featureKey,
        usageStats: {
          used: rateLimitCheck.used,
          limit: rateLimitCheck.limit,
          remaining: 0,
        },
        error: 'Rate limit exceeded',
        details: `You've used all ${rateLimitCheck.limit} requests this month. Please upgrade your plan.`,
        statusCode: 429,
      }
    }

    console.log(`[${featureKey}] Access granted for user ${user.id}`, {
      used: rateLimitCheck.used,
      limit: rateLimitCheck.limit,
      remaining: rateLimitCheck.remaining,
    })

    // ── 5. Log audit trail ──────────────────────────────────
    await logAudit(supabase, user.id, 'feature_accessed', featureKey, {
      packageTier,
      requestId: logRequestId,
      ipAddress: request.headers.get('x-forwarded-for') || 'unknown',
    })

    return {
      allowed: true,
      userId: user.id,
      packageTier,
      featureKey,
      usageStats: {
        used: rateLimitCheck.used,
        limit: rateLimitCheck.limit,
        remaining: rateLimitCheck.remaining,
      },
      statusCode: 200,
    }
  } catch (error: any) {
    console.error(`[${featureKey}] Unexpected error in gateFeatureAccess:`, error)
    return {
      allowed: false,
      featureKey,
      error: 'Internal server error',
      details: error.message,
      statusCode: 500,
    }
  }
}

// ─── Helper: Check feature access ────────────────────────────
async function checkFeatureAccess(
  supabase: any,
  userId: string,
  featureKey: FeatureKey,
  packageTier: PackageTier,
  logRequestId?: string | null
) {
  try {
    // Get feature config from database
    const { data: feature, error } = await supabase
      .from('package_features')
      .select('free_tier, starter_tier, pro_tier, is_active')
      .eq('feature_key', featureKey)
      .single()

    if (error || !feature) {
      console.error(`[${featureKey}] Feature config not found`)
      return {
        allowed: false,
        reason: 'Feature not found',
        details: 'This feature is not available.',
        statusCode: 404,
      }
    }

    if (!feature.is_active) {
      console.warn(`[${featureKey}] Feature is inactive`)
      return {
        allowed: false,
        reason: 'Feature inactive',
        details: 'This feature is currently unavailable.',
        statusCode: 503,
      }
    }

    // Check tier access
    const tierHasAccess =
      (packageTier === 'free' && feature.free_tier) ||
      (packageTier === 'starter' && feature.starter_tier) ||
      (packageTier === 'pro' && feature.pro_tier)

    if (!tierHasAccess) {
      const upgradeMessage = packageTier === 'free'
        ? 'Upgrade to Starter to access this feature.'
        : packageTier === 'starter'
        ? 'Upgrade to Pro to access this feature.'
        : 'Contact support for access.'

      return {
        allowed: false,
        reason: 'Plan does not include this feature',
        details: upgradeMessage,
        statusCode: 403,
      }
    }

    return { allowed: true }
  } catch (error: any) {
    console.error(`[${featureKey}] Error checking feature access:`, error)
    return {
      allowed: false,
      reason: 'Access check failed',
      details: error.message,
      statusCode: 500,
    }
  }
}

// ─── Helper: Check rate limiting ────────────────────────────
async function checkRateLimit(
  supabase: any,
  userId: string,
  featureKey: FeatureKey,
  packageTier: PackageTier
) {
  try {
    // Call the database function to check limits
    const { data: result, error } = await supabase.rpc(
      'check_feature_limit',
      {
        p_user_id: userId,
        p_feature_key: featureKey,
        p_package_tier: packageTier,
      }
    )

    if (error) {
      console.error(`[${featureKey}] Rate limit check error:`, error)
      // Fail open on errors (allow the request)
      return { allowed: true, used: 0, limit: null, remaining: null }
    }

    const { allowed, used, limit_count, remaining } = result[0] || {}

    return {
      allowed: allowed !== false,
      used: used || 0,
      limit: limit_count || null,
      remaining: remaining || null,
    }
  } catch (error: any) {
    console.error(`[${featureKey}] Unexpected error in rate limit check:`, error)
    // Fail open on unexpected errors
    return { allowed: true, used: 0, limit: null, remaining: null }
  }
}

// ─── Helper: Log audit trail ────────────────────────────────
async function logAudit(
  supabase: any,
  userId: string,
  action: string,
  featureKey: FeatureKey,
  details: any
) {
  try {
    await supabase.from('audit_log').insert({
      user_id: userId,
      action,
      feature_key: featureKey,
      details,
    })
  } catch (error) {
    // Silently fail audit logging (don't block requests)
    console.warn('Failed to log audit trail:', error)
  }
}

// ─── Helper: Record feature usage ───────────────────────────
/**
 * After a feature request succeeds, call this to record usage.
 * This allows rate limiting to work correctly.
 *
 * @example
 * await recordFeatureUsage(supabase, userId, 'linkedin_messages', {
 *   responseTimeMs: 1234,
 *   tokensUsed: 500,
 * })
 */
export async function recordFeatureUsage(
  supabase: any,
  userId: string,
  featureKey: FeatureKey,
  options?: {
    responseTimeMs?: number
    tokensUsed?: number
    requestId?: string
    statusCode?: number
    errorMessage?: string
  }
) {
  try {
    await supabase.from('feature_usage').insert({
      user_id: userId,
      feature_key: featureKey,
      response_time_ms: options?.responseTimeMs,
      tokens_used: options?.tokensUsed,
      request_id: options?.requestId,
      status_code: options?.statusCode || 200,
      error_message: options?.errorMessage,
    })
  } catch (error) {
    // Silently fail usage recording (don't block requests)
    console.warn(`[${featureKey}] Failed to record usage:`, error)
  }
}
