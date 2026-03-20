'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'

// ── Types ────────────────────────────────────────────────────
type BulletChange = { original: string; tailored: string; reason: string }
type ExperienceSection = {
  section_type: 'experience'
  company: string; role: string; dates: string
  original_bullets: string[]
  tailored_bullets: string[]
  bullet_changes: BulletChange[]
}
type SummarySection = {
  section_type: 'summary'
  original: string; tailored: string; change_reason: string
}
type TailoredSection = ExperienceSection | SummarySection

type TailorResult = {
  analysis: {
    top_priorities: string[]
    key_skills: string[]
    culture_signals: string[]
    ats_score: number
    score_explanation: string
  }
  tailored_sections: TailoredSection[]
  top_changes: { what: string; why: string }[]
  cover_letter: string
  key_matches: string[]
  key_gaps: string[]
}

// ── Loading messages (shown during AI processing) ────────────
const LOADING_STEPS = [
  { msg: 'Reading job description…',         duration: 3000 },
  { msg: 'Identifying what they care about…',duration: 5000 },
  { msg: 'Matching your experience…',        duration: 6000 },
  { msg: 'Rewriting your bullets…',          duration: 8000 },
  { msg: 'Writing your cover letter…',       duration: 7000 },
  { msg: 'Finalising your application…',     duration: 4000 },
]

// ── ATS Score Ring ───────────────────────────────────────────
function ATSRing({ score }: { score: number }) {
  const radius = 36
  const circ   = 2 * Math.PI * radius
  const offset = circ - (score / 100) * circ
  const color  = score >= 80 ? '#059669' : score >= 60 ? '#D97706' : '#DC2626'

  return (
    <div className="flex flex-col items-center">
      <svg width="96" height="96" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={radius} fill="none" stroke="#E5E7EB" strokeWidth="8"/>
        <circle cx="48" cy="48" r={radius} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" transform="rotate(-90 48 48)"
          style={{ transition: 'stroke-dashoffset 1s ease' }}
        />
        <text x="48" y="53" textAnchor="middle" fontSize="20" fontWeight="800" fill={color}>{score}</text>
      </svg>
      <span className="text-xs font-semibold text-gray-500 mt-1">ATS Score</span>
    </div>
  )
}

// ── Before/After Diff View ───────────────────────────────────
function BulletDiff({ changes }: { changes: BulletChange[] }) {
  const [open, setOpen] = useState(false)
  if (!changes?.length) return null
  return (
    <div className="mt-3">
      <button onClick={() => setOpen(!open)}
        className="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
        {open ? '▾' : '▸'} {changes.length} change{changes.length > 1 ? 's' : ''} explained
      </button>
      {open && (
        <div className="mt-2 space-y-3">
          {changes.map((c, i) => (
            <div key={i} className="rounded-xl overflow-hidden border border-gray-100 text-sm">
              <div className="px-4 py-2.5 bg-red-50 border-b border-gray-100">
                <span className="text-red-400 font-bold text-xs mr-2">BEFORE</span>
                <span className="text-gray-600">{c.original}</span>
              </div>
              <div className="px-4 py-2.5 bg-green-50 border-b border-gray-100">
                <span className="text-accent font-bold text-xs mr-2">AFTER</span>
                <span className="text-gray-700 font-medium">{c.tailored}</span>
              </div>
              <div className="px-4 py-2 bg-blue-50">
                <span className="text-brand text-xs">💡 {c.reason}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ── Main Page ────────────────────────────────────────────────
export default function TailorPage() {
  const searchParams = useSearchParams()

  // Form state — pre-fill from URL params if coming from Applications page
  const [companyName,     setCompanyName]     = useState(searchParams.get('company') ?? '')
  const [jobTitle,        setJobTitle]         = useState(searchParams.get('title') ?? '')
  const [jobUrl,          setJobUrl]           = useState('')
  const [jobDescription,  setJobDescription]   = useState('')

  // UI state
  const [step,        setStep]        = useState<'form' | 'loading' | 'result'>('form')
  const [loadingMsg,  setLoadingMsg]  = useState(LOADING_STEPS[0].msg)
  const [error,       setError]       = useState('')
  const [result,      setResult]      = useState<TailorResult | null>(null)
  const [remaining,   setRemaining]   = useState<number | null>(null)

  // Result tab state
  const [activeTab,    setActiveTab]    = useState<'resume' | 'cover' | 'analysis'>('resume')
  const [copiedCover,  setCopiedCover]  = useState(false)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({})

  // ── Submit handler ─────────────────────────────────────────
  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (jobDescription.trim().length < 50) {
      setError('Please paste a full job description (at least 50 characters).')
      return
    }

    setError('')
    setStep('loading')

    // Advance loading messages on a timer
    let i = 0
    const interval = setInterval(() => {
      i++
      if (i < LOADING_STEPS.length) setLoadingMsg(LOADING_STEPS[i].msg)
    }, 4500)

    try {
      const res = await fetch('/api/tailor', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ companyName, jobTitle, jobUrl, jobDescription }),
      })

      clearInterval(interval)
      const json = await res.json()

      if (!res.ok) {
        setError(json.message ?? json.error ?? 'Something went wrong. Please try again.')
        setStep('form')
        return
      }

      setResult(json.data)
      setRemaining(json.remaining)
      setStep('result')
      setOpenSections({ 0: true }) // open first section by default

    } catch {
      clearInterval(interval)
      setError('Network error. Please check your connection and try again.')
      setStep('form')
    }
  }

  function toggleSection(i: number) {
    setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))
  }

  function copyToClipboard(text: string) {
    navigator.clipboard.writeText(text)
    setCopiedCover(true)
    setTimeout(() => setCopiedCover(false), 2000)
  }

  function handleReset() {
    setStep('form')
    setResult(null)
    setError('')
    setJobDescription('')
    setActiveTab('resume')
  }

  // ══════════════════════════════════════════════════════════
  //  LOADING SCREEN
  // ══════════════════════════════════════════════════════════
  if (step === 'loading') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] max-w-md mx-auto text-center px-4">
        <div className="relative w-20 h-20 mb-8">
          <div className="absolute inset-0 rounded-full border-4 border-blue-100 animate-ping opacity-30"/>
          <div className="absolute inset-0 rounded-full border-4 border-t-brand border-blue-100 animate-spin"/>
          <div className="absolute inset-0 flex items-center justify-center text-2xl">✨</div>
        </div>
        <h2 className="text-xl font-black text-gray-900 mb-2">AppliMatic is working its magic</h2>
        <p className="text-brand font-semibold text-sm mb-4 h-5 transition-all">{loadingMsg}</p>
        <p className="text-gray-400 text-xs">This usually takes 20–40 seconds. Don't close the tab.</p>

        <div className="mt-8 w-full bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div className="h-full bg-brand rounded-full animate-pulse" style={{ width: '60%' }}/>
        </div>
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  RESULTS SCREEN
  // ══════════════════════════════════════════════════════════
  if (step === 'result' && result) {
    return (
      <div className="max-w-4xl">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
          <div>
            <h1 className="text-2xl font-black text-gray-900">
              {companyName ? `${companyName} — ${jobTitle}` : 'Your Tailored Application'}
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              AppliMatic'd successfully.
              {remaining !== null && ` ${remaining} application${remaining !== 1 ? 's' : ''} remaining this month.`}
            </p>
          </div>
          <div className="flex gap-2 flex-shrink-0">
            <button onClick={handleReset} className="btn-secondary text-sm">
              ← AppliMatic another
            </button>
          </div>
        </div>

        {/* ATS Score + Top Stats */}
        <div className="card p-5 mb-6 flex flex-col sm:flex-row items-center gap-6">
          <ATSRing score={result.analysis?.ats_score ?? 0} />
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-500 mb-1">{result.analysis?.score_explanation}</p>
            <div className="flex flex-wrap gap-2 mt-3">
              {result.key_matches?.slice(0, 5).map((m, i) => (
                <span key={i} className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-100">
                  ✓ {m}
                </span>
              ))}
              {result.key_gaps?.slice(0, 3).map((g, i) => (
                <span key={i} className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full border border-red-100">
                  ✗ {g}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Top Changes Summary */}
        {result.top_changes?.length > 0 && (
          <div className="card p-5 mb-6 bg-blue-50 border-blue-100">
            <h3 className="font-bold text-brand text-sm mb-3">📋 What we changed and why</h3>
            <div className="space-y-2">
              {result.top_changes.map((c, i) => (
                <div key={i} className="flex gap-3 text-sm">
                  <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>
                  <span><strong className="text-gray-800">{c.what}</strong> — <span className="text-gray-600">{c.why}</span></span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Tab Navigation */}
        <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
          {(['resume', 'cover', 'analysis'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                activeTab === tab
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'resume' ? '📄 Resume' : tab === 'cover' ? '✉️ Cover Letter' : '📊 Analysis'}
            </button>
          ))}
        </div>

        {/* ── RESUME TAB ─────────────────────────────────── */}
        {activeTab === 'resume' && (
          <div className="space-y-3">
            {result.tailored_sections?.map((section, i) => {
              const isOpen = openSections[i] ?? false

              if (section.section_type === 'summary') {
                return (
                  <div key={i} className="card overflow-hidden">
                    <button
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-left"
                    >
                      <span className="font-bold text-gray-900">Professional Summary</span>
                      <span className="text-gray-400 text-lg">{isOpen ? '▾' : '▸'}</span>
                    </button>
                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-50">
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Before</p>
                            <p className="text-sm text-gray-500 bg-gray-50 rounded-lg p-3 leading-relaxed">
                              {section.original || <em>No summary in original</em>}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs font-bold text-accent uppercase mb-2">After</p>
                            <p className="text-sm text-gray-800 bg-green-50 rounded-lg p-3 leading-relaxed font-medium">
                              {section.tailored}
                            </p>
                          </div>
                        </div>
                        {section.change_reason && (
                          <p className="text-xs text-brand bg-blue-50 rounded-lg px-3 py-2 mt-3">
                            💡 {section.change_reason}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                )
              }

              if (section.section_type === 'experience') {
                return (
                  <div key={i} className="card overflow-hidden">
                    <button
                      onClick={() => toggleSection(i)}
                      className="w-full flex items-center justify-between px-5 py-4 hover:bg-gray-50 text-left"
                    >
                      <div>
                        <span className="font-bold text-gray-900">{section.company}</span>
                        <span className="text-gray-400 mx-2">·</span>
                        <span className="text-gray-600 text-sm">{section.role}</span>
                        {section.dates && <span className="text-gray-400 text-xs ml-2">{section.dates}</span>}
                      </div>
                      <div className="flex items-center gap-2">
                        {section.bullet_changes?.length > 0 && (
                          <span className="text-xs bg-brand text-white px-2 py-0.5 rounded-full font-semibold">
                            {section.bullet_changes.length} changes
                          </span>
                        )}
                        <span className="text-gray-400 text-lg">{isOpen ? '▾' : '▸'}</span>
                      </div>
                    </button>

                    {isOpen && (
                      <div className="px-5 pb-5 border-t border-gray-50">
                        <div className="grid sm:grid-cols-2 gap-4 mt-4">
                          {/* Before column */}
                          <div>
                            <p className="text-xs font-bold text-gray-400 uppercase mb-2">Before</p>
                            <ul className="space-y-1.5">
                              {section.original_bullets?.map((b, j) => (
                                <li key={j} className="text-sm text-gray-500 flex gap-2">
                                  <span className="flex-shrink-0 text-gray-300 mt-0.5">•</span>
                                  <span>{b}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                          {/* After column */}
                          <div>
                            <p className="text-xs font-bold text-accent uppercase mb-2">After</p>
                            <ul className="space-y-1.5">
                              {section.tailored_bullets?.map((b, j) => {
                                const wasChanged = section.bullet_changes?.some(c => c.tailored === b)
                                return (
                                  <li key={j} className={`text-sm flex gap-2 ${wasChanged ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                    <span className={`flex-shrink-0 mt-0.5 ${wasChanged ? 'text-accent' : 'text-gray-300'}`}>•</span>
                                    <span>{b}</span>
                                    {wasChanged && <span className="text-accent text-xs flex-shrink-0">✦</span>}
                                  </li>
                                )
                              })}
                            </ul>
                          </div>
                        </div>
                        {/* Change explanations */}
                        <BulletDiff changes={section.bullet_changes ?? []} />
                      </div>
                    )}
                  </div>
                )
              }

              return null
            })}
          </div>
        )}

        {/* ── COVER LETTER TAB ───────────────────────────── */}
        {activeTab === 'cover' && (
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Cover Letter</h3>
              <button
                onClick={() => copyToClipboard(result.cover_letter)}
                className={`btn-secondary text-sm ${copiedCover ? 'border-accent text-accent' : ''}`}
              >
                {copiedCover ? '✓ Copied!' : 'Copy to clipboard'}
              </button>
            </div>
            <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
              {result.cover_letter}
            </div>
          </div>
        )}

        {/* ── ANALYSIS TAB ───────────────────────────────── */}
        {activeTab === 'analysis' && (
          <div className="space-y-4">
            {/* Top priorities */}
            <div className="card p-5">
              <h3 className="font-bold text-gray-900 mb-3">🎯 What this role is really looking for</h3>
              <ol className="space-y-2">
                {result.analysis?.top_priorities?.map((p, i) => (
                  <li key={i} className="flex gap-3 text-sm">
                    <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i+1}</span>
                    <span className="text-gray-700">{p}</span>
                  </li>
                ))}
              </ol>
            </div>

            {/* Culture */}
            {result.analysis?.culture_signals?.length > 0 && (
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">🏢 Company culture signals</h3>
                <div className="flex flex-wrap gap-2">
                  {result.analysis.culture_signals.map((s, i) => (
                    <span key={i} className="text-xs bg-purple-50 text-purple-700 font-medium px-3 py-1.5 rounded-full">
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Matches & Gaps */}
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">✅ Strong matches</h3>
                <ul className="space-y-1.5">
                  {result.key_matches?.map((m, i) => (
                    <li key={i} className="flex gap-2 text-sm text-gray-700">
                      <span className="text-accent">✓</span>{m}
                    </li>
                  ))}
                </ul>
              </div>
              <div className="card p-5">
                <h3 className="font-bold text-gray-900 mb-3">⚠️ Gaps to address</h3>
                {result.key_gaps?.length > 0 ? (
                  <ul className="space-y-1.5">
                    {result.key_gaps.map((g, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-600">
                        <span className="text-red-400">✗</span>{g}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-sm text-gray-400">No significant gaps found.</p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    )
  }

  // ══════════════════════════════════════════════════════════
  //  FORM SCREEN
  // ══════════════════════════════════════════════════════════
  return (
    <div className="max-w-2xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">AppliMatic a new application</h1>
        <p className="text-gray-500 mt-1">
          Paste the job description and AppliMatic will personalise your resume and write your cover letter in 30–40 seconds.
        </p>
      </div>

      {error && (
        <div className={`border text-sm rounded-xl px-4 py-3 mb-6 ${
          error.includes('resume')
            ? 'bg-amber-50 border-amber-200 text-amber-700'
            : 'bg-red-50 border-red-200 text-red-700'
        }`}>
          {error.includes('resume') && '📄 '}
          {error}
          {error.includes('resume') && (
            <a href="/dashboard/resume" className="font-bold underline ml-1">Upload your resume →</a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company + Role */}
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Company name <span className="text-gray-400 font-normal">(recommended)</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Stripe"
              value={companyName}
              onChange={e => setCompanyName(e.target.value)}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 block mb-1.5">
              Job title <span className="text-gray-400 font-normal">(recommended)</span>
            </label>
            <input
              className="input"
              placeholder="e.g. Product Manager"
              value={jobTitle}
              onChange={e => setJobTitle(e.target.value)}
            />
          </div>
        </div>

        {/* Job URL */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Job URL <span className="text-gray-400 font-normal">(optional — for your records)</span>
          </label>
          <input
            className="input"
            type="url"
            placeholder="https://jobs.stripe.com/..."
            value={jobUrl}
            onChange={e => setJobUrl(e.target.value)}
          />
        </div>

        {/* Job Description */}
        <div>
          <label className="text-sm font-medium text-gray-700 block mb-1.5">
            Job description <span className="text-red-400">*</span>
          </label>
          <textarea
            className="input min-h-[280px] resize-y font-mono text-xs leading-relaxed"
            placeholder="Paste the full job description here. The more complete it is, the better the tailoring.

Example:
We're looking for a Product Manager to join our Growth team...
• 3+ years of product management experience
• Strong analytical skills and comfort with data
• Experience with B2B SaaS products..."
            value={jobDescription}
            onChange={e => setJobDescription(e.target.value)}
            required
          />
          <p className="text-xs text-gray-400 mt-1">
            {jobDescription.length} characters — {jobDescription.length < 200 ? 'add more for better results' : 'looks good ✓'}
          </p>
        </div>

        <button
          type="submit"
          className="btn-primary w-full py-4 text-base font-bold shadow-md"
          disabled={jobDescription.trim().length < 50}
        >
          AppliMatic my application ✨
        </button>

        <p className="text-xs text-gray-400 text-center">
          Uses 1 application from your monthly limit.
          Make sure you've{' '}
          <a href="/dashboard/resume" className="text-brand hover:underline">uploaded your master resume</a>
          {' '}first.
        </p>
      </form>
    </div>
  )
}
