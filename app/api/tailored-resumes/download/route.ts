import { NextResponse } from 'next/server'
import { generateResumeDocx } from '@/lib/utils/generateDocx'

export async function POST(request: Request) {
  try {
    console.log('[download] Request received')
    const body = await request.json()
    const { mergedResume, companyName, jobTitle } = body
    console.log('[download] Body parsed:', { companyName, jobTitle, resumeLength: mergedResume?.length })

    if (!mergedResume) {
      console.error('[download] No merged resume provided')
      return NextResponse.json(
        { error: 'Missing merged resume content' },
        { status: 400 }
      )
    }

    // Generate DOCX file from resume text
    console.log('[download] Generating DOCX...')
    const docxBuffer = await generateResumeDocx(
      mergedResume,
      `${companyName || 'Resume'} - ${jobTitle || 'Tailored'}`
    )
    console.log('[download] DOCX generated, size:', docxBuffer.length, 'bytes')

    const filename = `${companyName || 'Resume'}_${jobTitle || 'Tailored'}.docx`
    console.log('[download] Returning file:', filename)

    return new NextResponse(docxBuffer, {
      headers: {
        'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    })
  } catch (error) {
    console.error('[download] Error:', error)
    console.error('[download] Error details:', error instanceof Error ? error.stack : String(error))
    return NextResponse.json(
      {
        error: 'Failed to download resume',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
