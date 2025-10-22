-- Fix RLS Policies for jobs table
-- This resolves the issue where service_role couldn't properly insert jobs

-- Step 1: Drop existing problematic policies
DROP POLICY IF EXISTS "Allow service role insert" ON public.jobs;
DROP POLICY IF EXISTS "Allow service role update" ON public.jobs;
DROP POLICY IF EXISTS "Allow public read access" ON public.jobs;

-- Step 2: Create proper policies with explicit role targeting

-- Policy for public read (anonymous and authenticated users)
CREATE POLICY "Public can view active jobs"
ON public.jobs
FOR SELECT
TO anon, authenticated
USING (is_active = TRUE);

-- Policy for service role - INSERT
CREATE POLICY "Service role can insert jobs"
ON public.jobs
FOR INSERT
TO service_role
WITH CHECK (true);

-- Policy for service role - UPDATE
CREATE POLICY "Service role can update jobs"
ON public.jobs
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);

-- Policy for service role - SELECT (for debugging and deactivation)
CREATE POLICY "Service role can select all jobs"
ON public.jobs
FOR SELECT
TO service_role
USING (true);

-- Step 3: Verify policies
SELECT schemaname, tablename, policyname, roles, cmd, qual, with_check
FROM pg_policies
WHERE tablename = 'jobs'
ORDER BY policyname;

-- Step 4: Check current job counts by source
SELECT source, is_active, COUNT(*) as count
FROM public.jobs
GROUP BY source, is_active
ORDER BY source, is_active;
