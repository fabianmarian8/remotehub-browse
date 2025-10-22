/**
 * Algolia Search Configuration
 * Provides instant search capabilities for job listings
 */

import algoliasearch from 'algoliasearch/lite';

// Algolia credentials (should be set in environment variables)
const ALGOLIA_APP_ID = import.meta.env.VITE_ALGOLIA_APP_ID || '';
const ALGOLIA_SEARCH_API_KEY = import.meta.env.VITE_ALGOLIA_SEARCH_API_KEY || '';
const ALGOLIA_INDEX_NAME = import.meta.env.VITE_ALGOLIA_INDEX_NAME || 'jobs';

// Create Algolia client
export const searchClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_SEARCH_API_KEY);

// Get search index
export const jobsIndex = searchClient.initIndex(ALGOLIA_INDEX_NAME);

/**
 * Check if Algolia is configured
 */
export function isAlgoliaConfigured(): boolean {
  return Boolean(ALGOLIA_APP_ID && ALGOLIA_SEARCH_API_KEY);
}

/**
 * Search configuration
 */
export const searchConfig = {
  hitsPerPage: 20,
  attributesToRetrieve: [
    'objectID',
    'title',
    'company',
    'description',
    'location',
    'category',
    'job_type',
    'tags',
    'salary_min',
    'salary_max',
    'salary_currency',
    'remote_type',
    'company_logo_url',
    'apply_url',
    'published_at',
    'is_featured',
  ],
  attributesToHighlight: ['title', 'company', 'description'],
  highlightPreTag: '<mark>',
  highlightPostTag: '</mark>',
};

/**
 * Configure searchable attributes and ranking
 */
export const indexSettings = {
  searchableAttributes: [
    'title',
    'company',
    'description',
    'tags',
    'category',
    'location',
  ],
  attributesForFaceting: [
    'searchable(category)',
    'searchable(job_type)',
    'searchable(remote_type)',
    'searchable(company_size)',
    'salary_min',
    'salary_max',
  ],
  customRanking: [
    'desc(is_featured)',
    'desc(published_at)',
    'desc(salary_max)',
  ],
  ranking: [
    'typo',
    'geo',
    'words',
    'filters',
    'proximity',
    'attribute',
    'exact',
    'custom',
  ],
};
