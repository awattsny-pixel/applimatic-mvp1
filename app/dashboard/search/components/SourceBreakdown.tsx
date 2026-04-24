'use client'

interface SourceBreakdownProps {
  breakdown: Record<string, { count: number; error: string | null }>
}

const SOURCE_INFO = {
  Indeed: { emoji: '🔵', color: 'blue' },
  RapidAPI: { emoji: '⚡', color: 'purple' },
  Glassdoor: { emoji: '💼', color: 'green' },
  LinkedIn: { emoji: '🔗', color: 'gray' },
  Mock: { emoji: '⭐', color: 'yellow' },
}

export default function SourceBreakdown({ breakdown }: SourceBreakdownProps) {
  const colorClasses = {
    blue: 'bg-blue-50 border-blue-200',
    purple: 'bg-purple-50 border-purple-200',
    green: 'bg-green-50 border-green-200',
    gray: 'bg-gray-50 border-gray-200',
    yellow: 'bg-yellow-50 border-yellow-200',
  }

  const getColorClasses = (color: string) => colorClasses[color as keyof typeof colorClasses] || colorClasses.gray

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 p-4 bg-gray-50 rounded-xl border border-gray-200">
      {Object.entries(breakdown)
        .sort(([, a], [, b]) => b.count - a.count)
        .map(([source, data]) => {
          const info = SOURCE_INFO[source as keyof typeof SOURCE_INFO]
          const color = info?.color || 'gray'

          return (
            <div
              key={source}
              className={`p-3 rounded-lg border ${getColorClasses(color)} text-center`}
            >
              <div className="text-2xl mb-1">{info?.emoji || '📌'}</div>
              <p className="text-xs font-semibold text-gray-700">{source}</p>
              <p className="text-lg font-bold text-gray-900 mt-1">{data.count}</p>
              {data.error && (
                <p className="text-xs text-red-600 mt-1">Error: {data.error.split(':')[0]}</p>
              )}
            </div>
          )
        })}
    </div>
  )
}
