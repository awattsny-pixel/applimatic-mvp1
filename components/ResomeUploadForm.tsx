'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'

interface ResomeUploadFormProps {
  userId: string
  onUploadSuccess: () => void
}

export default function ResomeUploadForm({ userId, onUploadSuccess }: ResomeUploadFormProps) {
  const [isDragging, setIsDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(e.type === 'dragenter' || e.type === 'dragover')
  }

  const handleFile = async (file: File) => {
    setError(null)
    setSuccess(false)

    const maxSize = 5 * 1024 * 1024
    const allowedTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']

    if (!allowedTypes.includes(file.type)) {
      setError('Only PDF and Word documents are allowed')
      return
    }

    if (file.size > maxSize) {
      setError('File size must be less than 5MB')
      return
    }

    try {
      setUploading(true)

      const fileName = `${userId}/${Date.now()}-${file.name}`
      const { data, error: uploadError } = await supabase.storage.from('resumes').upload(fileName, file, { cacheControl: '3600', upsert: false })

      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`)
        console.error('Storage error:', uploadError)
        return
      }

      const { data: { publicUrl } } = supabase.storage.from('resumes').getPublicUrl(fileName)

      const { error: dbError } = await supabase.from('resumes').insert([{
        user_id: userId,
        file_url: publicUrl,
        file_name: file.name,
        is_primary: false,
        created_at: new Date().toISOString(),
      }])

      if (dbError) {
        setError(`Database error: ${dbError.message}`)
        console.error('Database error:', dbError)
        return
      }

      setSuccess(true)
      if (fileInputRef.current) fileInputRef.current.value = ''
      onUploadSuccess()
      setTimeout(() => setSuccess(false), 3000)
    } catch (err) {
      setError('An unexpected error occurred')
      console.error(err)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    handleDrag(e)
    const files = e.dataTransfer.files
    if (files.length > 0) handleFile(files[0])
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files
    if (files && files.length > 0) handleFile(files[0])
  }

  return (
    <div className="w-full">
      {error && <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg"><p className="text-red-800 text-sm">{error}</p></div>}
      {success && <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg"><p className="text-green-800 text-sm">Resume uploaded successfully!</p></div>}
      <div onDragEnter={handleDrag} onDragLeave={handleDrag} onDragOver={handleDrag} onDrop={handleDrop} className={`relative border-2 border-dashed rounded-lg p-8 text-center transition ${isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50'} ${uploading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}>
        <input ref={fileInputRef} type="file" onChange={handleFileSelect} disabled={uploading} className="hidden" accept=".pdf,.doc,.docx" />
        <button type="button" onClick={() => fileInputRef.current?.click()} disabled={uploading} className="focus:outline-none">
          <div className="flex flex-col items-center justify-center">
            <svg className="w-12 h-12 text-gray-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
            <p className="text-lg font-medium text-gray-700">{uploading ? 'Uploading...' : 'Drag and drop your resume'}</p>
            <p className="text-sm text-gray-500 mt-1">or click to select a file</p>
            <p className="text-xs text-gray-400 mt-2">PDF or Word documents (max 5MB)</p>
          </div>
        </button>
      </div>
    </div>
  )
}
