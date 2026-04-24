import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface SaveJobRequest {
  job: UnifiedJob
}

export async function POST(request: Request) {
  try {
    const { job } = await request.json() as SaveJobRequest

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
    const jobId = job.id

    // Check if job is already saved
    const { data: existingSave, error: queryError } = await supabase
      .from('saved_jobs')
      .select('id')
      .eq('user_id', userId)
      .eq('job_id', jobId)
      .eq('source', job.source)
      .single()

    // PGRST116 is "no rows found" which is fine
    if (queryError && queryError.code !== 'PGRST116') {
      console.error('Failed to check save status:', queryError)
      return NextResponse.json(
        { status: 'error', message: 'Failed to check save status' },
        { status: 500 }
      )
    }

    if (existingSave) {
      // Delete (unsave)
      const { error: deleteError } = await supabase
        .from('saved_jobs')
        .delete()
        .eq('user_id', userId)
        .eq('job_id', jobId)
        .eq('source', job.source)

      if (deleteError) {
        console.error('Failed to unsave job:', deleteError)
        return NextResponse.json(
          { status: 'error', message: 'Failed to unsave job' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        status: 'success',
        action: 'unsaved',
        isSaved: false,
      })
    } else {
      // Insert (save)
      // Convert Unix timestamp to date string (YYYY-MM-DD)
      let postedDate = null
      if (job.postedDate) {
        const timestamp = typeof job.postedDate === 'string' ? parseInt(job.postedDate) : job.postedDate
        postedDate = new Date(timestamp * 1000).toISOString().split('T')[0]
      }

      const { error: insertError } = await supabase
        .from('saved_jobs')
        .insert({
          user_id: userId,
          job_id: jobId,
          job_title: job.title,
          company: job.company,
          location: job.location,
          job_url: job.jobUrl,
          job_description: job.description,
          salary: job.salary,
          job_type: job.jobType,
          source: job.source,
          posted_date: postedDate,
        })

      if (insertError) {
        console.error('Failed to save job:', insertError)
        return NextResponse.json(
          { status: 'error', message: 'Failed to save job' },
          { status: 500 }
        )
      }

      return NextResponse.json({
        status: 'success',
        action: 'saved',
        isSaved: true,
      })
    }
  } catch (error) {
    console.error('Save job error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to toggle job save status',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
