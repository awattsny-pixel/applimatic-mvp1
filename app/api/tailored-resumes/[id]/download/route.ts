import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(
  request: Request,
{ params }: { params: Promise<{ id: string }> }
) {
  try {
const resumeId = (await params).id

    // Get the user from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: userData, error: authError } = await supabase.auth.getUser(token)

    if (authError || !userData.user) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const userId = userData.user.id

    // Fetch the tailored resume
    const { data: tailoredResume, error: fetchError } = await supabase
      .from('tailored_resumes')
      .select('*')
      .eq('id', resumeId)
      .eq('user_id', userId)
      .single()

    if (fetchError || !tailoredResume) {
      return NextResponse.json(
        { status: 'error', message: 'Tailored resume not found' },
        { status: 404 }
      )
    }

    // Generate DOCX file using docx library
    // This endpoint returns JSON with instructions for the client to call a separate generation endpoint
    return NextResponse.json({
      status: 'success',
      resume: {
        id: tailoredResume.id,
        companyName: tailoredResume.company_name,
        jobTitle: tailoredResume.job_title,
        atsScore: tailoredResume.ats_score,
        createdAt: tailoredResume.created_at,
        tailoredContent: tailoredResume.tailored_content,
        coverLetter: tailoredResume.cover_letter,
      },
      message: 'Use POST /api/tailored-resumes/[id]/generate-docx to generate the Word file',
    })
  } catch (error) {
    console.error('Download tailored resume error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to download tailored resume',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
