import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const jobId = url.searchParams.get('jobId')
    const source = url.searchParams.get('source')

    if (!jobId || !source) {
      return NextResponse.json(
        { status: 'error', message: 'jobId and source are required' },
        { status: 400 }
      )
    }

    // Get the user from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
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

    // Check if job is saved
    const { data: savedJob, error } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .eq('source', source)
      .single()

    if (error && error.code !== 'PGRST116') {
      // PGRST116 is "no rows found" which is fine
      console.error('Failed to check saved status:', error)
      return NextResponse.json(
        { status: 'error', message: 'Failed to check saved status' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      isSaved: !!savedJob,
    })
  } catch (error) {
    console.error('Check saved job error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to check saved status',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
