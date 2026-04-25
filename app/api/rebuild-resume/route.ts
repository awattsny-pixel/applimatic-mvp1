import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { mergeTailoredResume } from '@/lib/utils/mergeTailoredResume'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const applicationId = searchParams.get('id')

    if (!applicationId) {
      return NextResponse.json(
        { error: 'Application ID is required' },
        { status: 400 }
      )
    }

    // Get the authenticated user
    const supabase = await createClient()
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Fetch the application and its tailored output
    const { data: application, error: appError } = await supabase
      .from('applications')
      .select(`
        *,
        tailored_outputs(*)
      `)
      .eq('id', applicationId)
      .eq('user_id', user.id)
      .single()

    if (appError || !application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      )
    }

    // Get the user's master resume
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('content')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resumeError || !resume) {
      return NextResponse.json(
        { error: 'Master resume not found' },
        { status: 404 }
      )
    }

    // Get tailored sections from the application's tailored_outputs
    const tailoredOutput = application.tailored_outputs[0]
    if (!tailoredOutput) {
      return NextResponse.json(
        { error: 'No tailored output found for this application' },
        { status: 404 }
      )
    }

    // Merge the tailored sections into the master resume
const mergedResume = mergeTailoredResume(
  resume.content,
  tailoredOutput.tailored_sections,
  tailoredOutput.tailored_summary
)
   return NextResponse.json({
      success: true,
      mergedResume,
      company_name: application.company_name,
      job_title: application.job_title,
    })

  } catch (error) {
    console.error('Rebuild resume error:', error)
    return NextResponse.json(
      { error: 'Failed to rebuild resume' },
      { status: 500 }
    )
  }
}
