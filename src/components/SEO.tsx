/**
 * SEO Component
 * Manages page metadata, structured data, and SEO tags
 */

import { useEffect } from 'react';
import { Job } from '@/integrations/supabase/types';
import {
  updateMetaTags,
  SEOMetadata,
  generateJobPostingSchema,
  injectStructuredData,
  generateBreadcrumbSchema,
} from '@/utils/seo';

interface SEOProps {
  metadata: SEOMetadata;
  job?: Job;
  breadcrumbs?: Array<{ name: string; url: string }>;
}

/**
 * SEO Component
 * Updates document head with SEO metadata and structured data
 */
export function SEO({ metadata, job, breadcrumbs }: SEOProps) {
  useEffect(() => {
    // Update meta tags
    updateMetaTags(metadata);

    // Add structured data for job if provided
    if (job) {
      const jobSchema = generateJobPostingSchema(job);
      injectStructuredData(jobSchema);
    }

    // Add breadcrumb structured data if provided
    else if (breadcrumbs && breadcrumbs.length > 0) {
      const breadcrumbSchema = generateBreadcrumbSchema(breadcrumbs);
      injectStructuredData(breadcrumbSchema);
    }

    // Cleanup function to remove structured data when component unmounts
    return () => {
      const structuredDataScript = document.querySelector('script[type="application/ld+json"]');
      if (structuredDataScript) {
        structuredDataScript.remove();
      }
    };
  }, [metadata, job, breadcrumbs]);

  // This component doesn't render anything
  return null;
}

export default SEO;
