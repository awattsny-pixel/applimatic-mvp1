'use client'

import { useState } from 'react'
import SearchForm from './components/SearchForm'
import SearchResults from './components/SearchResults'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

interface SearchFilters {
  query: string
  location?: string
  minSalary?: number
  maxSalary?: number
  experience?: string
  workType?: 'remote' | 'hybrid' | 'in-person' | ''
  postedWithin?: '24h' | '7d' | '30d' | ''
  employmentTypes?: string[]
  page?: number
}

export default function SearchPage() {
  const [results, setResults] = useState<UnifiedJob[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [sourceBreakdown, setSourceBreakdown] = useState<Record<string, { count: number; error: string | null }>>({})
  const [hasSearched, setHasSearched] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [lastFilters, setLastFilters] = useState<SearchFilters | null>(null)
  const [hasMore, setHasMore] = useState(true)

  const handleSearch = async (filters: SearchFilters) => {
    if (!filters.query.trim()) {
      setError('Please enter a search query')
      return
    }

    setLoading(true)
    setLoadingMore(false)
    setError(null)
    setSearchQuery(filters.query)
    setHasSearched(true)
    setCurrentPage(1)
    setLastFilters({ ...filters, page: 1 })
    setResults([])
    setHasMore(true)

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...filters, page: 1 }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch jobs')
      }

      const data = await response.json()

      if (data.status === 'error') {
        setError(data.message || 'Failed to search for jobs')
        setResults([])
        setSourceBreakdown({})
        setHasMore(false)
      } else {
        setResults(data.jobs || [])
        setSourceBreakdown(
          data.sources_info ||
          Object.fromEntries(data.source_summary?.map((s: any) => [s.source, { count: s.count, error: s.error }]) || [])
        )
        // If fewer than 20 results, no more pages available
        setHasMore((data.jobs || []).length >= 20)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
      setResults([])
      setSourceBreakdown({})
      setHasMore(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadMore = async () => {
    if (!lastFilters || loadingMore || !hasMore) return

    setLoadingMore(true)
    const nextPage = currentPage + 1

    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...lastFilters, page: nextPage }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch more jobs')
      }

      const data = await response.json()

      if (data.status === 'error') {
        setError('Failed to load more results')
        setHasMore(false)
      } else {
        const newJobs = data.jobs || []
        setResults([...results, ...newJobs])
        setCurrentPage(nextPage)
        setLastFilters({ ...lastFilters, page: nextPage })
        // If fewer than 20 results, no more pages available
        setHasMore(newJobs.length >= 20)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load more results')
      setHasMore(false)
    } finally {
      setLoadingMore(false)
    }
  }

  return (
    <div className="max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-black text-gray-900">Find Your Next Job</h1>
        <p className="text-gray-500 mt-2">Search across multiple job platforms instantly.</p>
      </div>

      {/* Search Form */}
      <SearchForm onSearch={handleSearch} isLoading={loading} />

      {/* Error Message */}
      {error && (
        <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl text-red-700 text-sm">
          {error}
        </div>
      )}

      {/* Search Results */}
      {hasSearched && (
        <>
          <SearchResults
            jobs={results}
            loading={loading}
            sourceBreakdown={sourceBreakdown}
            query={searchQuery}
          />

          {/* Load More Button */}
          {results.length > 0 && hasMore && (
            <div className="mt-8 text-center">
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="px-8 py-3 bg-brand text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                {loadingMore ? (
                  <span className="flex items-center justify-center gap-2">
                    <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                    Loading more...
                  </span>
                ) : (
                  `Load more (Page ${currentPage + 1})`
                )}
              </button>
            </div>
          )}

          {/* No more results */}
          {results.length > 0 && !hasMore && (
            <div className="mt-8 p-4 bg-blue-50 border border-blue-200 rounded-xl text-blue-700 text-sm text-center">
              You've reached the end of available results ({results.length} total)
            </div>
          )}
        </>
      )}

      {/* Empty State */}
      {!hasSearched && (
        <div className="mt-12 text-center py-12">
          <div className="text-5xl mb-4">🔍</div>
          <p className="text-gray-500 text-lg">Start searching to see job opportunities</p>
          <p className="text-gray-400 text-sm mt-2">We search across Indeed, LinkedIn, Glassdoor, and more</p>
        </div>
      )}
    </div>
  )
}
