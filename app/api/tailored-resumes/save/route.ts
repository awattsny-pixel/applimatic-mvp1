import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SaveTailoredResumeRequest {
  applicationId: string
  companyName: string
  jobTitle: string
  jobDescription: string
  tailoredContent: any // The TailorResult from Claude API
  coverLetter: string
  atsScore: number
}

export async function POST(request: Request) {
  try {
    const body = await request.json() as SaveTailoredResumeRequest

    // Get the user from the Authorization header
    const authHeader = request.headers.get('authorization')
    console.log('[save-resume] Auth header:', authHeader ? 'present' : 'missing')
    if (!authHeader) {
      console.error('[save-resume] Missing authorization header')
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Decode JWT to get user ID
    let userId: string
    try {
      const parts = token.split('.')
      if (parts.length !== 3) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid token format' },
          { status: 401 }
        )
      }
      const decoded = JSON.parse(atob(parts[1]))
      userId = decoded.sub
      if (!userId) {
        return NextResponse.json(
          { status: 'error', message: 'Invalid token' },
          { status: 401 }
        )
      }
    } catch (err) {
      return NextResponse.json(
        { status: 'error', message: 'Invalid token' },
        { status: 401 }
      )
    }

    // Save tailored resume record to database
    const { data: savedResume, error: insertError } = await supabase
      .from('tailored_outputs')
      .insert({
        user_id: userId,
        company_name: body.companyName,
        job_title: body.jobTitle,
        job_description: body.jobDescription,
        cover_letter: body.coverLetter,
        ats_score: body.atsScore,
        analysis: body.tailoredContent?.analysis ?? null,
        tailored_sections: body.tailoredContent?.tailored_sections ?? [],
        top_changes: body.tailoredContent?.top_changes ?? [],
        key_matches: body.tailoredContent?.key_matches ?? [],
        key_gaps: body.tailoredContent?.key_gaps ?? [],
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to save tailored resume:', insertError)
      return NextResponse.json(
        { status: 'error', message: 'Failed to save tailored resume' },
        { status: 500 }
      )
    }

    // Return the saved record with download info
    return NextResponse.json({
      status: 'success',
      resumeId: savedResume.id,
      message: 'Tailored resume saved successfully',
      downloadUrl: `/api/tailored-resumes/${savedResume.id}/download`,
    })
  } catch (error) {
    console.error('Save tailored resume error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to save tailored resume',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
