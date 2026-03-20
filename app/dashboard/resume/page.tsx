'use client'

import { useState, useEffect, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

type Resume = {
  id: string
  file_name: string
  file_url: string
  file_size: number
  created_at: string
}

export default function ResumePage() {
  const [resume, setResume]       = useState<Resume | null>(null)
  const [uploading, setUploading] = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState('')
  const fileRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  // Load existing resume on mount
  useEffect(() => {
    async function loadResume() {
      const { data: { user } } = await supabase.auth.getUser()
      if (!user) return

      const { data } = await supabase
        .from('resumes')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single()

      if (data) setResume(data)
    }
    loadResume()
  }, [])

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!['application/pdf', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(file.type)) {
      setError('Please upload a PDF or Word (.docx) file.')
      return
    }

    // Validate file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      setError('File must be under 5MB.')
      return
    }

    setUploading(true)
    setError('')
    setSuccess('')

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    const fileExt  = file.name.split('.').pop()
    const filePath = `${user.id}/master-resume.${fileExt}`

    // Upload to Supabase Storage
    const { error: uploadError } = await supabase.storage
      .from('resumes')
      .upload(filePath, file, { upsert: true })

    if (uploadError) { setError(uploadError.message); setUploading(false); return }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('resumes')
      .getPublicUrl(filePath)

    // Save metadata to the resumes table (upsert = replace if exists)
    const { data: resumeData, error: dbError } = await supabase
      .from('resumes')
      .upsert({
        user_id:   user.id,
        file_name: file.name,
        file_url:  urlData.publicUrl,
        file_size: file.size,
      })
      .select()
      .single()

    if (dbError) { setError(dbError.message); setUploading(false); return }

    // ── Trigger text extraction so the AI can read the resume ──
    setSuccess('Uploading complete. Extracting text for AI…')
    try {
      const extractRes = await fetch('/api/extract-resume', {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resumeId: resumeData.id,
          fileUrl:  urlData.publicUrl,
          fileName: file.name,
        }),
      })
      const extractJson = await extractRes.json()
      if (!extractRes.ok) {
        setSuccess('Resume saved, but text extraction failed. Try re-uploading if tailoring doesn\'t work.')
      } else {
        setSuccess(`Resume ready! ${extractJson.wordCount?.toLocaleString()} words extracted. The AI can now tailor your applications.`)
      }
    } catch {
      setSuccess('Resume saved. Text extraction encountered an issue — try re-uploading if needed.')
    }

    setResume(resumeData)
    setUploading(false)
  }

  async function handleDelete() {
    if (!resume || !confirm('Remove your master resume? You can always upload a new one.')) return

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return

    await supabase.from('resumes').delete().eq('id', resume.id)
    setResume(null)
    setSuccess('Resume removed.')
  }

  function formatBytes(bytes: number) {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="max-w-xl">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-gray-900">Master Resume</h1>
        <p className="text-gray-500 mt-1">Upload your full resume once. We draw from it for every application.</p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-xl px-4 py-3 mb-4">
          {error}
        </div>
      )}
      {success && (
        <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-xl px-4 py-3 mb-4">
          ✓ {success}
        </div>
      )}

      {/* Current resume */}
      {resume ? (
        <div className="card p-6 mb-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center text-2xl flex-shrink-0">
              📄
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{resume.file_name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{formatBytes(resume.file_size)} · Uploaded {new Date(resume.created_at).toLocaleDateString()}</p>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <a
              href={resume.file_url}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-secondary text-sm"
            >
              View file ↗
            </a>
            <button
              onClick={() => fileRef.current?.click()}
              className="btn-primary text-sm"
            >
              Replace resume
            </button>
            <button onClick={handleDelete} className="btn-danger text-sm ml-auto">
              Remove
            </button>
          </div>
        </div>
      ) : (
        // Upload dropzone
        <div
          onClick={() => fileRef.current?.click()}
          className="card p-10 border-2 border-dashed border-gray-200 hover:border-brand cursor-pointer transition-all text-center group mb-6"
        >
          <div className="text-4xl mb-3 group-hover:scale-110 transition-transform">☁️</div>
          <p className="font-semibold text-gray-700 group-hover:text-brand transition-colors">
            {uploading ? 'Uploading…' : 'Click to upload your resume'}
          </p>
          <p className="text-sm text-gray-400 mt-1">PDF or Word (.docx) · Max 5MB</p>
        </div>
      )}

      {/* Hidden file input */}
      <input
        ref={fileRef}
        type="file"
        accept=".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        className="hidden"
        onChange={handleUpload}
        disabled={uploading}
      />

      {/* Tips */}
      <div className="card p-5 bg-blue-50 border-blue-100">
        <h3 className="font-semibold text-brand text-sm mb-3">💡 Tips for best results</h3>
        <ul className="space-y-2 text-sm text-gray-600">
          <li className="flex gap-2"><span className="text-accent">✓</span> Include every job you've had, not just recent ones — the AI picks the most relevant.</li>
          <li className="flex gap-2"><span className="text-accent">✓</span> Include all your skills, tools, and technologies.</li>
          <li className="flex gap-2"><span className="text-accent">✓</span> Add quantified achievements where possible (e.g. "Increased revenue by 30%").</li>
          <li className="flex gap-2"><span className="text-accent">✓</span> Don't worry about length — this is your master copy, not what gets sent.</li>
        </ul>
      </div>
    </div>
  )
}
