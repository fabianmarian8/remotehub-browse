-- Create jobs table
CREATE TABLE IF NOT EXISTS public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  
  -- Job Info
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  
  -- Location & Type
  location TEXT DEFAULT 'Worldwide',
  job_type TEXT CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Freelance')),
  
  -- Categories
  category TEXT NOT NULL,
  tags TEXT[],
  
  -- Salary
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  
  -- Application
  apply_url TEXT NOT NULL,
  company_url TEXT,
  company_logo_url TEXT,
  
  -- Metadata
  source TEXT NOT NULL,
  source_id TEXT,
  published_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Internal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Constraints
  CONSTRAINT unique_source_job UNIQUE(source, source_id)
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_jobs_published ON public.jobs(published_at DESC);
CREATE INDEX IF NOT EXISTS idx_jobs_category ON public.jobs(category);
CREATE INDEX IF NOT EXISTS idx_jobs_type ON public.jobs(job_type);
CREATE INDEX IF NOT EXISTS idx_jobs_active ON public.jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX IF NOT EXISTS idx_jobs_source ON public.jobs(source);

-- Full-text search index
CREATE INDEX IF NOT EXISTS idx_jobs_search ON public.jobs 
  USING GIN(to_tsvector('english', title || ' ' || company || ' ' || description));

-- Enable Row Level Security
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;

-- RLS Policies - Allow public read access
CREATE POLICY "Allow public read access" ON public.jobs
  FOR SELECT USING (is_active = TRUE);

-- Allow insert for service role (for scraper)
CREATE POLICY "Allow service role insert" ON public.jobs
  FOR INSERT WITH CHECK (true);

-- Allow update for service role
CREATE POLICY "Allow service role update" ON public.jobs
  FOR UPDATE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-update updated_at
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();
