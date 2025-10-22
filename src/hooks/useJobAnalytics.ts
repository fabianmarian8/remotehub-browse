import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

export interface TrendingCategory {
  category: string;
  count: number;
  growth: number; // percentage growth vs previous period
}

export interface LocationInsight {
  location: string;
  count: number;
  avgSalaryMin: number | null;
  avgSalaryMax: number | null;
}

export interface CompanyInsight {
  company: string;
  jobCount: number;
  isFeatured: boolean;
  companyLogoUrl: string | null;
  companyUrl: string | null;
  companySize: string | null;
}

export interface JobTrend {
  date: string;
  count: number;
}

export interface SalaryInsight {
  category: string;
  avgSalaryMin: number;
  avgSalaryMax: number;
  currency: string;
}

// Hook for trending categories
export function useTrendingCategories() {
  return useQuery({
    queryKey: ['analytics', 'trending-categories'],
    queryFn: async () => {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);

      // Get current period (last 30 days)
      const { data: currentData, error: currentError } = await supabase
        .from('jobs')
        .select('category')
        .eq('is_active', true)
        .gte('published_at', thirtyDaysAgo.toISOString());

      if (currentError) throw currentError;

      // Get previous period (30-60 days ago)
      const { data: previousData, error: previousError } = await supabase
        .from('jobs')
        .select('category')
        .eq('is_active', true)
        .gte('published_at', sixtyDaysAgo.toISOString())
        .lt('published_at', thirtyDaysAgo.toISOString());

      if (previousError) throw previousError;

      // Count categories in current period
      const currentCounts: Record<string, number> = {};
      currentData?.forEach((job) => {
        if (job.category) {
          currentCounts[job.category] = (currentCounts[job.category] || 0) + 1;
        }
      });

      // Count categories in previous period
      const previousCounts: Record<string, number> = {};
      previousData?.forEach((job) => {
        if (job.category) {
          previousCounts[job.category] = (previousCounts[job.category] || 0) + 1;
        }
      });

      // Calculate growth
      const trends: TrendingCategory[] = Object.entries(currentCounts).map(
        ([category, count]) => {
          const previousCount = previousCounts[category] || 0;
          const growth =
            previousCount > 0
              ? ((count - previousCount) / previousCount) * 100
              : count > 0
              ? 100
              : 0;

          return { category, count, growth };
        }
      );

      // Sort by count descending
      return trends.sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for location insights
export function useLocationInsights() {
  return useQuery({
    queryKey: ['analytics', 'location-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('location, salary_min, salary_max, salary_currency')
        .eq('is_active', true);

      if (error) throw error;

      // Group by location
      const locationMap: Record<
        string,
        {
          count: number;
          salaries: { min: number | null; max: number | null }[];
        }
      > = {};

      data?.forEach((job) => {
        const location = job.location || 'Not specified';
        if (!locationMap[location]) {
          locationMap[location] = { count: 0, salaries: [] };
        }
        locationMap[location].count++;
        locationMap[location].salaries.push({
          min: job.salary_min,
          max: job.salary_max,
        });
      });

      // Calculate averages
      const insights: LocationInsight[] = Object.entries(locationMap).map(
        ([location, data]) => {
          const validMins = data.salaries
            .map((s) => s.min)
            .filter((m): m is number => m !== null);
          const validMaxs = data.salaries
            .map((s) => s.max)
            .filter((m): m is number => m !== null);

          const avgSalaryMin =
            validMins.length > 0
              ? validMins.reduce((a, b) => a + b, 0) / validMins.length
              : null;
          const avgSalaryMax =
            validMaxs.length > 0
              ? validMaxs.reduce((a, b) => a + b, 0) / validMaxs.length
              : null;

          return {
            location,
            count: data.count,
            avgSalaryMin,
            avgSalaryMax,
          };
        }
      );

      // Sort by count descending
      return insights.sort((a, b) => b.count - a.count);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for company insights
export function useCompanyInsights() {
  return useQuery({
    queryKey: ['analytics', 'company-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('company, is_featured, company_logo_url, company_url, company_size')
        .eq('is_active', true);

      if (error) throw error;

      // Group by company
      const companyMap: Record<
        string,
        {
          count: number;
          isFeatured: boolean;
          companyLogoUrl: string | null;
          companyUrl: string | null;
          companySize: string | null;
        }
      > = {};

      data?.forEach((job) => {
        const company = job.company;
        if (!companyMap[company]) {
          companyMap[company] = {
            count: 0,
            isFeatured: job.is_featured || false,
            companyLogoUrl: job.company_logo_url,
            companyUrl: job.company_url,
            companySize: job.company_size,
          };
        }
        companyMap[company].count++;
        // Keep featured status if any job is featured
        if (job.is_featured) {
          companyMap[company].isFeatured = true;
        }
      });

      const insights: CompanyInsight[] = Object.entries(companyMap).map(
        ([company, data]) => ({
          company,
          jobCount: data.count,
          isFeatured: data.isFeatured,
          companyLogoUrl: data.companyLogoUrl,
          companyUrl: data.companyUrl,
          companySize: data.companySize,
        })
      );

      // Sort by featured first, then by job count
      return insights.sort((a, b) => {
        if (a.isFeatured && !b.isFeatured) return -1;
        if (!a.isFeatured && b.isFeatured) return 1;
        return b.jobCount - a.jobCount;
      });
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for job trends over time
export function useJobTrends(days: number = 30) {
  return useQuery({
    queryKey: ['analytics', 'job-trends', days],
    queryFn: async () => {
      const now = new Date();
      const startDate = new Date(now.getTime() - days * 24 * 60 * 60 * 1000);

      const { data, error } = await supabase
        .from('jobs')
        .select('published_at')
        .eq('is_active', true)
        .gte('published_at', startDate.toISOString())
        .order('published_at', { ascending: true });

      if (error) throw error;

      // Group by date
      const dateMap: Record<string, number> = {};
      data?.forEach((job) => {
        const date = new Date(job.published_at).toISOString().split('T')[0];
        dateMap[date] = (dateMap[date] || 0) + 1;
      });

      // Fill in missing dates with 0
      const trends: JobTrend[] = [];
      for (let i = 0; i < days; i++) {
        const date = new Date(startDate.getTime() + i * 24 * 60 * 60 * 1000);
        const dateStr = date.toISOString().split('T')[0];
        trends.push({
          date: dateStr,
          count: dateMap[dateStr] || 0,
        });
      }

      return trends;
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for salary insights by category
export function useSalaryInsights() {
  return useQuery({
    queryKey: ['analytics', 'salary-insights'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('jobs')
        .select('category, salary_min, salary_max, salary_currency')
        .eq('is_active', true)
        .not('salary_min', 'is', null)
        .not('salary_max', 'is', null);

      if (error) throw error;

      // Group by category and currency
      const categoryMap: Record<
        string,
        Record<
          string,
          { mins: number[]; maxs: number[] }
        >
      > = {};

      data?.forEach((job) => {
        if (!job.category || job.salary_min === null || job.salary_max === null) return;

        if (!categoryMap[job.category]) {
          categoryMap[job.category] = {};
        }

        const currency = job.salary_currency || 'USD';
        if (!categoryMap[job.category][currency]) {
          categoryMap[job.category][currency] = { mins: [], maxs: [] };
        }

        categoryMap[job.category][currency].mins.push(job.salary_min);
        categoryMap[job.category][currency].maxs.push(job.salary_max);
      });

      // Calculate averages
      const insights: SalaryInsight[] = [];
      Object.entries(categoryMap).forEach(([category, currencies]) => {
        Object.entries(currencies).forEach(([currency, salaries]) => {
          const avgSalaryMin =
            salaries.mins.reduce((a, b) => a + b, 0) / salaries.mins.length;
          const avgSalaryMax =
            salaries.maxs.reduce((a, b) => a + b, 0) / salaries.maxs.length;

          insights.push({
            category,
            avgSalaryMin,
            avgSalaryMax,
            currency,
          });
        });
      });

      // Sort by average salary (using max as reference)
      return insights.sort((a, b) => b.avgSalaryMax - a.avgSalaryMax);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}

// Hook for featured companies
export function useFeaturedCompanies(limit: number = 10) {
  return useQuery({
    queryKey: ['analytics', 'featured-companies', limit],
    queryFn: async () => {
      const { data: insights } = await supabase
        .from('jobs')
        .select('company, is_featured, company_logo_url, company_url, company_size')
        .eq('is_active', true)
        .eq('is_featured', true);

      if (!insights) return [];

      // Group by company
      const companyMap: Record<
        string,
        {
          count: number;
          companyLogoUrl: string | null;
          companyUrl: string | null;
          companySize: string | null;
        }
      > = {};

      insights.forEach((job) => {
        const company = job.company;
        if (!companyMap[company]) {
          companyMap[company] = {
            count: 0,
            companyLogoUrl: job.company_logo_url,
            companyUrl: job.company_url,
            companySize: job.company_size,
          };
        }
        companyMap[company].count++;
      });

      const companies: CompanyInsight[] = Object.entries(companyMap).map(
        ([company, data]) => ({
          company,
          jobCount: data.count,
          isFeatured: true,
          companyLogoUrl: data.companyLogoUrl,
          companyUrl: data.companyUrl,
          companySize: data.companySize,
        })
      );

      // Sort by job count and limit
      return companies
        .sort((a, b) => b.jobCount - a.jobCount)
        .slice(0, limit);
    },
    staleTime: 1000 * 60 * 30, // 30 minutes
  });
}
