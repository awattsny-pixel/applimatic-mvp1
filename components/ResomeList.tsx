'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Resume {
  id: string
  file_name: string
  file_url: string
  is_primary: boolean
  created_at: string
}

export default function ResomeList() {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [user, setUser] = useState<any>(null)
  const supabase = createClient()

  useEffect(() => {
    const fetchResumes = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) {
          setError('Not authenticated')
          setLoading(false)
          return
        }
        setUser(user)
        const { data, error: fetchError } = await supabase
          .from('resumes')
          .select('id, file_name, file_url, is_primary, created_at')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
        if (fetchError) {
          setError('Failed to fetch resumes')
          setLoading(false)
          return
        }
        setResumes(data || [])
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'An error occurred')
        setLoading(false)
      }
    }
    fetchResumes()
  }, [])

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return
    try {
      const resume = resumes.find(r => r.id === id)
      if (!resume || !user) return
      const fileName = `${user.id}/${resume.file_name.split('/').pop()}`
      await supabase.storage.from('resumes').remove([fileName])
      const { error: dbError } = await supabase
        .from('resumes')
        .delete()
        .eq('id', id)
      if (dbError) {
        setError('Failed to delete resume')
        return
      }
      setResumes(resumes.filter(r => r.id !== id))
    } catch (err: any) {
      setError(err.message || 'Failed to delete resume')
    }
  }

  const handleSetPrimary = async (id: string) => {
    try {
      if (!user) return
      await supabase
        .from('resumes')
        .update({ is_primary: false })
        .eq('user_id', user.id)
      const { error: updateError } = await supabase
        .from('resumes')
        .update({ is_primary: true })
        .eq('id', id)
      if (updateError) {
        setError('Failed to set primary resume')
        return
      }
      setResumes(resumes.map(r => ({
        ...r,
        is_primary: r.id === id
      })))
    } catch (err: any) {
      setError(err.message || 'Failed to set primary resume')
    }
  }

  if (loading) {
    return <div className="text-gray-500">Loading resumes...</div>
  }

  if (error) {
    return <div className="text-red-500">{error}</div>
  }

  if (resumes.length === 0) {
    return <div className="text-gray-500">No resumes uploaded yet</div>
  }

  return (
    <div className="space-y-4">
      {resumes.map(resume => (
        <div
          key={resume.id}
          className="flex items-center justify-between p-4 border rounded-lg bg-white hover:bg-gray-50"
        >
          <div className="flex-1">
            <div className="font-medium text-gray-900">{resume.file_name}</div>
            <div className="text-sm text-gray-500">
              Uploaded {new Date(resume.created_at).toLocaleDateString()}
            </div>
            {resume.is_primary && (
              <div className="text-xs mt-1 inline-block px-2 py-1 bg-blue-100 text-blue-800 rounded">
                Primary
              </div>
            )}
          </div>
          <div className="flex gap-2">
            
<a              href={resume.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              View
            </a>
            {!resume.is_primary && (
              <button
                onClick={() => handleSetPrimary(resume.id)}
                className="px-3 py-2 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300"
              >
                Set Primary
              </button>
            )}
            <button
              onClick={() => handleDelete(resume.id)}
              className="px-3 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
