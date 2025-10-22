/**
 * Algolia Search Hook
 * Provides instant search functionality with Algolia
 * Falls back to Supabase search if Algolia is not configured
 */

import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { jobsIndex, isAlgoliaConfigured, searchConfig } from '@/lib/algolia';
import { useJobs } from './useJobs';
import { Job } from '@/integrations/supabase/types';

export interface AlgoliaSearchOptions {
  query: string;
  category?: string;
  jobType?: string;
  remoteTypes?: string[];
  companySizes?: string[];
  salaryMin?: number;
  salaryMax?: number;
  page?: number;
  hitsPerPage?: number;
}

export interface AlgoliaSearchResult {
  hits: Job[];
  nbHits: number;
  nbPages: number;
  page: number;
  processingTimeMS: number;
}

/**
 * Hook for Algolia-powered instant search
 * Automatically falls back to Supabase if Algolia is not configured
 */
export function useAlgoliaSearch(options: AlgoliaSearchOptions) {
  const {
    query,
    category,
    jobType,
    remoteTypes,
    companySizes,
    salaryMin,
    salaryMax,
    page = 0,
    hitsPerPage = searchConfig.hitsPerPage,
  } = options;

  const algoliaEnabled = isAlgoliaConfigured();

  // Fallback to regular Supabase search if Algolia not configured
  const supabaseSearch = useJobs({
    search: query,
    category,
    jobType,
    remoteTypes,
    companySizes,
    salaryMin,
    salaryMax,
    offset: page * hitsPerPage,
    limit: hitsPerPage,
  });

  // Algolia search query
  const algoliaSearch = useQuery({
    queryKey: ['algolia-search', query, category, jobType, remoteTypes, companySizes, salaryMin, salaryMax, page],
    queryFn: async () => {
      if (!algoliaEnabled || !query) {
        return null;
      }

      // Build filters
      const filters: string[] = [];

      if (category) {
        filters.push(`category:"${category}"`);
      }

      if (jobType) {
        filters.push(`job_type:"${jobType}"`);
      }

      if (remoteTypes && remoteTypes.length > 0) {
        const remoteFilter = remoteTypes.map(type => `remote_type:"${type}"`).join(' OR ');
        filters.push(`(${remoteFilter})`);
      }

      if (companySizes && companySizes.length > 0) {
        const sizeFilter = companySizes.map(size => `company_size:"${size}"`).join(' OR ');
        filters.push(`(${sizeFilter})`);
      }

      if (salaryMin !== undefined) {
        filters.push(`salary_max >= ${salaryMin}`);
      }

      if (salaryMax !== undefined) {
        filters.push(`salary_min <= ${salaryMax}`);
      }

      // Add active jobs filter
      filters.push('is_active:true');

      const filterString = filters.join(' AND ');

      // Perform search
      const result = await jobsIndex.search(query, {
        page,
        hitsPerPage,
        filters: filterString,
        ...searchConfig,
      });

      return {
        hits: result.hits as unknown as Job[],
        nbHits: result.nbHits,
        nbPages: result.nbPages,
        page: result.page,
        processingTimeMS: result.processingTimeMS,
      };
    },
    enabled: algoliaEnabled && Boolean(query),
    staleTime: 1000 * 60 * 2, // 2 minutes
  });

  // Return appropriate search results based on Algolia availability
  if (!algoliaEnabled || !query) {
    // Use Supabase search as fallback
    return {
      data: supabaseSearch.data ? {
        hits: supabaseSearch.data.jobs,
        nbHits: supabaseSearch.data.count,
        nbPages: Math.ceil(supabaseSearch.data.count / hitsPerPage),
        page,
        processingTimeMS: 0,
      } : undefined,
      isLoading: supabaseSearch.isLoading,
      error: supabaseSearch.error,
      isAlgolia: false,
    };
  }

  return {
    data: algoliaSearch.data || undefined,
    isLoading: algoliaSearch.isLoading,
    error: algoliaSearch.error,
    isAlgolia: true,
  };
}

/**
 * Hook for instant search suggestions (autocomplete)
 */
export function useSearchSuggestions(query: string, limit: number = 5) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!query || query.length < 2 || !isAlgoliaConfigured()) {
      setSuggestions([]);
      return;
    }

    const fetchSuggestions = async () => {
      setIsLoading(true);
      try {
        const result = await jobsIndex.search(query, {
          hitsPerPage: limit,
          attributesToRetrieve: ['title', 'company'],
          highlightPreTag: '',
          highlightPostTag: '',
        });

        // Extract unique suggestions from titles and companies
        const titleSuggestions = result.hits.map((hit: any) => hit.title);
        const companySuggestions = result.hits.map((hit: any) => hit.company);
        const allSuggestions = [...new Set([...titleSuggestions, ...companySuggestions])];

        setSuggestions(allSuggestions.slice(0, limit));
      } catch (error) {
        console.error('Error fetching suggestions:', error);
        setSuggestions([]);
      } finally {
        setIsLoading(false);
      }
    };

    // Debounce search
    const timeoutId = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timeoutId);
  }, [query, limit]);

  return { suggestions, isLoading };
}
