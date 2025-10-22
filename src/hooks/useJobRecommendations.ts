import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Database } from '@/integrations/supabase/types';
import { useAuth } from '@/contexts/AuthContext';

type Job = Database['public']['Tables']['jobs']['Row'];
type UserPreference = Database['public']['Tables']['user_preferences']['Row'];

interface RecommendationScore {
  job: Job;
  score: number;
  reasons: string[];
}

export function useJobRecommendations(limit: number = 10) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['job-recommendations', user?.id, limit],
    queryFn: async () => {
      if (!user) {
        // For non-authenticated users, return trending jobs
        const { data, error } = await supabase
          .from('jobs')
          .select('*')
          .eq('is_active', true)
          .order('published_at', { ascending: false })
          .limit(limit);

        if (error) throw error;
        return data || [];
      }

      // Get user preferences
      const { data: preferences, error: prefError } = await supabase
        .from('user_preferences')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (prefError && prefError.code !== 'PGRST116') {
        throw prefError;
      }

      // Get saved jobs to understand user interests
      const { data: savedJobs, error: savedError } = await supabase
        .from('saved_jobs')
        .select('job:jobs(*)')
        .eq('user_id', user.id);

      if (savedError) throw savedError;

      // Get all active jobs
      const { data: allJobs, error: jobsError } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true);

      if (jobsError) throw jobsError;
      if (!allJobs) return [];

      // Calculate recommendation scores
      const recommendations: RecommendationScore[] = allJobs.map((job) => {
        let score = 0;
        const reasons: string[] = [];

        // Check if already saved (exclude from recommendations)
        const isSaved = savedJobs?.some((sj: any) => sj.job?.id === job.id);
        if (isSaved) {
          return { job, score: -1000, reasons: ['Already saved'] };
        }

        // Score based on user preferences
        if (preferences) {
          // Match categories
          const userCategories = preferences.categories || [];
          if (userCategories.length > 0 && userCategories.includes(job.category)) {
            score += 50;
            reasons.push('Matches your category preferences');
          }

          // Match remote type
          const userRemoteTypes = preferences.remote_types || [];
          if (userRemoteTypes.length > 0 && job.remote_type && userRemoteTypes.includes(job.remote_type)) {
            score += 30;
            reasons.push('Matches your remote work preferences');
          }

          // Match company size
          const userCompanySizes = preferences.company_sizes || [];
          if (userCompanySizes.length > 0 && job.company_size && userCompanySizes.includes(job.company_size)) {
            score += 20;
            reasons.push('Matches your company size preferences');
          }

          // Match salary expectations
          if (preferences.min_salary && job.salary_max) {
            if (job.salary_max >= preferences.min_salary) {
              score += 25;
              reasons.push('Meets your salary expectations');
            }
          }
        }

        // Score based on saved jobs patterns
        if (savedJobs && savedJobs.length > 0) {
          const savedJobsData = savedJobs.map((sj: any) => sj.job).filter(Boolean);

          // Find common categories
          const savedCategories = savedJobsData.map((sj: Job) => sj.category);
          if (savedCategories.includes(job.category)) {
            score += 40;
            if (!reasons.includes('Matches your category preferences')) {
              reasons.push('Similar to jobs you saved');
            }
          }

          // Find common companies (user might be interested in specific companies)
          const savedCompanies = savedJobsData.map((sj: Job) => sj.company);
          if (savedCompanies.includes(job.company)) {
            score += 30;
            reasons.push('From a company you showed interest in');
          }

          // Find common remote types
          const savedRemoteTypes = savedJobsData.map((sj: Job) => sj.remote_type).filter(Boolean);
          if (job.remote_type && savedRemoteTypes.includes(job.remote_type)) {
            score += 15;
            if (!reasons.includes('Matches your remote work preferences')) {
              reasons.push('Similar remote work arrangement');
            }
          }
        }

        // Boost featured jobs slightly
        if (job.is_featured) {
          score += 10;
          reasons.push('Featured opportunity');
        }

        // Boost recent jobs
        const publishedDate = new Date(job.published_at);
        const now = new Date();
        const daysSincePublished = (now.getTime() - publishedDate.getTime()) / (1000 * 60 * 60 * 24);

        if (daysSincePublished < 3) {
          score += 15;
          reasons.push('Recently posted');
        } else if (daysSincePublished < 7) {
          score += 10;
          reasons.push('Posted this week');
        }

        return { job, score, reasons };
      });

      // Filter out saved jobs and sort by score
      const filteredRecommendations = recommendations
        .filter((r) => r.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);

      // If we don't have enough personalized recommendations, add some trending jobs
      if (filteredRecommendations.length < limit) {
        const trendingJobs = recommendations
          .filter((r) => r.score <= 0 && !r.reasons.includes('Already saved'))
          .sort((a, b) => {
            const aDate = new Date(a.job.published_at);
            const bDate = new Date(b.job.published_at);
            return bDate.getTime() - aDate.getTime();
          })
          .slice(0, limit - filteredRecommendations.length);

        return [
          ...filteredRecommendations.map((r) => r.job),
          ...trendingJobs.map((r) => r.job),
        ];
      }

      return filteredRecommendations.map((r) => r.job);
    },
    enabled: true,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });
}
