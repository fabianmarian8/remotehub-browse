/**
 * SEO Utilities for RemoteJobsHub
 * Provides functions for generating meta tags, structured data, and SEO-optimized content
 */

import { Job } from '@/integrations/supabase/types';

export interface SEOMetadata {
  title: string;
  description: string;
  canonical?: string;
  ogImage?: string;
  keywords?: string[];
}

/**
 * Generate page title with site branding
 */
export function generatePageTitle(pageTitle: string): string {
  const siteName = 'RemoteJobsHub';
  return pageTitle ? `${pageTitle} | ${siteName}` : siteName;
}

/**
 * Update document meta tags
 */
export function updateMetaTags(metadata: SEOMetadata): void {
  // Update title
  document.title = generatePageTitle(metadata.title);

  // Update or create meta tags
  const metaTags: Record<string, string> = {
    description: metadata.description,
    'og:title': metadata.title,
    'og:description': metadata.description,
    'twitter:title': metadata.title,
    'twitter:description': metadata.description,
  };

  // Add keywords if provided
  if (metadata.keywords && metadata.keywords.length > 0) {
    metaTags.keywords = metadata.keywords.join(', ');
  }

  // Add canonical URL if provided
  if (metadata.canonical) {
    let canonicalLink = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonicalLink) {
      canonicalLink = document.createElement('link');
      canonicalLink.rel = 'canonical';
      document.head.appendChild(canonicalLink);
    }
    canonicalLink.href = metadata.canonical;
  }

  // Add OG image if provided
  if (metadata.ogImage) {
    metaTags['og:image'] = metadata.ogImage;
    metaTags['twitter:image'] = metadata.ogImage;
  }

  // Update all meta tags
  Object.entries(metaTags).forEach(([name, content]) => {
    const property = name.startsWith('og:') ? name : undefined;
    const metaName = !property ? name : undefined;

    let metaTag = property
      ? document.querySelector(`meta[property="${property}"]`)
      : document.querySelector(`meta[name="${metaName}"]`);

    if (!metaTag) {
      metaTag = document.createElement('meta');
      if (property) {
        metaTag.setAttribute('property', property);
      } else if (metaName) {
        metaTag.setAttribute('name', metaName);
      }
      document.head.appendChild(metaTag);
    }

    metaTag.setAttribute('content', content);
  });
}

/**
 * Generate SEO metadata for job listing page
 */
export function getJobListingSEO(filters?: {
  category?: string;
  search?: string;
  jobType?: string;
}): SEOMetadata {
  let title = 'Find Remote Jobs';
  let description = 'Browse thousands of remote job opportunities from top companies worldwide. Find your perfect remote position today.';
  const keywords = ['remote jobs', 'work from home', 'remote work', 'telecommute'];

  if (filters?.category) {
    title = `Remote ${filters.category} Jobs`;
    description = `Find remote ${filters.category} positions from leading companies. Browse hundreds of ${filters.category.toLowerCase()} opportunities.`;
    keywords.push(filters.category.toLowerCase(), `remote ${filters.category.toLowerCase()}`);
  }

  if (filters?.search) {
    title = `Search: ${filters.search} - Remote Jobs`;
    description = `Remote job opportunities matching "${filters.search}". Find your next remote position.`;
    keywords.push(filters.search);
  }

  if (filters?.jobType) {
    keywords.push(filters.jobType.toLowerCase());
  }

  return {
    title,
    description,
    keywords,
    canonical: window.location.origin + window.location.pathname,
  };
}

/**
 * Generate SEO metadata for a specific job detail page
 */
export function getJobDetailSEO(job: Job): SEOMetadata {
  const title = `${job.title} at ${job.company}`;
  const description = job.description.substring(0, 160).replace(/<[^>]*>/g, '') + '...';
  const keywords = [
    job.title,
    job.company,
    job.category,
    'remote',
    ...(job.tags || []),
  ];

  return {
    title,
    description,
    keywords,
    ogImage: job.company_logo_url || undefined,
    canonical: `${window.location.origin}/jobs/${job.id}`,
  };
}

/**
 * Generate Schema.org JobPosting structured data
 * This helps search engines understand and display job listings
 */
export function generateJobPostingSchema(job: Job): Record<string, any> {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'JobPosting',
    title: job.title,
    description: job.description,
    datePosted: job.published_at,
    validThrough: job.expires_at || undefined,
    employmentType: job.job_type?.toUpperCase().replace('-', '_') || 'FULL_TIME',
    hiringOrganization: {
      '@type': 'Organization',
      name: job.company,
      sameAs: job.company_url || undefined,
      logo: job.company_logo_url || undefined,
    },
    jobLocation: {
      '@type': 'Place',
      address: {
        '@type': 'PostalAddress',
        addressLocality: job.location === 'Worldwide' ? 'Remote' : job.location,
        addressRegion: job.location === 'Worldwide' ? 'Global' : undefined,
      },
    },
    applicantLocationRequirements: job.location === 'Worldwide' ? {
      '@type': 'Country',
      name: 'Worldwide',
    } : undefined,
    jobLocationType: 'TELECOMMUTE',
  };

  // Add salary information if available
  if (job.salary_min && job.salary_max) {
    schema['baseSalary'] = {
      '@type': 'MonetaryAmount',
      currency: job.salary_currency || 'USD',
      value: {
        '@type': 'QuantitativeValue',
        minValue: job.salary_min,
        maxValue: job.salary_max,
        unitText: job.salary_period === 'yearly' ? 'YEAR' : job.salary_period?.toUpperCase(),
      },
    };
  }

  return schema;
}

/**
 * Inject structured data into page
 */
export function injectStructuredData(schema: Record<string, any>): void {
  // Remove existing structured data script if any
  const existingScript = document.querySelector('script[type="application/ld+json"]');
  if (existingScript) {
    existingScript.remove();
  }

  // Create new script tag with structured data
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.textContent = JSON.stringify(schema);
  document.head.appendChild(script);
}

/**
 * Generate breadcrumb structured data
 */
export function generateBreadcrumbSchema(items: Array<{ name: string; url: string }>): Record<string, any> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url,
    })),
  };
}

/**
 * Generate sitemap XML for job listings
 * This should be called from a backend/build script
 */
export function generateSitemapXML(jobs: Job[], baseUrl: string): string {
  const now = new Date().toISOString();

  const urls = [
    // Static pages
    { loc: baseUrl, priority: '1.0', changefreq: 'daily' },
    { loc: `${baseUrl}/jobs`, priority: '1.0', changefreq: 'hourly' },
    { loc: `${baseUrl}/trends`, priority: '0.8', changefreq: 'daily' },
    { loc: `${baseUrl}/saved`, priority: '0.7', changefreq: 'daily' },
    { loc: `${baseUrl}/preferences`, priority: '0.6', changefreq: 'weekly' },
    // Job pages
    ...jobs.map(job => ({
      loc: `${baseUrl}/jobs/${job.id}`,
      lastmod: job.updated_at || job.created_at || now,
      priority: '0.9',
      changefreq: 'daily',
    })),
  ];

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(url => `  <url>
    <loc>${url.loc}</loc>
    ${url.lastmod ? `<lastmod>${url.lastmod}</lastmod>` : ''}
    <changefreq>${url.changefreq}</changefreq>
    <priority>${url.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

  return xml;
}

/**
 * Generate robots.txt content
 */
export function generateRobotsTxt(sitemapUrl: string): string {
  return `# robots.txt for RemoteJobsHub

User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/
Disallow: /*.json$

# Sitemaps
Sitemap: ${sitemapUrl}

# Crawl delay (be nice to our server)
Crawl-delay: 1
`;
}
