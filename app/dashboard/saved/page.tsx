'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'
import JobCard from '../search/components/JobCard'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

interface SavedJob {
  id: string
  job_id: string
  job_title: string
  company: string
  location: string
  job_url: string
  job_description: string
  salary: any
  job_type: string
  source: string
  posted_date: string
  saved_at: string
  notes: string | null
}

export default function SavedJobsPage() {
  const supabase = createClient()
  const [savedJobs, setSavedJobs] = useState<UnifiedJob[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)

  useEffect(() => {
    const fetchSavedJobs = async () => {
      // Get the user
      const { data: { user: authUser } } = await supabase.auth.getUser()
      if (!authUser) {
        setLoading(false)
        return
      }

      setUser(authUser)

      try {
        const { data, error: fetchError } = await supabase
          .from('saved_jobs')
          .select('*')
          .eq('user_id', authUser.id)
          .order('saved_at', { ascending: false })

        if (fetchError) {
          throw fetchError
        }

        // Convert saved_jobs table rows to UnifiedJob format
        const jobs: UnifiedJob[] = (data as SavedJob[]).map((saved) => ({
          id: saved.job_id,
          title: saved.job_title,
          company: saved.company,
          location: saved.location,
          jobUrl: saved.job_url,
          source: (saved.source as any) || 'mock',
          description: saved.job_description,
          salary: saved.salary,
          jobType: saved.job_type,
          postedDate: saved.posted_date,
        }))

        setSavedJobs(jobs)
      } catch (err) {
        console.error('Failed to fetch saved jobs:', err)
        setError('Failed to load saved jobs')
      } finally {
        setLoading(false)
      }
    }

    fetchSavedJobs()
  }, [])

  if (loading) {
    return (
      <div className="max-w-6xl">
        <div className="mt-12 text-center py-12">
          <div className="text-5xl mb-4">⏳</div>
          <p className="text-gray-500">Loading your saved jobs...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="max-w-6xl">
        <div className="mt-12 text-center py-12">
          <div className="text-5xl mb-4">🔒</div>
          <p className="text-gray-700 text-lg font-medium">Please sign in to view your saved jobs</p>
          <p className="text-gray-500 text-sm mt-2">
            <a href="/login" className="text-brand hover:underline font-semibold">Sign in here</a>
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Saved Jobs</h1>
        <p className="text-gray-500 mt-2">Jobs you've bookmarked for later. ({savedJobs.length} total)</p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}


      {/* Saved Jobs Grid */}
      {savedJobs.length > 0 && (
        <div className="space-y-4">
          {savedJobs.map((job) => (
            <JobCard key={`${job.id}-${job.source}`} job={job} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {savedJobs.length === 0 && (
        <div className="mt-12 text-center py-12">
          <div className="text-5xl mb-4">📭</div>
          <p className="text-gray-500 text-lg">No saved jobs yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Start saving jobs from{' '}
            <a href="/dashboard/search" className="text-brand hover:underline font-semibold">
              search results
            </a>
            {' '}to keep track of opportunities.
          </p>
        </div>
      )}
    </div>
  )
}
