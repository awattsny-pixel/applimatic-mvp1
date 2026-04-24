-- ============================================================
--  Tailored Resumes Table
--  Stores customized resume versions created for specific jobs
-- ============================================================

CREATE TABLE public.tailored_resumes (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  application_id        UUID REFERENCES applications(id) ON DELETE CASCADE,
  company_name          TEXT NOT NULL,
  job_title             TEXT NOT NULL,
  job_description       TEXT,

  -- Tailored content
  tailored_content      JSONB NOT NULL,  -- {sections, summary, bullets, etc}
  cover_letter          TEXT,
  ats_score             INTEGER,

  -- Files
  docx_file_url         TEXT,            -- Supabase Storage URL of generated DOCX
  cover_letter_file_url TEXT,            -- Separate file for cover letter

  -- Metadata
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  notes                 TEXT             -- User notes about this version
);

-- Enable Row Level Security
ALTER TABLE public.tailored_resumes ENABLE ROW LEVEL SECURITY;

-- Users can only view/manage their own tailored resumes
CREATE POLICY "Users view own tailored resumes"
  ON public.tailored_resumes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users insert own tailored resumes"
  ON public.tailored_resumes FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users update own tailored resumes"
  ON public.tailored_resumes FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users delete own tailored resumes"
  ON public.tailored_resumes FOR DELETE USING (auth.uid() = user_id);

-- Indexes for fast lookups
CREATE INDEX idx_tailored_resumes_user_id ON public.tailored_resumes(user_id);
CREATE INDEX idx_tailored_resumes_application_id ON public.tailored_resumes(application_id);
CREATE INDEX idx_tailored_resumes_created_at ON public.tailored_resumes(created_at DESC);
