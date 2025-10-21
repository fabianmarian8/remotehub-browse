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
}

export function useJobs(options: UseJobsOptions = {}) {
  const { category, jobType, search, limit = 20, offset = 0 } = options

  return useQuery({
    queryKey: ['jobs', category, jobType, search, limit, offset],
    queryFn: async () => {
      let query = supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('is_active', true)
        .order('published_at', { ascending: false })
        .range(offset, offset + limit - 1)

      if (category) {
        query = query.eq('category', category)
      }

      if (jobType) {
        query = query.eq('job_type', jobType)
      }

      if (search) {
        query = query.or(`title.ilike.%${search}%,company.ilike.%${search}%,description.ilike.%${search}%`)
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
