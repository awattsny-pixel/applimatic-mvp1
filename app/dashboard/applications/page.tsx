'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import Link from 'next/link'

type Application = {
  id: string
  company_name: string
  job_title: string
  job_url?: string
  status: string
  created_at: string
  tailored_output_id?: string
}

const STATUS_OPTIONS = ['draft', 'applied', 'interview', 'offer', 'rejected']

const STATUS_STYLES: Record<string, string> = {
  draft:     'bg-gray-100 text-gray-600',
  applied:   'bg-blue-100 text-brand',
  interview: 'bg-green-100 text-green-700',
  offer:     'bg-yellow-100 text-yellow-700',
  rejected:  'bg-red-100 text-red-600',
}

export default function ApplicationsPage() {
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading]           = useState(true)
  const [showForm, setShowForm]         = useState(false)
  const [companyName, setCompanyName]   = useState('')
  const [jobTitle, setJobTitle]         = useState('')
  const [jobUrl, setJobUrl]             = useState('')
  const [saving, setSaving]             = useState(false)

  const supabase = createClient()

  async function loadApplications() {
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const { data } = await supabase
      .from('applications')
      .select('id, company_name, job_title, job_url, status, created_at, tailored_output_id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    setApplications(data ?? [])
    setLoading(false)
  }

  useEffect(() => { loadApplications() }, [])

  async function handleAddApplication(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('applications').insert({
      user_id:      user.id,
      company_name: companyName,
      job_title:    jobTitle,
      job_url:      jobUrl || null,
      status:       'draft',
    })

    setCompanyName('')
    setJobTitle('')
    setJobUrl('')
    setShowForm(false)
    setSaving(false)
    loadApplications()
  }

  async function updateStatus(id: string, status: string) {
    await supabase.from('applications').update({ status }).eq('id', id)
    setApplications(prev => prev.map(a => a.id === id ? { ...a, status } : a))
  }

  async function deleteApplication(id: string) {
    if (!confirm('Delete this application?')) return
    await supabase.from('applications').delete().eq('id', id)
    setApplications(prev => prev.filter(a => a.id !== id))
  }

  return (
    <div className="max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-black text-gray-900">Applications</h1>
          <p className="text-gray-500 mt-1">Track every job you're pursuing.</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="btn-primary">
          + New application
        </button>
      </div>

      {/* Add Application Form */}
      {showForm && (
        <div className="card p-6 mb-6 border-t-4 border-t-brand">
          <h3 className="font-bold text-gray-900 mb-4">Add a new application</h3>
          <form onSubmit={handleAddApplication} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Company name *</label>
                <input className="input" placeholder="e.g. Stripe" value={companyName} onChange={e => setCompanyName(e.target.value)} required />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700 block mb-1.5">Job title *</label>
                <input className="input" placeholder="e.g. Product Manager" value={jobTitle} onChange={e => setJobTitle(e.target.value)} required />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 block mb-1.5">Job URL (optional)</label>
              <input className="input" placeholder="https://..." value={jobUrl} onChange={e => setJobUrl(e.target.value)} type="url" />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={saving} className="btn-primary disabled:opacity-50">
                {saving ? 'Saving…' : 'Save application'}
              </button>
              <button type="button" onClick={() => setShowForm(false)} className="btn-secondary">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Applications List */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : applications.length === 0 ? (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-3">📋</div>
          <h3 className="font-bold text-gray-900 mb-2">No applications yet</h3>
          <p className="text-gray-500 text-sm mb-5">Add your first application to start tracking your job search.</p>
          <button onClick={() => setShowForm(true)} className="btn-primary">
            + Add first application
          </button>
        </div>
      ) : (
        <div className="card overflow-hidden">
          <div className="divide-y divide-gray-50">
            {applications.map(app => (
              <div key={app.id} className="px-6 py-4 flex items-center hover:bg-gray-50 group">
                {/* Company + title — takes remaining space */}
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-900">{app.company_name}</p>
                  <p className="text-sm text-gray-500">{app.job_title}</p>
                  {app.job_url && (
                    <a href={app.job_url} target="_blank" rel="noopener noreferrer" className="text-xs text-brand hover:underline">
                      View job posting ↗
                    </a>
                  )}
                </div>

                {/* Status selector — fixed width */}
                <div className="w-32 flex justify-center">
                  <select
                    value={app.status}
                    onChange={e => updateStatus(app.id, e.target.value)}
                    className={`text-xs font-semibold px-3 py-1.5 rounded-full border-0 cursor-pointer ${STATUS_STYLES[app.status]}`}
                  >
                    {STATUS_OPTIONS.map(s => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Date — fixed width */}
                <div className="w-24 text-right">
                  <span className="text-xs text-gray-400">
                    {new Date(app.created_at).toLocaleDateString()}
                  </span>
                </div>

                {/* Applimatic status — fixed width, right-aligned */}
                <div className="w-40 flex justify-end">
                  {app.tailored_output_id ? (
                    <Link
                      href={`/dashboard/applications/${app.id}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-purple-700 bg-purple-50 px-3 py-1.5 rounded-full hover:bg-purple-100 transition-colors whitespace-nowrap"
                    >
                      ★ Applimatic Complete
                    </Link>
                  ) : (
                    <Link
                      href={`/dashboard/tailor?company=${encodeURIComponent(app.company_name)}&title=${encodeURIComponent(app.job_title)}`}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-white bg-brand px-3 py-1.5 rounded-full hover:bg-brandDark transition-colors whitespace-nowrap"
                    >
                      ✨ Applimatic Me
                    </Link>
                  )}
                </div>

                {/* Delete — fixed width */}
                <div className="w-6 text-center">
                  <button
                    onClick={() => deleteApplication(app.id)}
                    className="opacity-0 group-hover:opacity-100 text-gray-300 hover:text-red-500 transition-all text-lg leading-none"
                    title="Delete"
                  >
                    ×
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
