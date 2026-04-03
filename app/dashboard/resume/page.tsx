'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'
import { User } from '@supabase/supabase-js'
import ResomeUploadForm from '@/components/ResomeUploadForm'
import ResomeList from '@/components/ResomeList'

export default function ResomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const supabase = createClient()
    const getUser = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setUser(user)
      } catch (err) {
        setError('Failed to load user')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    getUser()
  }, [])

  if (loading) return <div className="flex justify-center items-center min-h-screen"><p className="text-gray-500">Loading...</p></div>
  if (!user) return <div className="flex justify-center items-center min-h-screen"><p className="text-red-500">Please log in to manage your resumes</p></div>

  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-8 border-b border-gray-200">
            <h1 className="text-3xl font-bold text-gray-900">My Resumes</h1>
            <p className="mt-2 text-gray-600">Upload and manage your professional resumes</p>
          </div>
          <div className="p-6">
            {error && <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-800">{error}</p></div>}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Upload New Resume</h2>
              <ResomeUploadForm userId={user.id} onUploadSuccess={() => {}} />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Resumes</h2>
              <ResomeList userId={user.id} />
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
