-- ============================================================
--  APPLIMATIC — Supabase Database Schema
--  Paste this entire file into Supabase SQL Editor and run it.
-- ============================================================


-- ── 1. PROFILES TABLE ───────────────────────────────────────
-- Stores extra info about each user (extends Supabase's built-in auth)
CREATE TABLE public.profiles (
  id          UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name   TEXT,
  email       TEXT,
  avatar_url  TEXT,
  plan        TEXT DEFAULT 'free' CHECK (plan IN ('free', 'starter', 'pro')),
  apps_used   INTEGER DEFAULT 0,         -- applications used this billing period
  created_at  TIMESTAMPTZ DEFAULT NOW(),
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);


-- ── 2. RESUMES TABLE ────────────────────────────────────────
-- Stores the user's master resume file (uploaded once, used for every application)
CREATE TABLE public.resumes (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  file_name    TEXT NOT NULL,
  file_url     TEXT NOT NULL,           -- Supabase Storage URL
  file_size    INTEGER,                 -- in bytes
  content_text TEXT,                   -- extracted plain text for the AI to read
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);


-- ── 3. APPLICATIONS TABLE ───────────────────────────────────
-- Tracks every job application the user creates
CREATE TABLE public.applications (
  id                  UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id             UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  company_name        TEXT NOT NULL,
  job_title           TEXT NOT NULL,
  job_url             TEXT,
  job_description     TEXT,
  status              TEXT DEFAULT 'draft'
                      CHECK (status IN ('draft', 'applied', 'interview', 'offer', 'rejected')),
  tailored_resume_url TEXT,            -- Supabase Storage URL of the tailored output
  cover_letter_text   TEXT,
  notes               TEXT,
  applied_at          TIMESTAMPTZ,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);


-- ── 4. ROW LEVEL SECURITY (RLS) ─────────────────────────────
-- This makes sure users can ONLY see their own data. Never skip this.

ALTER TABLE public.profiles     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.resumes      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read and update only their own row
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Resumes: full access to own rows only
CREATE POLICY "Users manage own resumes"
  ON public.resumes FOR ALL USING (auth.uid() = user_id);

-- Applications: full access to own rows only
CREATE POLICY "Users manage own applications"
  ON public.applications FOR ALL USING (auth.uid() = user_id);


-- ── 5. STORAGE BUCKET ───────────────────────────────────────
-- Creates a private storage bucket for resume files.
-- (You also need to enable this in the Supabase dashboard under Storage.)
INSERT INTO storage.buckets (id, name, public)
VALUES ('resumes', 'resumes', false)
ON CONFLICT DO NOTHING;

-- Allow authenticated users to upload to their own folder
CREATE POLICY "Users upload own resumes"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users read own resumes"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users delete own resumes"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'resumes' AND auth.uid()::text = (storage.foldername(name))[1]);


-- ── 6. AUTO-CREATE PROFILE ON SIGNUP ────────────────────────
-- When a new user signs up, automatically create their profile row.
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ── 7. UPDATED_AT TRIGGER ───────────────────────────────────
-- Automatically updates the updated_at field whenever a row changes.
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_resumes_updated_at
  BEFORE UPDATE ON public.resumes
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_applications_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();
