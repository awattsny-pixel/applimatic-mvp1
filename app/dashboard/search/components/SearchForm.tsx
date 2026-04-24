'use client'

import { useState } from 'react'

interface SearchFilters {
  query: string
  location?: string
  minSalary?: number
  maxSalary?: number
  experience?: string
  workType?: 'remote' | 'hybrid' | 'in-person' | ''
  postedWithin?: '24h' | '7d' | '30d' | ''
  employmentTypes?: string[]
}

interface SearchFormProps {
  onSearch: (filters: SearchFilters) => void
  isLoading: boolean
}

export default function SearchForm({ onSearch, isLoading }: SearchFormProps) {
  const [filters, setFilters] = useState<SearchFilters>({
    query: '',
    location: '',
    minSalary: undefined,
    maxSalary: undefined,
    experience: '',
    workType: '',
    postedWithin: '',
    employmentTypes: [],
  })
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (filters.query.trim()) {
      onSearch(filters)
    }
  }

  const popularQueries = ['Software Engineer', 'Product Manager', 'Data Scientist', 'DevOps Engineer', 'UX Designer']

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Main Search Input */}
      <div className="relative">
        <input
          type="text"
          value={filters.query}
          onChange={(e) => setFilters({ ...filters, query: e.target.value })}
          placeholder="Search by job title, skills, or company..."
          disabled={isLoading}
          className="w-full px-6 py-4 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-brand focus:border-transparent text-gray-900 placeholder-gray-400 disabled:bg-gray-50 disabled:cursor-not-allowed transition-all"
        />
        <button
          type="submit"
          disabled={isLoading}
          className="absolute right-3 top-1/2 -translate-y-1/2 bg-brand text-white px-6 py-2 rounded-lg font-semibold hover:bg-blue-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed"
        >
          {isLoading ? (
            <span className="flex items-center gap-2">
              <span className="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
              Searching...
            </span>
          ) : (
            'Search'
          )}
        </button>
      </div>

      {/* Popular Searches */}
      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide self-center">Popular:</span>
        {popularQueries.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => {
              setFilters({ ...filters, query: q })
              onSearch({ ...filters, query: q })
            }}
            disabled={isLoading}
            className="text-xs bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded-full transition-colors disabled:cursor-not-allowed disabled:opacity-50"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Toggle Advanced Filters */}
      <button
        type="button"
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-sm text-brand font-semibold hover:underline flex items-center gap-1"
      >
        {showAdvanced ? '✕ Hide' : '⚙️ Show'} advanced filters
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="card p-6 bg-gray-50 border-2 border-gray-200 space-y-4">
          {/* Location */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📍 Location</label>
            <input
              type="text"
              placeholder="e.g., San Francisco, CA or Remote"
              value={filters.location || ''}
              onChange={(e) => setFilters({ ...filters, location: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-gray-900"
            />
          </div>

          {/* Salary Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">💰 Min Salary</label>
              <input
                type="number"
                placeholder="e.g., 80000"
                value={filters.minSalary || ''}
                onChange={(e) => setFilters({ ...filters, minSalary: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-gray-900"
              />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">Max Salary</label>
              <input
                type="number"
                placeholder="e.g., 150000"
                value={filters.maxSalary || ''}
                onChange={(e) => setFilters({ ...filters, maxSalary: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-gray-900"
              />
            </div>
          </div>

          {/* Experience Level */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📚 Experience Level</label>
            <select
              value={filters.experience || ''}
              onChange={(e) => setFilters({ ...filters, experience: e.target.value })}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand text-gray-900"
            >
              <option value="">Any level</option>
              <option value="entry">Entry-level</option>
              <option value="junior">Junior</option>
              <option value="mid">Mid-Level</option>
              <option value="senior">Senior</option>
              <option value="manager">Manager</option>
              <option value="director">Director</option>
              <option value="executive">Executive</option>
            </select>
          </div>

          {/* Posted Within */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">📅 Posted Within</label>
            <div className="space-y-2">
              {[
                { value: '24h', label: 'Past 24 hours' },
                { value: '7d', label: 'Past week' },
                { value: '30d', label: 'Past month' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="radio"
                    name="posted"
                    value={option.value}
                    checked={filters.postedWithin === option.value}
                    onChange={(e) => setFilters({ ...filters, postedWithin: e.target.value as '24h' | '7d' | '30d' })}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="radio"
                  name="posted"
                  value=""
                  checked={filters.postedWithin === ''}
                  onChange={() => setFilters({ ...filters, postedWithin: '' })}
                  className="w-4 h-4"
                />
                <span className="text-gray-700">Any time</span>
              </label>
            </div>
          </div>

          {/* Employment Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">💼 Employment Type</label>
            <div className="space-y-2">
              {[
                { value: 'full-time', label: 'Full-time' },
                { value: 'part-time', label: 'Part-time' },
                { value: 'contract', label: 'Contract' },
                { value: 'internship', label: 'Internship' },
                { value: 'volunteer', label: 'Volunteer' },
              ].map((option) => (
                <label key={option.value} className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    value={option.value}
                    checked={filters.employmentTypes?.includes(option.value) || false}
                    onChange={(e) => {
                      const newTypes = filters.employmentTypes || [];
                      if (e.target.checked) {
                        setFilters({ ...filters, employmentTypes: [...newTypes, option.value] })
                      } else {
                        setFilters({ ...filters, employmentTypes: newTypes.filter(t => t !== option.value) })
                      }
                    }}
                    className="w-4 h-4"
                  />
                  <span className="text-gray-700">{option.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Work Type */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">🏢 Work Arrangement</label>
            <div className="flex gap-3">
              {[
                { value: 'remote' as const, label: '🏠 Remote' },
                { value: 'hybrid' as const, label: '🔄 Hybrid' },
                { value: 'in-person' as const, label: '🏢 In-Person' },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setFilters({ ...filters, workType: filters.workType === option.value ? '' : option.value })}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filters.workType === option.value
                      ? 'bg-brand text-white'
                      : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Info */}
      <p className="text-xs text-gray-400 mt-3">
        💡 Searches multiple job boards simultaneously. Results appear as they're found.
      </p>
    </form>
  )
}
