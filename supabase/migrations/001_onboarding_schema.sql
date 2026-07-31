-- Create profiles table
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    bio TEXT,
    github_url TEXT,
    linkedin_url TEXT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own profile." ON public.profiles
    FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile." ON public.profiles
    FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can update own profile." ON public.profiles
    FOR UPDATE USING (auth.uid() = id);

-- Create analysis_jobs table
CREATE TABLE IF NOT EXISTS public.analysis_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'PENDING',
    progress INTEGER NOT NULL DEFAULT 0,
    current_step TEXT NOT NULL DEFAULT 'Initializing',
    retry_count INTEGER NOT NULL DEFAULT 0,
    error_message TEXT,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for analysis_jobs
ALTER TABLE public.analysis_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own analysis jobs." ON public.analysis_jobs
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Service role can insert/update analysis jobs." ON public.analysis_jobs
    FOR ALL USING (true); -- Usually restricted by Supabase Service Role key

-- Create github_analysis table (Cached GitHub data)
CREATE TABLE IF NOT EXISTS public.github_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    profile_json JSONB NOT NULL,
    metrics_json JSONB NOT NULL,
    languages_json JSONB NOT NULL,
    frameworks_json JSONB NOT NULL,
    topics_json JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for github_analysis
ALTER TABLE public.github_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own github analysis." ON public.github_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- Create ai_analysis table
CREATE TABLE IF NOT EXISTS public.ai_analysis (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,
    overall_score INTEGER NOT NULL DEFAULT 0,
    frontend_score INTEGER NOT NULL DEFAULT 0,
    backend_score INTEGER NOT NULL DEFAULT 0,
    ai_score INTEGER NOT NULL DEFAULT 0,
    cloud_score INTEGER NOT NULL DEFAULT 0,
    game_dev_score INTEGER NOT NULL DEFAULT 0,
    cyber_score INTEGER NOT NULL DEFAULT 0,
    documentation_score INTEGER NOT NULL DEFAULT 0,
    problem_solving_score INTEGER NOT NULL DEFAULT 0,
    project_quality_score INTEGER NOT NULL DEFAULT 0,
    strengths JSONB NOT NULL,
    weaknesses JSONB NOT NULL,
    recommended_role TEXT,
    recommended_team JSONB,
    recommended_hackathons JSONB,
    learning_roadmap JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL
);

-- Enable RLS for ai_analysis
ALTER TABLE public.ai_analysis ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own ai analysis." ON public.ai_analysis
    FOR SELECT USING (auth.uid() = user_id);

-- Triggers for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_profiles_modtime
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_analysis_jobs_modtime
    BEFORE UPDATE ON public.analysis_jobs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_github_analysis_modtime
    BEFORE UPDATE ON public.github_analysis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_ai_analysis_modtime
    BEFORE UPDATE ON public.ai_analysis
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
