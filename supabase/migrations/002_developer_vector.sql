-- ============================================================
-- HackathonHub — Migration 002: Developer Vector + AI Pipeline
-- Run this in Supabase Dashboard → SQL Editor
-- ============================================================

-- ==========================================
-- Add missing columns to ai_analysis
-- ==========================================
ALTER TABLE public.ai_analysis
  ADD COLUMN IF NOT EXISTS professional_summary TEXT,
  ADD COLUMN IF NOT EXISTS experience_level TEXT;

-- ==========================================
-- Add raw storage + content hash to github_analysis
-- ==========================================
ALTER TABLE public.github_analysis
  ADD COLUMN IF NOT EXISTS raw_json JSONB,
  ADD COLUMN IF NOT EXISTS repo_hash TEXT;

-- ==========================================
-- Developer Vector table
-- Stores the full AI-generated skill vector
-- Used for team formation without re-calling AI
-- ==========================================
CREATE TABLE IF NOT EXISTS public.developer_vectors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
  frontend_score INTEGER NOT NULL DEFAULT 0,
  backend_score INTEGER NOT NULL DEFAULT 0,
  database_score INTEGER NOT NULL DEFAULT 0,
  cloud_score INTEGER NOT NULL DEFAULT 0,
  ai_score INTEGER NOT NULL DEFAULT 0,
  mobile_score INTEGER NOT NULL DEFAULT 0,
  problem_solving_score INTEGER NOT NULL DEFAULT 0,
  leadership_score INTEGER NOT NULL DEFAULT 0,
  overall_score INTEGER NOT NULL DEFAULT 0,
  recommended_role TEXT,
  experience_level TEXT,
  professional_summary TEXT,
  project_complexity TEXT,
  confidence INTEGER DEFAULT 0,
  prompt_version TEXT NOT NULL DEFAULT 'v1',
  analyzed_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.developer_vectors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own developer vector." ON public.developer_vectors
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE POLICY "Service role can manage developer vectors." ON public.developer_vectors
  FOR ALL USING (true);

-- ==========================================
-- Allow service role writes to analysis tables
-- The service role key bypasses RLS by default,
-- but explicit policies ensure forward compatibility.
-- ==========================================

-- github_analysis write policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'github_analysis'
      AND policyname = 'Service role can write github analysis.'
  ) THEN
    CREATE POLICY "Service role can write github analysis." ON public.github_analysis
      FOR ALL USING (true);
  END IF;
END$$;

-- ai_analysis write policy
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'ai_analysis'
      AND policyname = 'Service role can write ai analysis.'
  ) THEN
    CREATE POLICY "Service role can write ai analysis." ON public.ai_analysis
      FOR ALL USING (true);
  END IF;
END$$;

-- skill_scores write policy (might already exist from schema.sql)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE tablename = 'skill_scores'
      AND policyname = 'Service role can write skill scores.'
  ) THEN
    CREATE POLICY "Service role can write skill scores." ON public.skill_scores
      FOR ALL USING (true);
  END IF;
END$$;

-- ==========================================
-- Trigger for developer_vectors updated_at
-- Reuses the function created in migration 001
-- ==========================================
DROP TRIGGER IF EXISTS update_developer_vectors_modtime ON public.developer_vectors;
CREATE TRIGGER update_developer_vectors_modtime
  BEFORE UPDATE ON public.developer_vectors
  FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ==========================================
-- Index for performance
-- ==========================================
CREATE INDEX IF NOT EXISTS idx_developer_vectors_user ON public.developer_vectors(user_id);
CREATE INDEX IF NOT EXISTS idx_github_analysis_user ON public.github_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user ON public.ai_analysis(user_id);
