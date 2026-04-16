'use client'

import { useState } from 'react'
import Link from 'next/link'

const PLANS = [
  {
    name: 'Free',
    price: { monthly: 0, annual: 0 },
    description: 'Get started and try it out.',
    features: [
      '3 tailored applications/month',
      'AI resume tailoring',
      'Cover letter generation',
      'ATS score',
      'Application tracker',
    ],
    cta: 'Current plan',
    current: true,
    highlight: false,
  },
  {
    name: 'Starter',
    price: { monthly: 9, annual: 7 },
    description: 'For active job seekers.',
    features: [
      '20 tailored applications/month',
      'Everything in Free',
      'Before/after resume diff view',
      'Keyword gap analysis',
      'Priority support',
    ],
    cta: 'Upgrade to Starter',
    current: false,
    highlight: true,
    priceId: { monthly: 'price_starter_monthly', annual: 'price_starter_annual' },
  },
  {
    name: 'Pro',
    price: { monthly: 19, annual: 15 },
    description: 'For serious job seekers.',
    features: [
      'Unlimited applications',
      'Everything in Starter',
      'LinkedIn outreach messages',
      'Interview prep questions',
      'Export tailored resume as DOCX',
    ],
    cta: 'Upgrade to Pro',
    current: false,
    highlight: false,
    priceId: { monthly: 'price_pro_monthly', annual: 'price_pro_annual' },
  },
]

export default function UpgradePage() {
  const [billing, setBilling] = useState<'monthly' | 'annual'>('monthly')
  const [loading, setLoading] = useState<string | null>(null)

  async function handleUpgrade(plan: typeof PLANS[0]) {
    if (plan.current || !plan.priceId) return
    setLoading(plan.name)

    try {
      const res = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceId: plan.priceId[billing] }),
      })
      const { url, error } = await res.json()
      if (error) throw new Error(error)
      window.location.href = url
    } catch (err) {
      console.error(err)
      alert('Something went wrong. Please try again.')
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <Link href="/dashboard" className="text-sm text-gray-400 hover:text-brand mb-2 inline-block">← Dashboard</Link>
        <h1 className="text-2xl font-black text-gray-900">Upgrade your plan</h1>
        <p className="text-gray-500 mt-1">More applications, more features, more interviews.</p>
      </div>

      {/* Billing toggle */}
      <div className="flex items-center gap-3 mb-8">
        <button
          onClick={() => setBilling('monthly')}
          className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
            billing === 'monthly' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Monthly
        </button>
        <div className="relative bg-gray-100 rounded-xl p-1 flex">
          <button
            onClick={() => setBilling('annual')}
            className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
              billing === 'annual' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Annual
          </button>
          <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold px-1.5 py-0.5 rounded-full">
            -20%
          </span>
        </div>
      </div>

      {/* Plans */}
      <div className="grid sm:grid-cols-3 gap-4">
        {PLANS.map(plan => (
          <div
            key={plan.name}
            className={`card p-6 flex flex-col ${
              plan.highlight ? 'border-2 border-brand ring-4 ring-brand/10' : ''
            }`}
          >
            {plan.highlight && (
              <div className="text-xs font-bold text-white bg-brand px-3 py-1 rounded-full w-fit mb-4">
                Most popular
              </div>
            )}

            <h3 className="font-black text-gray-900 text-lg">{plan.name}</h3>
            <p className="text-gray-500 text-sm mt-1 mb-4">{plan.description}</p>

            <div className="mb-6">
              {plan.price.monthly === 0 ? (
                <span className="text-3xl font-black text-gray-900">Free</span>
              ) : (
                <div className="flex items-end gap-1">
                  <span className="text-3xl font-black text-gray-900">
                    ${billing === 'monthly' ? plan.price.monthly : plan.price.annual}
                  </span>
                  <span className="text-gray-400 text-sm mb-1">/mo</span>
                </div>
              )}
              {billing === 'annual' && plan.price.monthly > 0 && (
                <p className="text-xs text-accent font-medium mt-1">
                  Billed ${plan.price.annual * 12}/year — save ${(plan.price.monthly - plan.price.annual) * 12}
                </p>
              )}
            </div>

            <ul className="space-y-2.5 flex-1 mb-6">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-gray-600">
                  <span className={`mt-0.5 flex-shrink-0 ${plan.current ? 'text-gray-400' : 'text-accent'}`}>✓</span>
                  {f}
                </li>
              ))}
            </ul>

            {plan.current ? (
              <button
                disabled
                className="block text-center py-3 rounded-xl bg-gray-100 text-gray-500 font-bold text-sm cursor-not-allowed"
              >
                Current plan
              </button>
            ) : (
              <button
                disabled
                className="block text-center py-3 rounded-xl bg-brand text-white font-bold text-sm opacity-50 cursor-not-allowed"
              >
                Coming soon
              </button>
            )}
          </div>
        ))}
      </div>

      {/* FAQ */}
      <div className="mt-10 card p-6">
        <h3 className="font-bold text-gray-900 mb-4">Common questions</h3>
        <div className="space-y-4 text-sm text-gray-600">
          <div>
            <p className="font-semibold text-gray-900">Can I cancel anytime?</p>
            <p className="mt-0.5">Yes. Cancel anytime from your account settings — no questions asked.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">What counts as one application?</p>
            <p className="mt-0.5">Each time you use the AI to tailor your resume for a specific job counts as one application.</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Do unused applications roll over?</p>
            <p className="mt-0.5">No — limits reset each billing period.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
