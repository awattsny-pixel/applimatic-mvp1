// app/api/tailor/route.ts
// ============================================================
//  The core AI endpoint. Takes a job description + user's
//  master resume and returns a fully tailored application.
// ============================================================

import { NextRequest, NextResponse } from 'next/server'
import Anthropic from '@anthropic-ai/sdk'
import { createClient } from '@/lib/supabase/server'
import { buildTailorPrompt } from '@/lib/prompts'

// Allow up to 60 seconds — Claude can take 20-40s for a full tailoring
export const maxDuration = 60

const PLAN_LIMITS = { free: 3, starter: 20, pro: Infinity } as const

export async function POST(request: NextRequest) {
  try {
    // ── 1. Auth check ──────────────────────────────────────
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // ── 2. Check usage limits ──────────────────────────────
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan, apps_used')
      .eq('id', user.id)
      .single()

    const plan  = (profile?.plan ?? 'free') as keyof typeof PLAN_LIMITS
    const used  = profile?.apps_used ?? 0
    const limit = PLAN_LIMITS[plan]

    if (used >= limit) {
      return NextResponse.json(
        { error: 'usage_limit', message: `You've used all ${limit} applications on your ${plan} plan. Please upgrade to continue.` },
        { status: 403 }
      )
    }

    // ── 3. Parse request body ──────────────────────────────
    const { jobDescription, companyName, jobTitle, jobUrl } = await request.json()

    if (!jobDescription || jobDescription.trim().length < 50) {
      return NextResponse.json({ error: 'Job description is too short.' }, { status: 400 })
    }

    // ── 4. Fetch master resume text ────────────────────────
    const { data: resume } = await supabase
      .from('resumes')
      .select('content_text, file_name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (!resume?.content_text) {
      return NextResponse.json(
        { error: 'no_resume', message: 'Please upload your master resume first before tailoring.' },
        { status: 400 }
      )
    }

    // ── 5. Call Claude API ─────────────────────────────────
    const anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY,
    })

    const prompt = buildTailorPrompt(
      resume.content_text,
      jobDescription,
      companyName || 'this company',
      jobTitle    || 'this role'
    )

    const message = await anthropic.messages.create({
      model:      'claude-sonnet-4',
      max_tokens: 8192,
      messages:   [{ role: 'user', content: prompt }],
    })

    // ── 6. Parse AI response ───────────────────────────────
    const rawText = message.content[0].type === 'text' ? message.content[0].text : ''

    let tailoredData: any
    try {
      // Strip any accidental markdown code fences if present
      const cleaned = rawText.replace(/^```json\n?/, '').replace(/\n?```$/, '').trim()
      tailoredData = JSON.parse(cleaned)
    } catch {
      console.error('Failed to parse Claude response:', rawText.slice(0, 500))
      return NextResponse.json({ error: 'AI returned an unexpected format. Please try again.' }, { status: 500 })
    }

    // ── 7. Save to database ────────────────────────────────
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
      console.error('DB save error:', saveError)
      // Don't fail the request — return the data even if save failed
    }

    // Also create/update the application record
    if (companyName && jobTitle) {
      await supabase.from('applications').insert({
        user_id:             user.id,
        company_name:        companyName,
        job_title:           jobTitle,
        job_url:             jobUrl || null,
        job_description:     jobDescription,
        status:              'draft',
        tailored_output_id:  savedOutput?.id ?? null,
      })
    }

    // ── 8. Increment usage counter ─────────────────────────
    await supabase
      .from('profiles')
      .update({ apps_used: used + 1 })
      .eq('id', user.id)

    // ── 9. Return result ───────────────────────────────────
    return NextResponse.json({
      success:   true,
      outputId:  savedOutput?.id,
      data:      tailoredData,
      remaining: Math.max(0, limit - (used + 1)),
    })

  } catch (error: any) {
    console.error('Tailor API error:', error)
    return NextResponse.json(
      { error: error.message ?? 'Something went wrong. Please try again.' },
      { status: 500 }
    )
  }
}
