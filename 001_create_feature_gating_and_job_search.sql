-- ============================================================
--  APPLIMATIC — WEEK 1 MIGRATION: Feature Gating + Job Search + Matching
--  Run this in Supabase SQL Editor AFTER all base schemas
--  This migration creates the infrastructure for:
--    1. Feature gating system (free/starter/pro tiers)
--    2. Job posting search + cache
--    3. Match results + scoring
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- PART 1: FEATURE GATING INFRASTRUCTURE
-- ════════════════════════════════════════════════════════════

-- ── TABLE: package_features ──────────────────────────────────
-- Defines which features are available in each tier and their limits
CREATE TABLE IF NOT EXISTS public.package_features (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  feature_key           TEXT UNIQUE NOT NULL,          -- e.g., 'tailor', 'search', 'differential'
  feature_name          TEXT NOT NULL,                 -- e.g., 'Resume Tailoring'
  description           TEXT,                          -- Feature description for UI
  free_tier             BOOLEAN DEFAULT FALSE,
  free_tier_limit       INTEGER DEFAULT 0,             -- max per month (0 = unlimited when enabled)
  starter_tier          BOOLEAN DEFAULT FALSE,
  starter_tier_limit    INTEGER DEFAULT 0,
  pro_tier              BOOLEAN DEFAULT FALSE,
  pro_tier_limit        INTEGER DEFAULT 0,             -- 0 = unlimited
  is_active             BOOLEAN DEFAULT TRUE,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

-- ── TABLE: feature_usage ─────────────────────────────────────
-- Tracks every feature usage event for analytics + quota enforcement
CREATE TABLE IF NOT EXISTS public.feature_usage (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_key           TEXT NOT NULL,
  tokens_used           INTEGER DEFAULT 0,             -- for Claude API calls
  response_time_ms      INTEGER DEFAULT 0,             -- latency tracking
  status                TEXT DEFAULT 'success',        -- 'success', 'error', 'rate_limited'
  error_message         TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_feature_usage_user_feature_date
  ON public.feature_usage(user_id, feature_key, DATE(created_at));

-- ── TABLE: usage_limits ──────────────────────────────────────
-- Tracks monthly quota for each user/feature combination
CREATE TABLE IF NOT EXISTS public.usage_limits (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  feature_key           TEXT NOT NULL,
  billing_year          INTEGER NOT NULL,
  billing_month         INTEGER NOT NULL,              -- 1-12
  used_count            INTEGER DEFAULT 0,
  reset_date            TIMESTAMPTZ NOT NULL,          -- when counter resets
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, feature_key, billing_year, billing_month)
);

CREATE INDEX IF NOT EXISTS idx_usage_limits_user_date
  ON public.usage_limits(user_id, billing_year, billing_month);

-- ── RLS: Feature gating tables (users can only see own data) ──
ALTER TABLE public.package_features DISABLE ROW LEVEL SECURITY;  -- Admin-controlled, all users can read
ALTER TABLE public.feature_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.usage_limits ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own feature usage"
  ON public.feature_usage FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view own usage limits"
  ON public.usage_limits FOR SELECT USING (auth.uid() = user_id);

-- System can insert usage records
CREATE POLICY "System can insert feature usage"
  ON public.feature_usage FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can insert usage limits"
  ON public.usage_limits FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "System can update usage limits"
  ON public.usage_limits FOR UPDATE USING (auth.uid() = user_id);

-- ── RPC FUNCTION: check_feature_limit ────────────────────────
-- Called by backend to check if user can access a feature
-- Returns: allowed (bool), used_count (int), limit (int), remaining (int)
CREATE OR REPLACE FUNCTION public.check_feature_limit(
  p_user_id UUID,
  p_feature_key TEXT
)
RETURNS TABLE (
  allowed BOOLEAN,
  used_count INTEGER,
  limit_count INTEGER,
  remaining INTEGER
) LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_plan TEXT;
  v_limit INTEGER;
  v_used INTEGER;
  v_year INTEGER;
  v_month INTEGER;
  v_allowed BOOLEAN;
BEGIN
  -- Get user's current plan
  SELECT plan INTO v_plan FROM public.profiles WHERE id = p_user_id;

  IF v_plan IS NULL THEN
    v_plan := 'free';
  END IF;

  -- Get current year/month
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_month := EXTRACT(MONTH FROM NOW())::INTEGER;

  -- Get feature limit based on plan
  CASE v_plan
    WHEN 'free' THEN
      SELECT free_tier, free_tier_limit INTO v_allowed, v_limit
      FROM public.package_features
      WHERE feature_key = p_feature_key;
    WHEN 'starter' THEN
      SELECT starter_tier, starter_tier_limit INTO v_allowed, v_limit
      FROM public.package_features
      WHERE feature_key = p_feature_key;
    WHEN 'pro' THEN
      SELECT pro_tier, pro_tier_limit INTO v_allowed, v_limit
      FROM public.package_features
      WHERE feature_key = p_feature_key;
    ELSE
      v_allowed := FALSE;
      v_limit := 0;
  END CASE;

  -- If feature not enabled for this plan, deny
  IF NOT v_allowed THEN
    RETURN QUERY SELECT FALSE, 0, 0, 0;
    RETURN;
  END IF;

  -- If limit is 0 (unlimited), allow
  IF v_limit = 0 THEN
    RETURN QUERY SELECT TRUE, 0, 0, 999999;
    RETURN;
  END IF;

  -- Get usage for current month
  SELECT COALESCE(used_count, 0) INTO v_used
  FROM public.usage_limits
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND billing_year = v_year
    AND billing_month = v_month;

  -- Create usage record if not exists
  INSERT INTO public.usage_limits (user_id, feature_key, billing_year, billing_month, used_count, reset_date)
  VALUES (p_user_id, p_feature_key, v_year, v_month, 0,
          DATE_TRUNC('month', NOW()) + INTERVAL '1 month')
  ON CONFLICT (user_id, feature_key, billing_year, billing_month) DO NOTHING;

  -- Return result
  RETURN QUERY SELECT
    (v_used < v_limit)::BOOLEAN,  -- allowed
    v_used,                         -- used_count
    v_limit,                        -- limit_count
    (v_limit - v_used)::INTEGER;   -- remaining
END;
$$;

-- ── RPC FUNCTION: increment_feature_usage ───────────────────
-- Called after a feature is used successfully
CREATE OR REPLACE FUNCTION public.increment_feature_usage(
  p_user_id UUID,
  p_feature_key TEXT,
  p_tokens_used INTEGER DEFAULT 0,
  p_response_time_ms INTEGER DEFAULT 0
)
RETURNS BOOLEAN LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_year INTEGER;
  v_month INTEGER;
BEGIN
  -- Get current year/month
  v_year := EXTRACT(YEAR FROM NOW())::INTEGER;
  v_month := EXTRACT(MONTH FROM NOW())::INTEGER;

  -- Log to feature_usage table
  INSERT INTO public.feature_usage (user_id, feature_key, tokens_used, response_time_ms, status)
  VALUES (p_user_id, p_feature_key, p_tokens_used, p_response_time_ms, 'success');

  -- Increment usage_limits counter
  UPDATE public.usage_limits
  SET used_count = used_count + 1,
      updated_at = NOW()
  WHERE user_id = p_user_id
    AND feature_key = p_feature_key
    AND billing_year = v_year
    AND billing_month = v_month;

  RETURN TRUE;
END;
$$;

-- ════════════════════════════════════════════════════════════
-- PART 2: JOB POSTING SEARCH & CACHE
-- ════════════════════════════════════════════════════════════

-- ── TABLE: job_postings ──────────────────────────────────────
-- Cache of LinkedIn job postings for fast searching and matching
CREATE TABLE IF NOT EXISTS public.job_postings (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  linkedin_job_id       TEXT UNIQUE,                   -- unique ID from LinkedIn API
  company_name          TEXT NOT NULL,
  job_title             TEXT NOT NULL,
  job_url               TEXT,
  description           TEXT,                          -- full job description
  posted_date           TIMESTAMPTZ,
  salary_min            DECIMAL(10, 2),
  salary_max            DECIMAL(10, 2),
  currency              TEXT DEFAULT 'USD',
  location              TEXT,
  seniority_level       TEXT,                          -- e.g., 'Entry', 'Mid', 'Senior', 'Director'
  employment_type       TEXT,                          -- 'Full-time', 'Contract', etc
  extracted_keywords    TEXT[] DEFAULT '{}',          -- parsed skills from description
  company_size          TEXT,                          -- 'Startup', 'Small', 'Medium', 'Large', 'Enterprise'
  industry              TEXT,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_job_postings_company_title
  ON public.job_postings(company_name, job_title);

CREATE INDEX IF NOT EXISTS idx_job_postings_created
  ON public.job_postings(created_at DESC);

-- ── TABLE: user_searches ─────────────────────────────────────
-- Tracks user search history for analytics
CREATE TABLE IF NOT EXISTS public.user_searches (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  search_query          TEXT NOT NULL,
  result_count          INTEGER,
  linkedin_sync_id      TEXT,                          -- LinkedIn API sync ID for debugging
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_user_searches_user_date
  ON public.user_searches(user_id, created_at DESC);

-- ── RLS: Job posting tables ──────────────────────────────────
ALTER TABLE public.job_postings DISABLE ROW LEVEL SECURITY;  -- Public data, all users can read
ALTER TABLE public.user_searches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own searches"
  ON public.user_searches FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert searches"
  ON public.user_searches FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- PART 3: MATCH RESULTS & SCORING
-- ════════════════════════════════════════════════════════════

-- ── TABLE: match_results ─────────────────────────────────────
-- Stores match scores for each job the user evaluates
CREATE TABLE IF NOT EXISTS public.match_results (
  id                    UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id               UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  job_posting_id        UUID REFERENCES public.job_postings(id) ON DELETE SET NULL,
  role_match_score      DECIMAL(5, 2),                 -- 0-100
  role_match_details    JSONB,                         -- { matched_skills: [], missing_skills: [] }
  salary_fit_score      DECIMAL(5, 2),                 -- 0-100
  salary_fit_details    JSONB,                         -- { salary_range: "", alignment: "" }
  culture_fit_score     DECIMAL(5, 2),                 -- 0-100
  culture_fit_details   JSONB,                         -- { culture_keywords: [], fit_level: "" }
  overall_score         DECIMAL(5, 2),                 -- weighted average of above three
  recommendation        TEXT,                          -- 'strong_match', 'good_match', 'weak_match'
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_match_results_user_job
  ON public.match_results(user_id, job_posting_id);

CREATE INDEX IF NOT EXISTS idx_match_results_user_date
  ON public.match_results(user_id, created_at DESC);

-- ── RLS: Match results (users can only see own) ───────────────
ALTER TABLE public.match_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own match results"
  ON public.match_results FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "System can insert match results"
  ON public.match_results FOR INSERT WITH CHECK (auth.uid() = user_id);

-- ════════════════════════════════════════════════════════════
-- PART 4: SEED DATA FOR FEATURE GATING
-- ════════════════════════════════════════════════════════════

-- Truncate existing features (if any) to avoid duplicates
DELETE FROM public.package_features WHERE feature_key IN ('search', 'tailor', 'differential', 'interview_prep');

-- Insert feature definitions for all tiers
INSERT INTO public.package_features
  (feature_key, feature_name, description, free_tier, free_tier_limit, starter_tier, starter_tier_limit, pro_tier, pro_tier_limit, is_active)
VALUES
  -- Search feature
  ('search', 'Job Search', 'Search LinkedIn for job openings',
   TRUE, 10,      -- free: 10 per month
   TRUE, 50,      -- starter: 50 per month
   TRUE, 0),      -- pro: unlimited

  -- Tailor feature
  ('tailor', 'Resume Tailoring', 'AI-tailored resume and cover letter',
   TRUE, 3,       -- free: 3 per month
   TRUE, 20,      -- starter: 20 per month
   TRUE, 0),      -- pro: unlimited

  -- Differential analysis (match scoring)
  ('differential', 'Match Analysis', 'See how well you fit a job',
   FALSE, 0,      -- free: no access
   TRUE, 5,       -- starter: 5 per month
   TRUE, 0),      -- pro: unlimited

  -- Interview prep
  ('interview_prep', 'Interview Prep', 'AI-generated interview questions',
   FALSE, 0,      -- free: no access
   TRUE, 5,       -- starter: 5 per month
   TRUE, 0);      -- pro: unlimited

-- ════════════════════════════════════════════════════════════
-- PART 5: UPDATED_AT TRIGGERS FOR NEW TABLES
-- ════════════════════════════════════════════════════════════

CREATE TRIGGER set_package_features_updated_at
  BEFORE UPDATE ON public.package_features
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_usage_limits_updated_at
  BEFORE UPDATE ON public.usage_limits
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_job_postings_updated_at
  BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- ════════════════════════════════════════════════════════════
-- VERIFY: Run these SELECT statements to confirm everything worked
-- ════════════════════════════════════════════════════════════

-- Check feature gating tables exist
SELECT 'package_features' AS table_name, COUNT(*) AS rows FROM public.package_features
UNION ALL
SELECT 'feature_usage', COUNT(*) FROM public.feature_usage
UNION ALL
SELECT 'usage_limits', COUNT(*) FROM public.usage_limits
UNION ALL
SELECT 'job_postings', COUNT(*) FROM public.job_postings
UNION ALL
SELECT 'user_searches', COUNT(*) FROM public.user_searches
UNION ALL
SELECT 'match_results', COUNT(*) FROM public.match_results;

-- Test RPC function: check_feature_limit
-- Uncomment to test (replace with real user_id from your database)
-- SELECT * FROM public.check_feature_limit('your-user-uuid-here'::UUID, 'tailor');
