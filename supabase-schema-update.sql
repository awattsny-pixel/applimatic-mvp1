-- ============================================================
--  APPLIMATIC — Schema Update: AI Tailoring Feature
--  Run this in Supabase SQL Editor AFTER running supabase-schema.sql
-- ============================================================

-- ── 1. TAILORED OUTPUTS TABLE ────────────────────────────────
-- Stores every AI-generated tailored application result
CREATE TABLE public.tailored_outputs (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name      TEXT,
  job_title         TEXT,
  job_url           TEXT,
  job_description   TEXT,
  ats_score         INTEGER,
  key_matches       TEXT[] DEFAULT '{}',
  key_gaps          TEXT[] DEFAULT '{}',
  tailored_sections JSONB DEFAULT '[]',
  top_changes       JSONB DEFAULT '[]',
  cover_letter      TEXT,
  analysis          JSONB DEFAULT '{}',
  created_at        TIMESTAMPTZ DEFAULT NOW()
);

-- ── 2. UPDATE APPLICATIONS TABLE ────────────────────────────
-- Add link from application to its tailored output
ALTER TABLE public.applications
  ADD COLUMN IF NOT EXISTS tailored_output_id UUID REFERENCES public.tailored_outputs(id);

-- ── 3. RLS POLICIES ─────────────────────────────────────────
ALTER TABLE public.tailored_outputs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own tailored outputs"
  ON public.tailored_outputs FOR ALL
  USING (auth.uid() = user_id);

-- ── 4. UPDATED_AT TRIGGER ───────────────────────────────────
CREATE TRIGGER set_tailored_outputs_created
  BEFORE UPDATE ON public.tailored_outputs
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
