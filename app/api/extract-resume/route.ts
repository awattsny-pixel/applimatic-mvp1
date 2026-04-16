// app/api/extract-resume/route.ts
// ============================================================
//  Called after a resume file is uploaded to Supabase Storage.
//  Downloads the file, extracts the plain text, and saves it
//  to the resumes table so the AI can read it.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export const maxDuration = 30

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })

    const { resumeId, fileUrl, fileName } = await request.json()

    // ── Download the file from Supabase Storage ────────────
    const fileExt = fileName.split('.').pop()?.toLowerCase()

    // Build the storage path: userId/master-resume.pdf (or .docx)
    const storagePath = `${user.id}/master-resume.${fileExt}`

    const { data: fileData, error: downloadError } = await supabase.storage
      .from('resumes')
      .download(storagePath)

    if (downloadError || !fileData) {
      return NextResponse.json({ error: 'Could not download file for processing.' }, { status: 500 })
    }

    // ── Extract text based on file type ───────────────────
    let extractedText = ''

    const buffer = Buffer.from(await fileData.arrayBuffer())

    if (fileExt === 'pdf') {
      // Dynamic import to avoid bundling issues
      const pdfParse = (await import('pdf-parse/lib/pdf-parse.js')).default
      const pdfData  = await pdfParse(buffer)
      extractedText  = pdfData.text
    } else if (fileExt === 'docx') {
      const mammoth  = await import('mammoth')
      const result   = await mammoth.extractRawText({ buffer })
      extractedText  = result.value
    } else {
      return NextResponse.json({ error: 'Unsupported file type. Please upload a PDF or .docx file.' }, { status: 400 })
    }

    // ── Clean up the extracted text ────────────────────────
    extractedText = extractedText
      .replace(/\r\n/g, '\n')        // normalize line endings
      .replace(/\n{3,}/g, '\n\n')    // collapse excessive blank lines
      .replace(/[ \t]{2,}/g, ' ')    // collapse multiple spaces
      .trim()

    if (extractedText.length < 100) {
      return NextResponse.json(
        { error: 'Could not read enough text from this file. Try saving your resume as a plain .docx or a text-based PDF.' },
        { status: 400 }
      )
    }

    // ── Save extracted text to the resumes table ───────────
    const { error: updateError } = await supabase
      .from('resumes')
      .update({ content_text: extractedText })
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })

    if (updateError) {
      console.error('Failed to save extracted text:', updateError)
    }

    return NextResponse.json({
      success:       true,
      wordCount:     extractedText.split(/\s+/).length,
      previewText:   extractedText.slice(0, 300) + '…',
    })

  } catch (error: any) {
    console.error('Extract resume error:', error)
    return NextResponse.json({ error: 'Text extraction failed. Please try uploading again.' }, { status: 500 })
  }
}
