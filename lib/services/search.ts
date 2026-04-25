import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const MOCK_JOBS = [
  {
    linkedin_job_id: 'job-001',
    company_name: 'Acme Corp',
    job_title: 'Senior Software Engineer',
    job_url: 'https://linkedin.com/jobs/view/1',
    description: 'We are looking for a Senior Software Engineer with React experience',
    salary_min: 120000,
    salary_max: 180000,
    currency: 'USD',
    location: 'San Francisco, CA',
    seniority_level: 'senior',
    employment_type: 'full-time',
  },
  {
    linkedin_job_id: 'job-002',
    company_name: 'Tech Startup Inc',
    job_title: 'Full Stack Developer',
    job_url: 'https://linkedin.com/jobs/view/2',
    description: 'Join our growing team as a Full Stack Developer',
    salary_min: 100000,
    salary_max: 150000,
    currency: 'USD',
    location: 'New York, NY',
    seniority_level: 'mid',
    employment_type: 'full-time',
  },
];

export async function searchJobs(
  userId: string,
  query: string,
  filters?: { location?: string; salary_min?: number; salary_max?: number }
) {
  try {
    let results = MOCK_JOBS.filter((job) =>
      job.job_title.toLowerCase().includes(query.toLowerCase()) ||
      job.company_name.toLowerCase().includes(query.toLowerCase())
    );

    if (filters?.location) {
      results = results.filter((job) =>
        job.location?.toLowerCase().includes(filters.location!.toLowerCase())
      );
    }

    if (filters?.salary_min) {
      results = results.filter((job) => (job.salary_max || 0) >= filters.salary_min!);
    }

    const { data: search, error: searchError } = await supabase
      .from('user_searches')
      .insert({
        user_id: userId,
        search_query: query,
        result_count: results.length,
      })
      .select()
      .single();

    if (searchError) throw searchError;

    for (const job of results) {
      await supabase.from('job_postings').upsert(
        {
          linkedin_job_id: job.linkedin_job_id,
          company_name: job.company_name,
          job_title: job.job_title,
          job_url: job.job_url,
          description: job.description,
          salary_min: job.salary_min,
          salary_max: job.salary_max,
          currency: job.currency,
          location: job.location,
          seniority_level: job.seniority_level,
          employment_type: job.employment_type,
          posted_date: new Date().toISOString(),
        },
        {
          onConflict: 'linkedin_job_id',
        }
      );
    }

    return {
      search_id: search.id,
      results,
      result_count: results.length,
    };
  } catch (error) {
    throw error;
  }
}

export async function checkSearchLimit(userId: string) {
  try {
    const { data, error } = await supabase.rpc('check_feature_limit', {
      p_user_id: userId,
      p_feature_key: 'search',
    });

    if (error) throw error;
    return data[0];
  } catch (error) {
    throw error;
  }
}

export async function incrementSearchUsage(userId: string) {
  try {
    await supabase.rpc('increment_feature_usage', {
      p_user_id: userId,
      p_feature_key: 'search',
    });
  } catch (error) {
    throw error;
  }
}
