// Unified job data format across all sources
export interface UnifiedJob {
  id: string;
  title: string;
  company: string;
  location: string;
  jobUrl: string;
  source: "indeed" | "rapidapi" | "glassdoor" | "jSearch" | "mock";
  salary?: {
    min?: number;
    max?: number;
    currency?: string;
  };
  description: string;
  postedDate?: string;
  jobType?: string; // full-time, part-time, contract, etc
}

export interface JobSearchResult {
  jobs: UnifiedJob[];
  totalResults: number;
  sources: {
    [key: string]: {
      count: number;
      error?: string;
    };
  };
}

// Indeed API adapter
async function searchIndeed(query: string, options?: JobSearchOptions): Promise<UnifiedJob[]> {
  try {
    const apiKey = process.env.INDEED_API_KEY;
    if (!apiKey) {
      console.warn("Indeed API key not configured, skipping Indeed search");
      return [];
    }

    // TODO: Implement Indeed API call
    // Indeed API docs: https://opensource.indeedeng.io/api-documentation/
    const response = await fetch(
      `https://api.indeed.com/v2/jobs?q=${encodeURIComponent(query)}&api_key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`Indeed API error: ${response.statusText}`);
    }

    const data = await response.json();

    return data.results?.map((job: any) => ({
      id: `indeed-${job.id}`,
      title: job.jobtitle,
      company: job.company,
      location: job.locations?.[0] || "Remote",
      jobUrl: job.url,
      source: "indeed" as const,
      description: job.snippet || "",
      postedDate: job.posted,
    })) || [];
  } catch (error) {
    console.error("Indeed search error:", error);
    return [];
  }
}

// RapidAPI Job Search adapter
async function searchRapidAPI(query: string, options?: JobSearchOptions): Promise<UnifiedJob[]> {
  try {
    const apiKey = process.env.RAPIDAPI_KEY;
    if (!apiKey) {
      console.warn("RapidAPI key not configured, skipping RapidAPI search");
      return [];
    }

    // Build search query with location if provided
    let searchQuery = query;
    if (options?.location) {
      searchQuery = `${query} in ${options.location}`;
    }

    // Build URL with filters (page parameter for pagination)
    const page = options?.page || 1;
    const params = new URLSearchParams({
      query: searchQuery,
      num_pages: "1",
      page: page.toString(),
    });

    // RapidAPI Job Search: https://rapidapi.com/letscrape-6bpm/api/jsearch
    const response = await fetch(
      `https://jsearch.p.rapidapi.com/search?${params}`,
      {
        method: "GET",
        headers: {
          "X-RapidAPI-Key": apiKey,
          "X-RapidAPI-Host": "jsearch.p.rapidapi.com",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`RapidAPI error: ${response.statusText}`);
    }

    const data = await response.json();

    const jobs = data.data?.map((job: any) => ({
      id: `rapidapi-${job.job_id}`,
      title: job.job_title,
      company: job.employer_name,
      location: job.job_country || "Remote",
      jobUrl: job.job_apply_link,
      source: "rapidapi" as const,
      salary: {
        min: job.job_min_salary,
        max: job.job_max_salary,
        currency: job.job_salary_currency,
      },
      description: job.job_description || "",
      postedDate: job.job_posted_at_timestamp,
      jobType: job.job_employment_type,
    })) || [];

    // Apply client-side filters
    return filterJobs(jobs, options);
  } catch (error) {
    console.error("RapidAPI search error:", error);
    return [];
  }
}

// Glassdoor API adapter (placeholder - Glassdoor API is restricted)
async function searchGlassdoor(query: string, options?: JobSearchOptions): Promise<UnifiedJob[]> {
  try {
    const apiKey = process.env.GLASSDOOR_API_KEY;
    if (!apiKey) {
      console.warn("Glassdoor API key not configured, skipping Glassdoor search");
      return [];
    }

    // NOTE: Glassdoor API access is very restricted
    // You may need to use: https://rapidapi.com/api-sls/api/glassdoor-api
    // Or implement web scraping as fallback

    console.warn("Glassdoor integration not yet implemented");
    return [];
  } catch (error) {
    console.error("Glassdoor search error:", error);
    return [];
  }
}

// LinkedIn Jobs adapter (placeholder)
async function searchLinkedIn(query: string, options?: JobSearchOptions): Promise<UnifiedJob[]> {
  try {
    const apiKey = process.env.LINKEDIN_API_KEY;
    if (!apiKey) {
      console.warn("LinkedIn API key not configured, skipping LinkedIn search");
      return [];
    }

    // TODO: Implement LinkedIn Jobs API
    // Requires OAuth2 and developer approval
    // LinkedIn Jobs API: https://learn.microsoft.com/en-us/linkedin/jobs/jobs-api/

    console.warn("LinkedIn integration not yet implemented");
    return [];
  } catch (error) {
    console.error("LinkedIn search error:", error);
    return [];
  }
}

// Mock data for development (no API key needed)
function getMockJobs(query: string): UnifiedJob[] {
  const mockJobs: UnifiedJob[] = [
    {
      id: "mock-001",
      title: "Senior Software Engineer",
      company: "Acme Corp",
      location: "San Francisco, CA",
      jobUrl: "https://acmecorp.com/careers/senior-engineer",
      source: "mock",
      salary: { min: 150000, max: 200000, currency: "USD" },
      description: `We are hiring a Senior Software Engineer with ${query} experience...`,
      postedDate: new Date().toISOString(),
      jobType: "full-time",
    },
    {
      id: "mock-002",
      title: "Full Stack Developer",
      company: "Tech Startup Inc",
      location: "Remote",
      jobUrl: "https://techstartup.com/jobs/fullstack",
      source: "mock",
      salary: { min: 120000, max: 160000, currency: "USD" },
      description: `Looking for a Full Stack Developer proficient in ${query}...`,
      postedDate: new Date().toISOString(),
      jobType: "full-time",
    },
  ];

  return mockJobs.filter(
    (job) =>
      job.title.toLowerCase().includes(query.toLowerCase()) ||
      job.description.toLowerCase().includes(query.toLowerCase())
  );
}

// Filter options for job search
export interface JobSearchOptions {
  location?: string;
  minSalary?: number;
  maxSalary?: number;
  experience?: string;
  workType?: 'remote' | 'hybrid' | 'in-person' | '';
  postedWithin?: '24h' | '7d' | '30d' | '';
  employmentTypes?: string[];
  page?: number;
}

// Apply filters to job results
function filterJobs(jobs: UnifiedJob[], options?: JobSearchOptions): UnifiedJob[] {
  if (!options) return jobs;

  return jobs.filter((job) => {
    // Filter by salary range
    if (options.minSalary !== undefined && job.salary?.min) {
      if (job.salary.min < options.minSalary) return false;
    }
    if (options.maxSalary !== undefined && job.salary?.max) {
      if (job.salary.max > options.maxSalary) return false;
    }

    // Filter by work type (remote, hybrid, in-person)
    if (options.workType) {
      const jobTypeStr = (job.jobType || '').toLowerCase();
      const workTypeStr = options.workType.toLowerCase();
      if (!jobTypeStr.includes(workTypeStr)) return false;
    }

    // Filter by experience level (basic keyword matching)
    if (options.experience && options.experience !== '') {
      const jobDescLower = `${job.title} ${job.description}`.toLowerCase();
      const experienceKeywords: Record<string, string[]> = {
        entry: ['entry', 'junior', 'graduate', 'fresher'],
        junior: ['junior', 'entry', 'beginner'],
        mid: ['mid', 'intermediate', '3+ years', '5+ years'],
        senior: ['senior', 'lead', 'principal', '7+ years', '10+ years'],
        manager: ['manager', 'team lead', 'lead'],
        director: ['director'],
        executive: ['executive', 'c-level', 'vp'],
      };

      const keywords = experienceKeywords[options.experience] || [];
      if (!keywords.some((kw) => jobDescLower.includes(kw))) return false;
    }

    // Filter by posted within (based on postedDate)
    if (options.postedWithin && job.postedDate) {
      const postedDate = new Date(job.postedDate);
      const now = new Date();
      const hoursAgo = (now.getTime() - postedDate.getTime()) / (1000 * 60 * 60);

      const maxHours =
        options.postedWithin === '24h' ? 24 :
        options.postedWithin === '7d' ? 168 :
        options.postedWithin === '30d' ? 720 : Infinity;

      if (hoursAgo > maxHours) return false;
    }

    // Filter by employment type
    if (options.employmentTypes && options.employmentTypes.length > 0) {
      const jobTypeStr = (job.jobType || '').toLowerCase();
      const matchesType = options.employmentTypes.some((type) =>
        jobTypeStr.includes(type.toLowerCase())
      );
      if (!matchesType) return false;
    }

    return true;
  });
}

// Main aggregator function
export async function aggregateJobs(
  query: string,
  options?: JobSearchOptions
): Promise<JobSearchResult> {
  const startTime = Date.now();

  // Call all job sources in parallel
  const [indeedJobs, rapidapiJobs, glassdoorJobs, linkedinJobs, mockJobs] =
    await Promise.allSettled([
      searchIndeed(query, options),
      searchRapidAPI(query, options),
      searchGlassdoor(query, options),
      searchLinkedIn(query, options),
      Promise.resolve(getMockJobs(query)), // Always succeeds
    ]);

  // Process results
  const results: UnifiedJob[] = [];
  const sources: { [key: string]: { count: number; error?: string } } = {};

  // Handle Indeed results
  if (indeedJobs.status === "fulfilled") {
    results.push(...indeedJobs.value);
    sources.indeed = { count: indeedJobs.value.length };
  } else {
    sources.indeed = { count: 0, error: indeedJobs.reason?.message };
  }

  // Handle RapidAPI results
  if (rapidapiJobs.status === "fulfilled") {
    results.push(...rapidapiJobs.value);
    sources.rapidapi = { count: rapidapiJobs.value.length };
  } else {
    sources.rapidapi = { count: 0, error: rapidapiJobs.reason?.message };
  }

  // Handle Glassdoor results
  if (glassdoorJobs.status === "fulfilled") {
    results.push(...glassdoorJobs.value);
    sources.glassdoor = { count: glassdoorJobs.value.length };
  } else {
    sources.glassdoor = { count: 0, error: glassdoorJobs.reason?.message };
  }

  // Handle LinkedIn results
  if (linkedinJobs.status === "fulfilled") {
    results.push(...linkedinJobs.value);
    sources.linkedin = { count: linkedinJobs.value.length };
  } else {
    sources.linkedin = { count: 0, error: linkedinJobs.reason?.message };
  }

  // Handle Mock results (fallback)
  if (mockJobs.status === "fulfilled") {
    // Only use mock if no real results
    if (results.length === 0) {
      results.push(...mockJobs.value);
      sources.mock = { count: mockJobs.value.length };
    } else {
      sources.mock = { count: mockJobs.value.length };
    }
  }

  // Remove duplicates by job URL
  const uniqueJobs = Array.from(
    new Map(results.map((job) => [job.jobUrl, job])).values()
  );

  const endTime = Date.now();
  console.log(
    `Job aggregation completed in ${endTime - startTime}ms. Total jobs: ${uniqueJobs.length}`
  );

  return {
    jobs: uniqueJobs,
    totalResults: uniqueJobs.length,
    sources,
  };
}
