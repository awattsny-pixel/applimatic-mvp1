import { NextResponse } from 'next/server';

const MOCK_JOBS = [
  {
    id: 'job-001',
    company_name: 'Acme Corp',
    job_title: 'Senior Software Engineer',
    location: 'San Francisco, CA',
    salary_min: 120000,
    salary_max: 180000,
  },
  {
    id: 'job-002',
    company_name: 'Tech Startup Inc',
    job_title: 'Full Stack Developer',
    location: 'New York, NY',
    salary_min: 100000,
    salary_max: 150000,
  },
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { query } = body;

    if (!query) {
      return NextResponse.json({ status: 'error', message: 'Query required' }, { status: 400 });
    }

    const results = MOCK_JOBS.filter(job =>
      job.job_title.toLowerCase().includes(query.toLowerCase())
    );

    return NextResponse.json({
      status: 'success',
      results,
      result_count: results.length,
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', error: String(error) }, { status: 500 });
  }
}
