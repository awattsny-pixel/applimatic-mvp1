'use client'

import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase/client'

interface Resume {
  id: string
  user_id: string
  file_url: string
  file_name: string
  is_primary: boolean
  created_at: string
}

interface ResomeListProps {
  userId: string
}

export default function ResomeList({ userId }: ResomeListProps) {
  const [resumes, setResumes] = useState<Resume[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [updating, setUpdating] = useState<string | null>(null)

  const supabase = createClient()

  useEffect(() => {
    fetchResumes()
  }, [userId])

  const fetchResumes = async () => {
    try {
      setLoading(true)
      setError(null)
      const { data, error: fetchError } = await supabase.from('resumes').select('*').eq('user_id', userId).order('is_primary', { ascending: false }).order('created_at', { ascending: false })
      if (fetchError) {
        setError(`Failed to load resumes: ${fetchError.message}`)
        return
      }
      setResumes(data || [])
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (resumeId: string, fileName: string) => {
    if (!confirm('Are you sure you want to delete this resume?')) return
    try {
      setDeleting(resumeId)
      await supabase.storage.from('resumes').remove([fileName])
      const { error: dbError } = await supabase.from('resumes').delete().eq('id', resumeId).eq('user_id', userId)
      if (dbError) {
        setError(`Failed to delete resume: ${dbError.message}`)
        return
      }
      setResumes(resumes.filter((r) => r.id !== resumeId))
    } catch (err) {
      setError('Failed to delete resume')
      console.error(err)
    } finally {
      setDeleting(null)
    }
  }

  const handleSetPrimary = async (resumeId: string) => {
    try {
      setUpdating(resumeId)
      await supabase.from('resumes').update({ is_primary: false }).eq('user_id', userId)
      const { error } = await supabase.from('resumes').update({ is_primary: true }).eq('id', resumeId).eq('user_id', userId)
      if (error) {
        setError(`Failed to update resume: ${error.message}`)
        return
      }
      setResumes(resumes.map((r) => ({ ...r, is_primary: r.id === resumeId })))
    } catch (err) {
      setError('Failed to update resume')
      console.error(err)
    } finally {
      setUpdating(null)
    }
  }

  if (loading) return <div className="flex justify-center py-8"><p className="text-gray-500">Loading resumes...</p></div>
  if (error) return <div className="p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-800 text-sm">{error}</p></div>
  if (resumes.length === 0) return <div className="text-center py-12 bg-gray-50 rounded-lg border border-gray-200"><p className="text-gray-500">No resumes yet. Upload your first resume above.</p></div>

  return (
    <div className="space-y-4">
      {resumes.map((resume) => (
        <div key={resume.id} className={`flex items-center justify-between p-4 border rounded-lg transition ${resume.is_primary ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3">
              <svg className="w-5 h-5 text-gray-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">{resume.file_name}</p>
                <p className="text-xs text-gray-500">{new Date(resume.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {resume.is_primary && <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">Primary</span>}
            <div className="flex gap-2">
              {!resume.is_primary && (
                <button onClick={() => handleSetPrimary(resume.id)} disabled={updating === resume.id} className="text-xs px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition">
                  {updating === resume.id ? 'Setting...' : 'Set as Primary'}
                </button>
              )}
              <a href={resume.file_url} target="_blank" rel="noopener noreferrer" className="text-xs px-3 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition">
                View
              </a>
              <button onClick={() => handleDelete(resume.id, resume.file_name)} disabled={deleting === resume.id} className="text-xs px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 disabled:opacity-50 transition">
                {deleting === resume.id ? 'Deleting...' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
