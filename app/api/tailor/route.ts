import { NextResponse } from 'next/server';
import { tailorResumeAndCoverLetter } from '@/lib/services/claude';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { job_description, job_title, company_name, resume_text } = body;

    if (!job_description || !job_title || !company_name || !resume_text) {
      return NextResponse.json(
        {
          status: 'error',
          message: 'Missing required fields',
          error: 'INVALID_INPUT',
        },
        { status: 400 }
      );
    }

    const result = await tailorResumeAndCoverLetter(
      job_description,
      job_title,
      company_name,
      resume_text
    );

    return NextResponse.json({
      status: 'success',
      tailored_resume: result.tailored_resume,
      cover_letter: result.cover_letter,
      usage: {
        tokens_used: result.tokens_used,
      },
    });
  } catch (error) {
    console.error('Tailor error:', error);
    return NextResponse.json(
      {
        status: 'error',
        message: 'Tailoring failed',
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
