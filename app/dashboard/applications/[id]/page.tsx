'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'
import { useParams } from 'next/navigation'

// ── Types — match exactly what the AI returns ─────────────────
type BulletChange = { original: string; tailored: string; reason: string }

type ExperienceSection = {
  section_type: 'experience'
  company: string
  role: string
  dates: string
  original_bullets: string[]
  tailored_bullets: string[]
  bullet_changes: BulletChange[]
}

type SummarySection = {
  section_type: 'summary'
  original: string
  tailored: string
  change_reason: string
}

type TailoredSection = ExperienceSection | SummarySection

type TailoredOutput = {
  id: string
  ats_score: number
  key_matches: string[]
  key_gaps: string[]
  cover_letter: string
  tailored_sections: TailoredSection[]
  top_changes: Array<{ what: string; why: string }>
  analysis: {
    top_priorities: string[]
    key_skills: string[]
    culture_signals: string[]
    ats_score: number
    score_explanation: string
  }
  created_at: string
}

type Application = {
  id: string
  company_name: string
  job_title: string
  job_url?: string
  status: string
  notes?: string
  created_at: string
  tailored_output_id?: string
  tailored_outputs?: TailoredOutput
}

const STATUS_OPTIONS = ['draft', 'applied', 'interview', 'offer', 'rejected']
const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  applied:   'bg-blue-100 text-brand',
  interview: 'bg-green-100 text-green-700',
  offer:     'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-600',
}

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
                <span className="text-green-600 font-bold text-xs mr-2">AFTER</span>
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

export default function ApplicationDetailPage() {
  const params = useParams()
  const id = params.id as string

  const [app, setApp]               = useState<Application | null>(null)
  const [loading, setLoading]       = useState(true)
  const [tab, setTab]               = useState<'resume' | 'cover' | 'analysis'>('resume')
  const [notes, setNotes]           = useState('')
  const [savingNotes, setSavingNotes] = useState(false)
  const [copied, setCopied]         = useState(false)
  const [openSections, setOpenSections] = useState<Record<number, boolean>>({ 0: true })

  const supabase = createClient()

  useEffect(() => {
    async function load() {
      const { data, error } = await supabase
        .from('applications')
        .select('*, tailored_outputs(*)')
        .eq('id', id)
        .single()

      if (data) {
        setApp(data as Application)
        setNotes(data.notes ?? '')
      }
      setLoading(false)
    }
    load()
  }, [id])

  async function updateStatus(status: string) {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApp(prev => prev ? { ...prev, status } : prev)
  }

  async function saveNotes() {
    setSavingNotes(true)
    await supabase.from('applications').update({ notes }).eq('id', id)
    setSavingNotes(false)
  }

  function toggleSection(i: number) {
    setOpenSections(prev => ({ ...prev, [i]: !prev[i] }))
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64 text-gray-400">Loading…</div>
  )

  if (!app) return (
    <div className="max-w-3xl">
      <p className="text-gray-500">Application not found.</p>
      <Link href="/dashboard/applications" className="text-brand hover:underline text-sm mt-2 inline-block">← Back to applications</Link>
    </div>
  )

  const output = app.tailored_outputs

  return (
    <div className="max-w-5xl">

      {/* Header */}
      <div className="flex items-start justify-between mb-8 gap-4">
        <div>
          <Link href="/dashboard/applications" className="text-sm text-gray-400 hover:text-brand mb-2 inline-block">
            ← All applications
          </Link>
          <h1 className="text-2xl font-black text-gray-900">{app.company_name}</h1>
          <p className="text-gray-500 mt-0.5">{app.job_title}</p>
          {app.job_url && (
            <a href={app.job_url} target="_blank" rel="noopener noreferrer"
              className="text-xs text-brand hover:underline mt-1 inline-block">
              View job posting ↗
            </a>
          )}
        </div>
        <div className="flex items-center gap-3 flex-shrink-0">
          <select
            value={app.status}
            onChange={e => updateStatus(e.target.value)}
            className={`text-sm font-semibold px-4 py-2 rounded-full border-0 cursor-pointer ${STATUS_STYLES[app.status]}`}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <Link
            href={`/dashboard/tailor?company=${encodeURIComponent(app.company_name)}&title=${encodeURIComponent(app.job_title)}`}
            className="btn-primary text-sm"
          >
            ✨ Re-Applimatic
          </Link>
        </div>
      </div>

      {/* No AI output yet */}
      {!output ? (
        <div className="card p-12 text-center mb-6">
          <div className="text-4xl mb-3">🤖</div>
          <h3 className="font-bold text-gray-900 mb-2">No AI output yet</h3>
          <p className="text-gray-500 text-sm mb-5">
            This application was added manually. Use AppliMatic to generate a tailored resume and cover letter.
          </p>
          <Link
            href={`/dashboard/tailor?company=${encodeURIComponent(app.company_name)}&title=${encodeURIComponent(app.job_title)}`}
            className="btn-primary"
          >
            ✨ Applimatic this application
          </Link>
        </div>
      ) : (
        <>
          {/* ATS Score + Key stats */}
          <div className="card p-5 mb-6 flex flex-col sm:flex-row items-center gap-6">
            <ATSRing score={output.analysis?.ats_score ?? output.ats_score ?? 0} />
            <div className="flex-1 min-w-0">
              {output.analysis?.score_explanation && (
                <p className="text-sm text-gray-500 mb-3">{output.analysis.score_explanation}</p>
              )}
              <div className="flex flex-wrap gap-2">
                {output.key_matches?.slice(0, 5).map((m, i) => (
                  <span key={i} className="text-xs bg-green-50 text-green-700 font-semibold px-2.5 py-1 rounded-full border border-green-100">
                    ✓ {m}
                  </span>
                ))}
                {output.key_gaps?.slice(0, 3).map((g, i) => (
                  <span key={i} className="text-xs bg-red-50 text-red-600 font-semibold px-2.5 py-1 rounded-full border border-red-100">
                    ✗ {g}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* What we changed and why */}
          {output.top_changes?.length > 0 && (
            <div className="card p-5 mb-6 bg-blue-50 border-blue-100">
              <h3 className="font-bold text-brand text-sm mb-3">📋 What we changed and why</h3>
              <div className="space-y-2">
                {output.top_changes.map((c, i) => (
                  <div key={i} className="flex gap-3 text-sm">
                    <span className="text-brand font-bold flex-shrink-0">{i + 1}.</span>
                    <span><strong className="text-gray-800">{c.what}</strong> — <span className="text-gray-600">{c.why}</span></span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tabs */}
          <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
            {(['resume', 'cover', 'analysis'] as const).map(t => (
              <button key={t} onClick={() => setTab(t)}
                className={`px-5 py-2 rounded-lg text-sm font-semibold transition-all ${
                  tab === t ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
                }`}>
                {t === 'resume' ? '📄 Resume' : t === 'cover' ? '✉️ Cover Letter' : '📊 Analysis'}
              </button>
            ))}
          </div>

          {/* ── RESUME TAB ─────────────────────────────────── */}
          {tab === 'resume' && (
            <div className="space-y-3">
              {output.tailored_sections?.map((section, i) => {
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
                              <p className="text-xs font-bold text-green-600 uppercase mb-2">After</p>
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
                            <div>
                              <p className="text-xs font-bold text-green-600 uppercase mb-2">After</p>
                              <ul className="space-y-1.5">
                                {section.tailored_bullets?.map((b, j) => {
                                  const wasChanged = section.bullet_changes?.some(c => c.tailored === b)
                                  return (
                                    <li key={j} className={`text-sm flex gap-2 ${wasChanged ? 'font-medium text-gray-800' : 'text-gray-600'}`}>
                                      <span className={`flex-shrink-0 mt-0.5 ${wasChanged ? 'text-green-500' : 'text-gray-300'}`}>•</span>
                                      <span>{b}</span>
                                      {wasChanged && <span className="text-green-500 text-xs flex-shrink-0">✦</span>}
                                    </li>
                                  )
                                })}
                              </ul>
                            </div>
                          </div>
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
          {tab === 'cover' && (
            <div className="card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-gray-900">Cover Letter</h3>
                <button
                  onClick={() => { navigator.clipboard.writeText(output.cover_letter); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
                  className={`btn-secondary text-sm ${copied ? 'border-green-500 text-green-600' : ''}`}
                >
                  {copied ? '✓ Copied!' : 'Copy to clipboard'}
                </button>
              </div>
              <div className="bg-gray-50 rounded-xl p-5 text-sm text-gray-700 leading-relaxed whitespace-pre-line">
                {output.cover_letter}
              </div>
            </div>
          )}

          {/* ── ANALYSIS TAB ───────────────────────────────── */}
          {tab === 'analysis' && (
            <div className="space-y-4">
              {output.analysis?.top_priorities?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3">🎯 What this role is really looking for</h3>
                  <ol className="space-y-2">
                    {output.analysis.top_priorities.map((p, i) => (
                      <li key={i} className="flex gap-3 text-sm">
                        <span className="w-5 h-5 rounded-full bg-brand text-white flex items-center justify-center text-xs font-bold flex-shrink-0">{i + 1}</span>
                        <span className="text-gray-700">{p}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              )}
              {output.analysis?.culture_signals?.length > 0 && (
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3">🏢 Culture signals</h3>
                  <div className="flex flex-wrap gap-2">
                    {output.analysis.culture_signals.map((s, i) => (
                      <span key={i} className="text-xs bg-purple-50 text-purple-700 font-medium px-3 py-1.5 rounded-full">{s}</span>
                    ))}
                  </div>
                </div>
              )}
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3">✅ Strong matches</h3>
                  <ul className="space-y-1.5">
                    {output.key_matches?.map((m, i) => (
                      <li key={i} className="flex gap-2 text-sm text-gray-700">
                        <span className="text-green-500">✓</span>{m}
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="card p-5">
                  <h3 className="font-bold text-gray-900 mb-3">⚠️ Gaps to address</h3>
                  {output.key_gaps?.length > 0 ? (
                    <ul className="space-y-1.5">
                      {output.key_gaps.map((g, i) => (
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
        </>
      )}

      {/* Notes */}
      <div className="card p-6 mt-6">
        <h3 className="font-bold text-gray-900 mb-3">Notes</h3>
        <textarea
          value={notes}
          onChange={e => setNotes(e.target.value)}
          placeholder="Add notes — contacts, follow-ups, interview prep…"
          rows={4}
          className="input resize-none"
        />
        <button onClick={saveNotes} disabled={savingNotes} className="btn-primary mt-3 text-sm disabled:opacity-50">
          {savingNotes ? 'Saving…' : 'Save notes'}
        </button>
      </div>
    </div>
  )
}
