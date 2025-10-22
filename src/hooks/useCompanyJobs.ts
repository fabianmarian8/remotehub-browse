import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';

type Job = Database['public']['Tables']['jobs']['Row'];

export function useCompanyJobs(companyName: string) {
  return useQuery({
    queryKey: ['company-jobs', companyName],
    queryFn: async () => {
      const { data, error, count } = await supabase
        .from('jobs')
        .select('*', { count: 'exact' })
        .eq('company', companyName)
        .eq('is_active', true)
        .order('published_at', { ascending: false });

      if (error) throw error;

      return { jobs: data || [], count: count || 0 };
    },
    enabled: !!companyName,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useCompanyDetails(companyName: string) {
  return useQuery({
    queryKey: ['company-details', companyName],
    queryFn: async () => {
      // Get the first job to extract company details
      const { data, error } = await supabase
        .from('jobs')
        .select('company, company_logo_url, company_url, company_size')
        .eq('company', companyName)
        .eq('is_active', true)
        .limit(1)
        .single();

      if (error) throw error;

      return {
        name: data.company,
        logoUrl: data.company_logo_url,
        websiteUrl: data.company_url,
        size: data.company_size,
      };
    },
    enabled: !!companyName,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
