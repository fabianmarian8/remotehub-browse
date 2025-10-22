import { useQuery } from '@tanstack/react-query'
import { supabase } from '@/integrations/supabase/client'
import { Database } from '@/integrations/supabase/types'

type Job = Database['public']['Tables']['jobs']['Row']

interface UseJobsOptions {
  category?: string
  jobType?: string
  search?: string
  limit?: number
  offset?: number
  salaryMin?: number
  salaryMax?: number
  categories?: string[]
  remoteTypes?: string[]
  companySizes?: string[]
}

export function useJobs(options: UseJobsOptions = {}) {
  const {
    category,
    jobType,
    search,
    limit = 20,
    offset = 0,
    salaryMin,
    salaryMax,
    categories,
    remoteTypes,
    companySizes,
  } = options

  return useQuery({
    queryKey: [
      'jobs',
      category,
      jobType,
      search,
      limit,
      offset,
      salaryMin,
      salaryMax,
      categories,
      remoteTypes,
      companySizes,
    ],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      // Legacy single category filter (for backwards compatibility)
      if (category) {
        query = query.eq('category', category)
      }

      // New multi-category filter (takes precedence)
      if (categories && categories.length > 0) {
        query = query.in('category', categories)
      }

      if (jobType) {
        query = query.eq('job_type', jobType)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`)
      }

      // Advanced filters
      if (salaryMin !== undefined) {
        query = query.gte('salary_max', salaryMin)
      }

      if (salaryMax !== undefined) {
        query = query.lte('salary_min', salaryMax)
      }

      if (remoteTypes && remoteTypes.length > 0) {
        query = query.in('remote_type', remoteTypes)
      }

      if (companySizes && companySizes.length > 0) {
        query = query.in('company_size', companySizes)
      }

      const { data, error, count } = await query

      if (error) {
        throw error
      }

      return {
        jobs: data as Job[],
        count: count || 0
      }
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  })
}
