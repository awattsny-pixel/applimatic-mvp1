import { NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import type { UnifiedJob } from '@/lib/services/jobAggregator'

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export interface CreateApplicationRequest {
  job: UnifiedJob
}

export async function POST(request: Request) {
  try {
    const { job } = await request.json() as CreateApplicationRequest

    // Get the user from the Authorization header
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { status: 'error', message: 'Unauthorized' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')

    // Decode JWT to get user ID (basic verification)
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

    // Create application from job
    const { data: application, error: insertError } = await supabaseAdmin
      .from('applications')
      .insert({
        user_id: userId,
        company_name: job.company,
        job_title: job.title,
        job_url: job.jobUrl,
        job_description: job.description,
        status: 'applied', // Mark as already applied
      })
      .select('id')
      .single()

    if (insertError) {
      console.error('Failed to create application:', {
        code: insertError.code,
        message: insertError.message,
        details: insertError.details,
      })
      return NextResponse.json(
        {
          status: 'error',
          message: 'Failed to create application',
          details: insertError.message,
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      status: 'success',
      applicationId: application.id,
      message: `Application created for ${job.company} - ${job.title}`,
    })
  } catch (error) {
    console.error('Create application error:', error)
    return NextResponse.json(
      {
        status: 'error',
        message: 'Failed to create application',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    )
  }
}
