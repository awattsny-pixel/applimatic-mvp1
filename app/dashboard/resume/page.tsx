'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import ResomeUploadForm from '@/components/ResomeUploadForm'
import ResomeList from '@/components/ResomeList'

export default function ResumePage() {
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const getUser = async () => {
      const supabase = createClient()
      const { data: { user } } = await supabase.auth.getUser()
      setUser(user)
      setLoading(false)
    }
    getUser()
  }, [])

  if (loading) {
    return <div className="p-8 text-center text-gray-500">Loading...</div>
  }

  if (!user) {
    return <div className="p-8 text-center text-red-500">Please log in to manage your resumes</div>
  }

  const [refreshKey, setRefreshKey] = useState(0)

  return (
    <div className="max-w-4xl mx-auto p-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Resume Manager</h1>

      <div className="grid grid-cols-1 gap-8">
        <div>
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Resume</h2>
            <ResomeUploadForm onUploadSuccess={() => setRefreshKey(k => k + 1)} />
          </div>
          <div>
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Resumes</h2>
            <ResomeList key={refreshKey} />
          </div>
        </div>
      </div>
    </div>
  )
}
