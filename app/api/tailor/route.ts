// ============================================================
//  The core AI endpoint. Takes a job description + user's
//  master resume and returns a fully tailored application.
// ============================================================
import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildTailorPrompt } from '@/lib/prompts'

// Allow up to 120 seconds for full processing
export const maxDuration = 120

const PLAN_LIMITS = { free: 3, starter: 20, pro: Infinity } as const

export async function POST(request: NextRequest) {
  const startTime = Date.now()
  console.log('=== TAILOR API START ===')

  try {
    // ── 1. Auth check ──────────────────────────────────────
    console.log('Step 1: Auth check...')
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      console.error('❌ Auth failed: No user found')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }
    console.log('✓ Auth OK - User ID:', user.id)

    // ── 2. Check usage limits ──────────────────────────────
    console.log('Step 2: Checking usage limits...')
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('plan, apps_used')
      .eq('id', user.id)
      .single()

    if (profileError) {
      console.error('❌ Profile fetch error:', profileError)
      return NextResponse.json({ error: 'Failed to fetch profile', details: profileError.message }, { status: 500 })
    }

    const plan  = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS
    const used  = profile?.apps_used ?? 0
    const limit = PLAN_LIMITS[plan]
    console.log(`✓ Plan: ${plan} | Used: ${used}/${limit}`)

    if (used >= limit) {
      console.warn(`⚠️ Usage limit reached for plan: ${plan}`)
      return NextResponse.json(
        { error: 'usage_limit', message: `You've used all ${limit} applications on your ${plan} plan. Please upgrade to continue.` },
        { status: 403 }
      )
    }

    // ── 3. Parse request body ──────────────────────────────
    console.log('Step 3: Parsing request body...')
    let jobDescription, companyName, jobTitle, jobUrl
    try {
      const body = await request.json()
      jobDescription = body.jobDescription
      companyName = body.companyName
      jobTitle = body.jobTitle
      jobUrl = body.jobUrl
    } catch (parseErr: any) {
      console.error('❌ Failed to parse request JSON:', parseErr.message)
      return NextResponse.json({ error: 'Invalid request body', details: parseErr.message }, { status: 400 })
    }

    if (!jobDescription || jobDescription.trim().length < 50) {
      console.error('❌ Job description too short:', jobDescription?.length ?? 0, 'chars')
      return NextResponse.json({ error: 'Job description is too short.' }, { status: 400 })
    }
    console.log(`✓ Request parsed: ${jobDescription.length} chars, company: ${companyName || 'N/A'}, title: ${jobTitle || 'N/A'}`)

    // ── 4. Fetch master resume text ────────────────────────
    console.log('Step 4: Fetching resume from DB...')
    const { data: resume, error: resumeError } = await supabase
      .from('resumes')
      .select('content_text, file_name, id')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (resumeError) {
      console.error('❌ Resume fetch error:', resumeError)
      return NextResponse.json(
        { error: 'no_resume', message: 'Please upload your master resume first before tailoring.', details: resumeError.message },
        { status: 400 }
      )
    }

    if (!resume) {
      console.error('❌ No resume found for user')
      return NextResponse.json(
        { error: 'no_resume', message: 'Please upload your master resume first before tailoring.' },
        { status: 400 }
      )
    }

    if (!resume.content_text) {
      console.error('❌ Resume found but content_text is empty/null. Resume ID:', resume.id)
      return NextResponse.json(
        { error: 'no_resume_content', message: 'Your resume was uploaded but text was not extracted. Try re-uploading.' },
        { status: 400 }
      )
    }
    console.log(`✓ Resume loaded: ${resume.content_text.length} chars from file: ${resume.file_name}`)

    // ── 5. Call Claude API ─────────────────────────────────
    console.log('Step 5: Building prompt and calling Claude...')

    if (!process.env.ANTHROPIC_API_KEY) {
      console.error('❌ ANTHROPIC_API_KEY not configured')
      return NextResponse.json({ error: 'Server configuration error', details: 'API key missing' }, { status: 500 })
    }

    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    try {
      const prompt = buildTailorPrompt(
        resume.content_text,
        jobDescription,
        companyName || 'this company',
        jobTitle    || 'this role'
      )
      console.log(`✓ Prompt built: ${prompt.length} chars`)
      console.log('Calling Claude API (model: claude-sonnet-4-6, max_tokens: 8192)...')

      const claudeStartTime = Date.now()
      const message = await anthropic.messages.create({
        model:      'claude-sonnet-4-6',
        max_tokens: 8192,
        messages:   [{ role: 'user', content: prompt }],
      })
      const claudeDuration = Date.now() - claudeStartTime
      console.log(`✓ Claude API responded in ${claudeDuration}ms`)
      console.log(`Response: ${message.content.length} content blocks, stop_reason: ${message.stop_reason}`)
    } catch (claudeErr: any) {
      console.error('❌ Claude API error:', claudeErr.message || claudeErr)
      console.error('Error type:', claudeErr.constructor.name)
      console.error('Full error:', JSON.stringify(claudeErr, null, 2))

      return NextResponse.json(
        {
          error: 'Claude API error',
          details: claudeErr.message || 'Unknown API error',
          type: claudeErr.status || 'unknown'
        },
        { status: claudeErr.status || 500 }
      )
    }

    // ── 6. Parse AI response ───────────────────────────────
    console.log('Step 6: Parsing Claude response...')
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''
    console.log(`Raw response length: ${rawText.length} chars`)

    let tailoredData: any
    try {
      // Strip any accidental markdown code fences if present
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      console.log(`Cleaned response length: ${cleaned.length} chars`)
      tailoredData = JSON.parse(cleaned)
      console.log(`✓ JSON parsed successfully. Keys: ${Object.keys(tailoredData).join(', ')}`)
    } catch (parseErr: any) {
      console.error('❌ Failed to parse Claude JSON response:', parseErr.message)
      console.error('First 500 chars of response:', rawText.slice(0, 500))
      return NextResponse.json(
        { error: 'AI returned an unexpected format. Please try again.', details: parseErr.message },
        { status: 500 }
      )
    }

    // ── 7. Save to database ────────────────────────────────
    console.log('Step 7: Saving to database...')
    const { data: savedOutput, error: saveError } = await supabase
      .from('tailored_outputs')
      .insert({
        user_id:          user.id,
        company_name:     companyName || '',
        job_title:        jobTitle    || '',
        job_url:          jobUrl      || null,
        job_description:  jobDescription,
        ats_score:        tailoredData.analysis?.ats_score ?? null,
        key_matches:      tailoredData.key_matches ?? [],
        key_gaps:         tailoredData.key_gaps ?? [],
        tailored_sections: tailoredData.tailored_sections ?? [],
        top_changes:      tailoredData.top_changes ?? [],
        cover_letter:     tailoredData.cover_letter ?? '',
        analysis:         tailoredData.analysis ?? {},
      })
      .select('id')
      .single()

    if (saveError) {
      console.error('⚠️ DB save error (non-fatal):', saveError)
      // Don't fail the request — return the data even if save failed
    } else {
      console.log(`✓ Saved to tailored_outputs table. ID: ${savedOutput?.id}`)
    }

    // Also create/update the application record
    if (companyName && jobTitle) {
      console.log('Creating application record...')
      const { error: appError } = await supabase.from('applications').insert({
        user_id:             user.id,
        company_name:        companyName,
        job_title:           jobTitle,
        job_url:             jobUrl || null,
        job_description:     jobDescription,
        status:              'draft',
        tailored_output_id:  savedOutput?.id ?? null,
      })
      if (appError) {
        console.error('⚠️ Application record insert error (non-fatal):', appError)
      } else {
        console.log('✓ Application record created')
      }
    }

    // ── 8. Increment usage counter ─────────────────────────
    console.log('Step 8: Incrementing usage counter...')
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ apps_used: used + 1 })
      .eq('id', user.id)

    if (updateError) {
      console.error('⚠️ Failed to increment usage counter (non-fatal):', updateError)
    } else {
      console.log(`✓ Usage counter incremented: ${used} → ${used + 1}`)
    }

    // ── 9. Return result ───────────────────────────────────
    const totalDuration = Date.now() - startTime
    console.log(`=== TAILOR API SUCCESS === Total time: ${totalDuration}ms`)

    return NextResponse.json({
      success:   true,
      outputId:  savedOutput?.id,
      data:      tailoredData,
      remaining: Math.max(0, limit - (used + 1)),
    })
  } catch (error: any) {
    const totalDuration = Date.now() - startTime
    console.error(`=== TAILOR API ERROR === Total time before error: ${totalDuration}ms`)
    console.error('Uncaught error:', error)
    console.error('Error message:', error?.message)
    console.error('Error stack:', error?.stack)

    return NextResponse.json(
      { error: error.message ?? 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
