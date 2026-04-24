'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

const SOURCE_COLORS: Record<string, { bg: string; text: string; icon: string }> = {
  'Indeed': { bg: 'bg-blue-100', text: 'text-blue-700', icon: '🔵' },
  'RapidAPI': { bg: 'bg-purple-100', text: 'text-purple-700', icon: '⚡' },
  'Glassdoor': { bg: 'bg-green-100', text: 'text-green-700', icon: '💼' },
  'LinkedIn': { bg: 'bg-gray-100', text: 'text-gray-700', icon: '🔗' },
  'Mock': { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: '⭐' },
}

interface JobCardProps {
  job: UnifiedJob
}

export default function JobCard({ job }: JobCardProps) {
  const router = useRouter()
  const supabase = createClient()
  const [isSaved, setIsSaved] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSaveLoading, setIsSaveLoading] = useState(false)
  const [isApplyLoading, setIsApplyLoading] = useState(false)
  const [applySuccess, setApplySuccess] = useState(false)
  const [user, setUser] = useState<any>(null)
  const [token, setToken] = useState<string | null>(null)
  const sourceColor = SOURCE_COLORS[job.source] || SOURCE_COLORS['Mock']

  // Get user and token on mount
  useEffect(() => {
    const getAuth = async () => {
      const { data: { user }, error } = await supabase.auth.getUser()
      if (user) {
        setUser(user)
        // Get the session to access the token
        const { data: { session } } = await supabase.auth.getSession()
        if (session) {
          setToken(session.access_token)
        }
      }
    }
    getAuth()
  }, [supabase])

  // Check if job is saved when component mounts
  useEffect(() => {
    const checkSaved = async () => {
      if (!user || !token) return

      setIsLoading(true)
      try {
        const response = await fetch(
          `/api/saved-jobs/check?jobId=${encodeURIComponent(job.id)}&source=${encodeURIComponent(job.source)}`,
          {
            method: 'GET',
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }
        )

        if (response.ok) {
          const data = await response.json()
          setIsSaved(data.isSaved)
        }
      } catch (err) {
        console.error('Failed to check saved status:', err)
      } finally {
        setIsLoading(false)
      }
    }

    checkSaved()
  }, [job.id, job.source, user, token])

  const handleSave = async () => {
    if (!user || !token) {
      router.push('/login')
      return
    }

    setIsSaveLoading(true)
    try {
      const response = await fetch('/api/saved-jobs/toggle', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ job }),
      })

      if (response.ok) {
        const data = await response.json()
        setIsSaved(data.isSaved)
      } else {
        console.error('Failed to toggle save status')
      }
    } catch (err) {
      console.error('Error toggling save status:', err)
    } finally {
      setIsSaveLoading(false)
    }
  }

  const handleApply = async () => {
    if (!user || !token) {
      router.push('/login')
      return
    }

    setIsApplyLoading(true)
    try {
      const response = await fetch('/api/applications/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ job }),
      })

      const data = await response.json()

      if (response.ok) {
        setApplySuccess(true)
        setTimeout(() => setApplySuccess(false), 3000)
      } else {
        console.error('Failed to create application:', {
          status: response.status,
          response: data,
        })
      }
    } catch (err) {
      console.error('Error creating application:', err)
    } finally {
      setIsApplyLoading(false)
    }
  }

  const handleApplimatic = () => {
    // Store job data in sessionStorage and navigate to tailor page
    const jobData = {
      jobTitle: job.title,
      company: job.company,
      jobDescription: job.description,
      jobUrl: job.jobUrl,
    }
    sessionStorage.setItem('applimaticJobData', JSON.stringify(jobData))
    router.push('/dashboard/tailor')
  }

  const formatSalary = (salary?: string | { min?: number; max?: number; currency?: string }) => {
    if (!salary) return null
    if (typeof salary === 'string') return salary
    if (typeof salary === 'object') {
      const { min, max, currency = 'USD' } = salary
      if (min && max) return `$${min.toLocaleString()} - $${max.toLocaleString()} ${currency}`
      if (min) return `$${min.toLocaleString()}+ ${currency}`
      if (max) return `Up to $${max.toLocaleString()} ${currency}`
    }
    return null
  }

  const formatDate = (date?: string) => {
    if (!date) return 'Recently posted'
    try {
      const posted = new Date(date)
      const now = new Date()
      const days = Math.floor((now.getTime() - posted.getTime()) / (1000 * 60 * 60 * 24))

      if (days === 0) return 'Today'
      if (days === 1) return 'Yesterday'
      if (days < 7) return `${days} days ago`
      if (days < 30) return `${Math.floor(days / 7)} weeks ago`
      return `${Math.floor(days / 30)} months ago`
    } catch {
      return 'Recently posted'
    }
  }

  return (
    <div className="card p-6 hover:shadow-md transition-shadow group">
      {/* Header with Company and Source */}
      <div className="flex items-start justify-between mb-3 gap-4">
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide">{job.company}</p>
          <h3 className="text-lg font-bold text-gray-900 mt-1 group-hover:text-brand transition-colors line-clamp-2">
            {job.title}
          </h3>
        </div>
        <button
          onClick={handleSave}
          disabled={isSaveLoading || isLoading}
          className="flex-shrink-0 text-2xl hover:scale-110 transition-transform disabled:opacity-50 disabled:cursor-not-allowed"
          title={isSaved ? 'Unsave job' : 'Save job'}
        >
          {isSaved ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Job Details */}
      <div className="flex flex-wrap gap-4 mb-4 text-sm">
        {job.location && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>📍</span>
            <span className="line-clamp-1">{job.location}</span>
          </div>
        )}
        {formatSalary(job.salary) && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>💰</span>
            <span>{formatSalary(job.salary)}</span>
          </div>
        )}
        {job.jobType && (
          <div className="flex items-center gap-1 text-gray-600">
            <span>⏰</span>
            <span className="capitalize">{job.jobType}</span>
          </div>
        )}
        <div className="flex items-center gap-1 text-gray-500 ml-auto">
          <span>🕐</span>
          <span className="text-xs">{formatDate(job.postedDate)}</span>
        </div>
      </div>

      {/* Description */}
      {job.description && (
        <p className="text-sm text-gray-600 mb-4 line-clamp-2">
          {job.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2">
          <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${sourceColor.bg} ${sourceColor.text}`}>
            {sourceColor.icon} {job.source}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Link
            href={job.jobUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-gray-500 hover:text-gray-700 text-sm hover:underline"
          >
            View Job →
          </Link>
          {applySuccess ? (
            <span className="text-green-600 text-sm font-semibold flex items-center gap-1">
              ✓ Added to applications
            </span>
          ) : (
            <button
              onClick={handleApply}
              disabled={isApplyLoading}
              className="bg-green-600 text-white px-3 py-1.5 rounded-lg font-semibold text-sm hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              title="Add to your applications list"
            >
              {isApplyLoading ? '…' : '+ Apply'}
            </button>
          )}
          <button
            onClick={handleApplimatic}
            className="bg-brand text-white px-4 py-1.5 rounded-lg font-semibold text-sm hover:bg-blue-700 transition-colors"
          >
            ✨ Applimatic Me
          </button>
        </div>
      </div>
    </div>
  )
}
