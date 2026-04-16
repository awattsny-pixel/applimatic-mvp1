export interface SearchRequest {
  query: string;
  location?: string;
  salary_min?: number;
  salary_max?: number;
  employment_type?: string;
}

export interface JobPosting {
  id: string;
  linkedin_job_id?: string;
  company_name: string;
  job_title: string;
  job_url?: string;
  description?: string;
  salary_min?: number;
  salary_max?: number;
  currency?: string;
  location?: string;
  seniority_level?: string;
  employment_type?: string;
  posted_date?: string;
}

export interface SearchResponse {
  status: 'success' | 'error';
  message: string;
  search_id?: string;
  results?: JobPosting[];
  result_count?: number;
  usage?: {
    allowed: boolean;
    used_count: number;
    limit: number;
    remaining: number;
  };
  error?: string;
}
