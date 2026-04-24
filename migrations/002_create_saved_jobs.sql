-- ============================================================
--  Saved Jobs Table
--  Allows users to bookmark job listings from search results
-- ============================================================

CREATE TABLE public.saved_jobs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_id            TEXT NOT NULL,              -- Unique job identifier from aggregator
  job_title         TEXT NOT NULL,
  company           TEXT NOT NULL,
  location          TEXT,
  job_url           TEXT,
  job_description   TEXT,
  salary            JSONB,                      -- {min, max, currency}
  job_type          TEXT,                       -- full-time, part-time, etc
  source            TEXT NOT NULL,              -- indeed, rapidapi, glassdoor, linkedin, mock
  posted_date       TIMESTAMPTZ,
  saved_at          TIMESTAMPTZ DEFAULT NOW(),
  notes             TEXT,                       -- User notes about this job
  updated_at        TIMESTAMPTZ DEFAULT NOW(),

  -- Ensure uniqueness: each user can only save the same job once
  UNIQUE(user_id, job_id, source)
);

-- Enable Row Level Security
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- Users can only view/manage their own saved jobs
CREATE POLICY "Users view own saved jobs"
  ON public.saved_jobs FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own saved jobs"
  ON public.saved_jobs FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own saved jobs"
  ON public.saved_jobs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own saved jobs"
  ON public.saved_jobs FOR DELETE USING (auth.uid() = user_id);

-- Index for fast lookups
CREATE INDEX idx_saved_jobs_user_id ON public.saved_jobs(user_id);
CREATE INDEX idx_saved_jobs_job_id ON public.saved_jobs(job_id, source);
