-- Phase 4: Database Optimizations for Scale
-- Optimize database to handle thousands of jobs efficiently

-- Add composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_jobs_active_published
  ON public.jobs(is_active, published_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_jobs_category_active
  ON public.jobs(category, is_active, published_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_jobs_type_active
  ON public.jobs(job_type, is_active, published_at DESC)
  WHERE is_active = TRUE;

CREATE INDEX IF NOT EXISTS idx_jobs_source_active
  ON public.jobs(source, is_active, published_at DESC)
  WHERE is_active = TRUE;

-- Optimize salary range queries
CREATE INDEX IF NOT EXISTS idx_jobs_salary_range_active
  ON public.jobs(salary_min, salary_max, is_active)
  WHERE is_active = TRUE AND salary_min IS NOT NULL;

-- Add index for remote type filtering
CREATE INDEX IF NOT EXISTS idx_jobs_remote_active
  ON public.jobs(remote_type, is_active, published_at DESC)
  WHERE is_active = TRUE;

-- Add index for company filtering
CREATE INDEX IF NOT EXISTS idx_jobs_company_active
  ON public.jobs(company, is_active, published_at DESC)
  WHERE is_active = TRUE;

-- Add index for location filtering
CREATE INDEX IF NOT EXISTS idx_jobs_location_active
  ON public.jobs(location, is_active, published_at DESC)
  WHERE is_active = TRUE;

-- Improve full-text search with trigram index for better fuzzy matching
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Drop old GIN index and create a more efficient one
DROP INDEX IF EXISTS idx_jobs_search;
CREATE INDEX idx_jobs_search_trgm ON public.jobs
  USING GIN (
    (title || ' ' || company || ' ' || coalesce(description, '')) gin_trgm_ops
  )
  WHERE is_active = TRUE;

-- Also keep a traditional ts_vector index for exact matches
CREATE INDEX idx_jobs_search_tsvector ON public.jobs
  USING GIN(to_tsvector('english', title || ' ' || company || ' ' || coalesce(description, '')))
  WHERE is_active = TRUE;

-- Add index for tags array searches
CREATE INDEX IF NOT EXISTS idx_jobs_tags_gin
  ON public.jobs USING GIN(tags)
  WHERE is_active = TRUE;

-- Optimize for date range queries (new jobs, trending)
CREATE INDEX IF NOT EXISTS idx_jobs_recent
  ON public.jobs(published_at DESC, is_active)
  WHERE is_active = TRUE
    AND published_at > (NOW() - INTERVAL '7 days');

-- Add index for featured jobs
CREATE INDEX IF NOT EXISTS idx_jobs_featured
  ON public.jobs(is_featured, published_at DESC, is_active)
  WHERE is_active = TRUE AND is_featured = TRUE;

-- Optimize saved_jobs queries
CREATE INDEX IF NOT EXISTS idx_saved_jobs_user_created
  ON public.saved_jobs(user_id, created_at DESC);

-- Optimize user_preferences queries
CREATE INDEX IF NOT EXISTS idx_user_preferences_alerts
  ON public.user_preferences(email_alerts_enabled, alert_frequency)
  WHERE email_alerts_enabled = TRUE;

-- Add partial index for jobs needing alerts
CREATE INDEX IF NOT EXISTS idx_jobs_for_alerts
  ON public.jobs(published_at DESC, category, is_active)
  WHERE is_active = TRUE
    AND published_at > (NOW() - INTERVAL '24 hours');

-- Create materialized view for job statistics (updated periodically)
CREATE MATERIALIZED VIEW IF NOT EXISTS job_statistics AS
SELECT
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_jobs,
  COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '24 hours') as jobs_24h,
  COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '7 days') as jobs_7d,
  COUNT(*) FILTER (WHERE is_featured = TRUE) as featured_jobs,
  COUNT(DISTINCT company) as total_companies,
  COUNT(DISTINCT category) as total_categories,
  COUNT(DISTINCT source) as total_sources,
  AVG(salary_max) FILTER (WHERE salary_max IS NOT NULL) as avg_max_salary,
  AVG(salary_min) FILTER (WHERE salary_min IS NOT NULL) as avg_min_salary,
  MAX(published_at) as latest_job_date,
  NOW() as last_updated
FROM public.jobs;

-- Create unique index on materialized view for concurrent refresh
CREATE UNIQUE INDEX IF NOT EXISTS job_statistics_unique ON job_statistics ((1));

-- Create function to refresh statistics
CREATE OR REPLACE FUNCTION refresh_job_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY job_statistics;
END;
$$ LANGUAGE plpgsql;

-- Add source statistics view
CREATE MATERIALIZED VIEW IF NOT EXISTS source_statistics AS
SELECT
  source,
  COUNT(*) as total_jobs,
  COUNT(*) FILTER (WHERE is_active = TRUE) as active_jobs,
  COUNT(*) FILTER (WHERE published_at > NOW() - INTERVAL '24 hours') as jobs_24h,
  MAX(published_at) as latest_job_date,
  MIN(published_at) as first_job_date,
  NOW() as last_updated
FROM public.jobs
GROUP BY source;

-- Create index for source statistics
CREATE UNIQUE INDEX IF NOT EXISTS source_statistics_source ON source_statistics(source);

-- Create function to refresh source statistics
CREATE OR REPLACE FUNCTION refresh_source_statistics()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY source_statistics;
END;
$$ LANGUAGE plpgsql;

-- Optimize table with VACUUM and ANALYZE
-- Note: This should be run periodically via cron or scheduled task
ANALYZE public.jobs;
ANALYZE public.saved_jobs;
ANALYZE public.user_preferences;

-- Add table partitioning by published_at for even better performance (optional, for very large scale)
-- This is commented out but can be enabled if job count exceeds 100k+
/*
-- Create partitioned table
CREATE TABLE IF NOT EXISTS jobs_partitioned (
  LIKE jobs INCLUDING ALL
) PARTITION BY RANGE (published_at);

-- Create partitions (example: monthly partitions)
CREATE TABLE jobs_2024_01 PARTITION OF jobs_partitioned
  FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');

CREATE TABLE jobs_2024_02 PARTITION OF jobs_partitioned
  FOR VALUES FROM ('2024-02-01') TO ('2024-03-01');

-- Continue for other months...
-- Partitioning should be managed by a scheduled job
*/

-- Create function to clean up very old inactive jobs (older than 6 months)
CREATE OR REPLACE FUNCTION cleanup_old_jobs()
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM public.jobs
  WHERE is_active = FALSE
    AND published_at < NOW() - INTERVAL '6 months';

  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Grant necessary permissions
GRANT SELECT ON job_statistics TO anon, authenticated;
GRANT SELECT ON source_statistics TO anon, authenticated;

-- Comment on optimization changes
COMMENT ON INDEX idx_jobs_active_published IS 'Composite index for active jobs ordered by published date - most common query';
COMMENT ON INDEX idx_jobs_search_trgm IS 'Trigram index for fuzzy full-text search across title, company, and description';
COMMENT ON MATERIALIZED VIEW job_statistics IS 'Cached statistics for dashboard - refresh every hour';
COMMENT ON MATERIALIZED VIEW source_statistics IS 'Statistics per job source - refresh every hour';
COMMENT ON FUNCTION refresh_job_statistics IS 'Refreshes job statistics materialized view - schedule hourly';
COMMENT ON FUNCTION cleanup_old_jobs IS 'Removes inactive jobs older than 6 months - schedule weekly';

-- Log completion
DO $$
BEGIN
  RAISE NOTICE 'Phase 4 database optimizations completed successfully';
  RAISE NOTICE 'Added % indexes for improved query performance', 15;
  RAISE NOTICE 'Created 2 materialized views for statistics';
  RAISE NOTICE 'Recommendation: Schedule refresh_job_statistics() hourly';
  RAISE NOTICE 'Recommendation: Schedule cleanup_old_jobs() weekly';
END $$;
