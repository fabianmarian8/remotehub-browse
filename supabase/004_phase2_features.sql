-- Phase 2 Features Migration
-- Adds: saved jobs, email alerts, advanced filters, better salary display

-- ============================================
-- 1. Enhance jobs table with new columns
-- ============================================

-- Add remote work type
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS remote_type TEXT
CHECK (remote_type IN ('fully-remote', 'hybrid', 'on-site', 'timezone-specific'));

-- Add company size
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS company_size TEXT
CHECK (company_size IN ('startup', 'small', 'medium', 'large', 'enterprise'));

-- Add salary period for better display
ALTER TABLE public.jobs
ADD COLUMN IF NOT EXISTS salary_period TEXT
DEFAULT 'yearly'
CHECK (salary_period IN ('yearly', 'hourly', 'monthly', 'project'));

-- Create indexes for new columns
CREATE INDEX IF NOT EXISTS idx_jobs_remote_type ON public.jobs(remote_type);
CREATE INDEX IF NOT EXISTS idx_jobs_company_size ON public.jobs(company_size);
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range ON public.jobs(salary_min, salary_max) WHERE salary_min IS NOT NULL;

-- ============================================
-- 2. Create saved_jobs table (favorites)
-- ============================================

CREATE TABLE IF NOT EXISTS public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Prevent duplicate saves
  CONSTRAINT unique_user_job UNIQUE(user_id, job_id)
);

-- Index for fast user lookups
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user ON public.saved_jobs(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_job ON public.saved_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_saved_jobs_created ON public.saved_jobs(created_at DESC);

-- Enable RLS
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies for saved_jobs
CREATE POLICY "Users can view their own saved jobs" ON public.saved_jobs
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can save jobs" ON public.saved_jobs
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unsave their jobs" ON public.saved_jobs
  FOR DELETE USING (auth.uid() = user_id);

-- ============================================
-- 3. Create user_preferences table (email alerts)
-- ============================================

CREATE TABLE IF NOT EXISTS public.user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Filter preferences
  categories TEXT[] DEFAULT '{}',
  job_types TEXT[] DEFAULT '{}',
  remote_types TEXT[] DEFAULT '{}',
  company_sizes TEXT[] DEFAULT '{}',
  salary_min INTEGER,
  salary_max INTEGER,
  keywords TEXT[] DEFAULT '{}',

  -- Email alert settings
  email_alerts_enabled BOOLEAN DEFAULT FALSE,
  alert_frequency TEXT DEFAULT 'daily' CHECK (alert_frequency IN ('daily', 'weekly', 'instant')),
  last_alert_sent_at TIMESTAMPTZ,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- One preference per user
  CONSTRAINT unique_user_preference UNIQUE(user_id)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS idx_user_preferences_user ON public.user_preferences(user_id);
CREATE INDEX IF NOT EXISTS idx_user_preferences_alerts ON public.user_preferences(email_alerts_enabled)
  WHERE email_alerts_enabled = TRUE;

-- Enable RLS
ALTER TABLE public.user_preferences ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_preferences
CREATE POLICY "Users can view their own preferences" ON public.user_preferences
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their preferences" ON public.user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their preferences" ON public.user_preferences
  FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to update updated_at
CREATE TRIGGER set_user_preferences_updated_at
  BEFORE UPDATE ON public.user_preferences
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- ============================================
-- 4. Create email_alerts_log table (tracking)
-- ============================================

CREATE TABLE IF NOT EXISTS public.email_alerts_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  jobs_sent INTEGER DEFAULT 0,
  sent_at TIMESTAMPTZ DEFAULT NOW(),
  status TEXT DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'bounced'))
);

-- Index for tracking
CREATE INDEX IF NOT EXISTS idx_email_alerts_log_user ON public.email_alerts_log(user_id);
CREATE INDEX IF NOT EXISTS idx_email_alerts_log_sent ON public.email_alerts_log(sent_at DESC);

-- Enable RLS
ALTER TABLE public.email_alerts_log ENABLE ROW LEVEL SECURITY;

-- RLS Policy
CREATE POLICY "Users can view their own alert logs" ON public.email_alerts_log
  FOR SELECT USING (auth.uid() = user_id);

-- ============================================
-- 5. Create helper views
-- ============================================

-- View for jobs with save count (for trending/popular)
CREATE OR REPLACE VIEW public.jobs_with_stats AS
SELECT
  j.*,
  COUNT(DISTINCT sj.user_id) as save_count,
  CASE
    WHEN j.published_at > NOW() - INTERVAL '24 hours' THEN true
    ELSE false
  END as is_new
FROM public.jobs j
LEFT JOIN public.saved_jobs sj ON j.id = sj.job_id
GROUP BY j.id;

-- ============================================
-- 6. Create function to check if job is saved by user
-- ============================================

CREATE OR REPLACE FUNCTION public.is_job_saved(job_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.saved_jobs
    WHERE saved_jobs.job_id = $1 AND saved_jobs.user_id = $2
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 7. Create function to get matching jobs for user preferences
-- ============================================

CREATE OR REPLACE FUNCTION public.get_jobs_for_preferences(pref_user_id UUID, since_date TIMESTAMPTZ)
RETURNS TABLE (
  id UUID,
  title TEXT,
  company TEXT,
  location TEXT,
  salary_min INTEGER,
  salary_max INTEGER,
  published_at TIMESTAMPTZ,
  apply_url TEXT
) AS $$
DECLARE
  prefs RECORD;
BEGIN
  -- Get user preferences
  SELECT * INTO prefs FROM public.user_preferences WHERE user_id = pref_user_id;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Return matching jobs
  RETURN QUERY
  SELECT
    j.id, j.title, j.company, j.location,
    j.salary_min, j.salary_max, j.published_at, j.apply_url
  FROM public.jobs j
  WHERE
    j.is_active = TRUE
    AND j.published_at >= since_date
    AND (prefs.categories = '{}' OR j.category = ANY(prefs.categories))
    AND (prefs.job_types = '{}' OR j.job_type = ANY(prefs.job_types))
    AND (prefs.remote_types = '{}' OR j.remote_type = ANY(prefs.remote_types))
    AND (prefs.company_sizes = '{}' OR j.company_size = ANY(prefs.company_sizes))
    AND (prefs.salary_min IS NULL OR j.salary_max >= prefs.salary_min)
    AND (prefs.salary_max IS NULL OR j.salary_min <= prefs.salary_max)
  ORDER BY j.published_at DESC;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- 8. Add sample data to existing jobs (optional)
-- ============================================

-- Update existing jobs with random remote_type and company_size
UPDATE public.jobs
SET
  remote_type = CASE (RANDOM() * 4)::INT
    WHEN 0 THEN 'fully-remote'
    WHEN 1 THEN 'hybrid'
    WHEN 2 THEN 'on-site'
    ELSE 'timezone-specific'
  END,
  company_size = CASE (RANDOM() * 5)::INT
    WHEN 0 THEN 'startup'
    WHEN 1 THEN 'small'
    WHEN 2 THEN 'medium'
    WHEN 3 THEN 'large'
    ELSE 'enterprise'
  END
WHERE remote_type IS NULL OR company_size IS NULL;

-- ============================================
-- Migration complete!
-- ============================================
