'use client'

import JobCard from './JobCard'
import SourceBreakdown from './SourceBreakdown'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

interface SearchResultsProps {
  jobs: UnifiedJob[]
  loading: boolean
  sourceBreakdown: Record<string, { count: number; error: string | null }>
  query: string
}

export default function SearchResults({
  jobs,
  loading,
  sourceBreakdown,
  query,
}: SearchResultsProps) {
  return (
    <div className="mt-8 space-y-6">
      {/* Results Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-gray-900">
            {loading ? 'Searching...' : `${jobs.length} ${jobs.length === 1 ? 'job' : 'jobs'} found`}
          </h2>
          {!loading && jobs.length > 0 && (
            <p className="text-sm text-gray-500 mt-1">for "{query}"</p>
          )}
        </div>
      </div>

      {/* Source Breakdown */}
      {!loading && Object.keys(sourceBreakdown).length > 0 && (
        <SourceBreakdown breakdown={sourceBreakdown} />
      )}

      {/* Loading State */}
      {loading && (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="card p-6 animate-pulse">
              <div className="h-4 bg-gray-200 rounded w-3/4 mb-3"></div>
              <div className="h-3 bg-gray-100 rounded w-1/2 mb-4"></div>
              <div className="h-3 bg-gray-100 rounded w-full mb-2"></div>
              <div className="h-3 bg-gray-100 rounded w-5/6"></div>
            </div>
          ))}
        </div>
      )}

      {/* Job Results */}
      {!loading && jobs.length > 0 && (
        <div className="space-y-4">
          {jobs.map((job) => (
            <JobCard key={job.id} job={job} />
          ))}
        </div>
      )}

      {/* Empty State */}
      {!loading && jobs.length === 0 && (
        <div className="card p-12 text-center">
          <div className="text-4xl mb-4">😞</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
          <p className="text-gray-500">Try adjusting your search terms or check back later for new opportunities.</p>
        </div>
      )}
    </div>
  )
}
