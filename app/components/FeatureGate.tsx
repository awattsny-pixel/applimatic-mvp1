'use client'

/**
 * FeatureGate Component
 *
 * Frontend component that controls feature visibility based on user's package tier.
 * Use this to conditionally render UI elements, show upgrade prompts, etc.
 *
 * Example usage:
 *
 * ```tsx
 * <FeatureGate featureKey="linkedin_messages">
 *   <button onClick={handleGenerateMessages}>
 *     Generate LinkedIn Messages
 *   </button>
 * </FeatureGate>
 *
 * // With fallback UI for unpaid users
 * <FeatureGate
 *   featureKey="docx_export"
 *   fallback={
 *     <div className="p-4 bg-blue-50 rounded-lg">
 *       <p>Export to Word is available on Starter plan and up.</p>
 *       <a href="/upgrade" className="text-brand font-bold">Upgrade now →</a>
 *     </div>
 *   }
 * >
 *   <ExportButton />
 * </FeatureGate>
 * ```
 */

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'

export type FeatureKey =
  | 'tailor'
  | 'differential'
  | 'keyword_analysis'
  | 'linkedin_messages'
  | 'interview_prep'
  | 'docx_export'

export type PackageTier = 'free' | 'starter' | 'pro'

interface FeatureGateProps {
  featureKey: FeatureKey
  children: React.ReactNode
  fallback?: React.ReactNode
  showUpgradePrompt?: boolean
  onAccessDenied?: (reason: string) => void
}

interface FeatureConfig {
  free_tier: boolean
  starter_tier: boolean
  pro_tier: boolean
  feature_name: string
}

/**
 * FeatureGate Component - Controls visibility based on package tier
 *
 * @param featureKey - The feature to check access for
 * @param children - Content to show if user has access
 * @param fallback - Content to show if user doesn't have access
 * @param showUpgradePrompt - Whether to show an inline upgrade prompt (default: true)
 * @param onAccessDenied - Callback when access is denied
 */
export function FeatureGate({
  featureKey,
  children,
  fallback,
  showUpgradePrompt = true,
  onAccessDenied,
}: FeatureGateProps) {
  const [hasAccess, setHasAccess] = useState<boolean | null>(null)
  const [packageTier, setPackageTier] = useState<PackageTier | null>(null)
  const [featureConfig, setFeatureConfig] = useState<FeatureConfig | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  useEffect(() => {
    checkAccess()
  }, [featureKey])

  async function checkAccess() {
    try {
      setLoading(true)
      setError(null)

      const supabase = await createClient()

      // Get current user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setHasAccess(false)
        setPackageTier(null)
        onAccessDenied?.('Not authenticated')
        return
      }

      // Get user's package tier
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('package_tier')
        .eq('id', user.id)
        .single()

      if (profileError || !profile) {
        setError('Unable to determine package tier')
        setHasAccess(false)
        return
      }

      const tier = (profile.package_tier || 'free') as PackageTier
      setPackageTier(tier)

      // Get feature configuration
      const { data: feature, error: featureError } = await supabase
        .from('package_features')
        .select('free_tier, starter_tier, pro_tier, feature_name, is_active')
        .eq('feature_key', featureKey)
        .single()

      if (featureError || !feature) {
        setError('Feature not found')
        setHasAccess(false)
        return
      }

      if (!feature.is_active) {
        setError('Feature is currently unavailable')
        setHasAccess(false)
        return
      }

      setFeatureConfig(feature)

      // Check if user's tier has access
      const tierHasAccess =
        (tier === 'free' && feature.free_tier) ||
        (tier === 'starter' && feature.starter_tier) ||
        (tier === 'pro' && feature.pro_tier)

      if (!tierHasAccess) {
        onAccessDenied?.(
          `Your ${tier} plan doesn't include ${feature.feature_name}`
        )
      }

      setHasAccess(tierHasAccess)
    } catch (err: any) {
      console.error('Error checking feature access:', err)
      setError(err.message || 'Error checking access')
      setHasAccess(false)
    } finally {
      setLoading(false)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="animate-pulse bg-gray-200 rounded-lg h-10 w-full" />
    )
  }

  // Error state
  if (error) {
    console.error(`[${featureKey}] FeatureGate error:`, error)
    return fallback || null
  }

  // Access denied
  if (!hasAccess) {
    if (fallback) {
      return fallback
    }

    if (showUpgradePrompt && packageTier) {
      return (
        <UpgradePrompt
          featureKey={featureKey}
          featureName={featureConfig?.feature_name || 'This feature'}
          currentTier={packageTier}
        />
      )
    }

    return null
  }

  // Access granted
  return children
}

// ─── Upgrade Prompt Component ───────────────────────────────
interface UpgradePromptProps {
  featureKey: FeatureKey
  featureName: string
  currentTier: PackageTier
}

function UpgradePrompt({
  featureKey,
  featureName,
  currentTier,
}: UpgradePromptProps) {
  const upgradeTier = currentTier === 'free' ? 'Starter' : 'Pro'

  return (
    <div className="rounded-xl border border-blue-200 bg-blue-50 p-4">
      <div className="flex items-start gap-3">
        <div className="text-xl flex-shrink-0">🔒</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-900 mb-1">
            {featureName} is available on {upgradeTier} plan
          </p>
          <p className="text-xs text-gray-600 mb-3">
            Upgrade your plan to unlock this feature and many more.
          </p>
          <a
            href="/dashboard/upgrade"
            className="text-xs font-semibold text-brand hover:underline inline-flex items-center gap-1"
          >
            Upgrade now
            <span>→</span>
          </a>
        </div>
      </div>
    </div>
  )
}

// ─── Usage Badge Component ──────────────────────────────────
/**
 * Shows how many requests the user has left this month
 *
 * Example:
 * ```tsx
 * <UsageBadge featureKey="linkedin_messages" used={3} limit={5} />
 * ```
 */
interface UsageBadgeProps {
  featureKey: FeatureKey
  used: number
  limit: number | null
}

export function UsageBadge({ featureKey, used, limit }: UsageBadgeProps) {
  if (limit === null || limit === undefined) {
    return (
      <span className="text-xs text-gray-400 font-medium">
        Unlimited
      </span>
    )
  }

  const remaining = Math.max(0, limit - used)
  const percentage = (remaining / limit) * 100

  let color = 'text-green-600'
  let bgColor = 'bg-green-50'

  if (percentage <= 25) {
    color = 'text-red-600'
    bgColor = 'bg-red-50'
  } else if (percentage <= 50) {
    color = 'text-amber-600'
    bgColor = 'bg-amber-50'
  }

  return (
    <span className={`text-xs font-semibold px-2 py-1 rounded-full ${bgColor} ${color}`}>
      {remaining} of {limit} remaining
    </span>
  )
}

// ─── Feature Badge Component ────────────────────────────────
/**
 * Shows which plan a feature is available on
 *
 * Example:
 * ```tsx
 * <FeatureBadge
 *   featureName="LinkedIn Messages"
 *   availableOn={['starter', 'pro']}
 * />
 * ```
 */
interface FeatureBadgeProps {
  featureName: string
  availableOn: PackageTier[]
}

export function FeatureBadge({
  featureName,
  availableOn,
}: FeatureBadgeProps) {
  const tierLabels: Record<PackageTier, string> = {
    free: 'Free',
    starter: 'Starter+',
    pro: 'Pro',
  }

  return (
    <div className="flex items-center gap-2">
      <span className="text-sm text-gray-600">{featureName}</span>
      <div className="flex gap-1">
        {availableOn.map((tier) => (
          <span
            key={tier}
            className="text-xs font-semibold px-2 py-0.5 rounded-full bg-gray-100 text-gray-700"
          >
            {tierLabels[tier]}
          </span>
        ))}
      </div>
    </div>
  )
}

// ─── Feature Status Hook ────────────────────────────────────
/**
 * Hook to get feature access status and usage info
 *
 * Example:
 * ```tsx
 * const { hasAccess, packageTier, remaining, limit } = useFeatureAccess('linkedin_messages')
 *
 * if (!hasAccess) {
 *   return <UpgradePrompt />
 * }
 *
 * return (
 *   <div>
 *     <UsageBadge used={limit - remaining} limit={limit} />
 *     <button onClick={handleClick}>Use feature</button>
 *   </div>
 * )
 * ```
 */
export function useFeatureAccess(featureKey: FeatureKey) {
  const [data, setData] = useState({
    hasAccess: false,
    packageTier: null as PackageTier | null,
    featureName: '',
    remaining: 0,
    limit: null as number | null,
    loading: true,
  })

  useEffect(() => {
    checkFeatureAccess()
  }, [featureKey])

  async function checkFeatureAccess() {
    try {
      const supabase = await createClient()

      // Get user
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setData((prev) => ({ ...prev, loading: false }))
        return
      }

      // Get profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('package_tier')
        .eq('id', user.id)
        .single()

      const tier = (profile?.package_tier || 'free') as PackageTier

      // Get feature config
      const { data: feature } = await supabase
        .from('package_features')
        .select('free_tier, starter_tier, pro_tier, feature_name, free_limit, starter_limit, pro_limit')
        .eq('feature_key', featureKey)
        .single()

      if (!feature) {
        setData((prev) => ({ ...prev, loading: false }))
        return
      }

      // Check access
      const hasAccess =
        (tier === 'free' && feature.free_tier) ||
        (tier === 'starter' && feature.starter_tier) ||
        (tier === 'pro' && feature.pro_tier)

      // Get usage
      const { data: usageResult } = await supabase.rpc(
        'check_feature_limit',
        {
          p_user_id: user.id,
          p_feature_key: featureKey,
          p_package_tier: tier,
        }
      )

      const { remaining = 0, limit_count = null } = usageResult?.[0] || {}

      setData({
        hasAccess,
        packageTier: tier,
        featureName: feature.feature_name,
        remaining,
        limit: limit_count,
        loading: false,
      })
    } catch (error) {
      console.error('Error checking feature access:', error)
      setData((prev) => ({ ...prev, loading: false }))
    }
  }

  return data
}
