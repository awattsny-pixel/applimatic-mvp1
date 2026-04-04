'use client'

import { useState, useRef } from 'react'
import { createClient } from '@/lib/supabase/client'
import { extractTextFromFile } from '@/lib/actions/extractText'

export default function ResomeUploadForm({ onUploadSuccess }: { onUploadSuccess: () => void }) {
  const [isDragging, setIsDragging] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const supabase = createClient()

  const ALLOWED_TYPES = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ]
  const MAX_FILE_SIZE = 5 * 1024 * 1024

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }

  const handleDragLeave = () => {
    setIsDragging(false)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    if (e.dataTransfer.files.length) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.length) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    setError(null)
    setIsLoading(true)

    try {
      if (!ALLOWED_TYPES.includes(file.type)) {
        setError('Please upload a PDF or Word document (.docx or .doc)')
        setIsLoading(false)
        return
      }

      if (file.size > MAX_FILE_SIZE) {
        setError('File size must be less than 5MB')
        setIsLoading(false)
        return
      }

      const { data: { user } } = await supabase.auth.getUser()
      if (!user) {
        setError('You must be logged in to upload a resume')
        setIsLoading(false)
        return
      }

      let extractedText: string
      try {
        const arrayBuffer = await file.arrayBuffer()
        extractedText = await extractTextFromFile(arrayBuffer, file.type)
      } catch (extractError: any) {
        setError(extractError.message || 'Failed to extract text from file')
        setIsLoading(false)
        return
      }

      const fileName = `${user.id}/${Date.now()}-${file.name}`
      const { error: uploadError } = await supabase.storage
        .from('resumes')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'application/octet-stream'
        })

      if (uploadError) {
        setError('Failed to upload file. Please try again.')
        setIsLoading(false)
        return
      }

      const { data: { publicUrl } } = supabase.storage
        .from('resumes')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('resumes')
        .insert([{
          user_id: user.id,
          file_url: publicUrl,
          file_name: file.name,
          content_text: extractedText,
          is_primary: false,
          created_at: new Date().toISOString()
        }])

      if (dbError) {
        setError('Failed to save resume information. Please try again.')
        setIsLoading(false)
        return
      }

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
      onUploadSuccess()
      setIsLoading(false)
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload')
      setIsLoading(false)
    }
  }

  return (
    <div className="w-full">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
          isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 bg-gray-50 hover:border-gray-400'
        } ${isLoading ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf,.docx,.doc"
          onChange={handleFileInput}
          disabled={isLoading}
          className="hidden"
          id="resume-upload"
        />
        <label htmlFor="resume-upload" className="cursor-pointer">
          <div className="text-gray-600">
            <div className="text-lg font-semibold mb-2">
              {isLoading ? 'Uploading...' : 'Drag and drop your resume'}
            </div>
            <div className="text-sm text-gray-500">
              or click to browse (PDF or Word, max 5MB)
            </div>
          </div>
        </label>
      </div>

      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded text-red-700 text-sm">
          {error}
        </div>
      )}
    </div>
  )
}
