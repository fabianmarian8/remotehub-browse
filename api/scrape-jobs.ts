/**
 * Vercel Serverless Function - Job Scraper
 * Runs automatically via cron job to fetch jobs from multiple sources
 */

import { createClient } from '@supabase/supabase-js';

// Supabase configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// API URLs
const REMOTEOK_API = 'https://remoteok.com/api';
const REMOTIVE_API = 'https://remotive.com/api/remote-jobs';
const WWR_RSS = 'https://weworkremotely.com/categories/remote-programming-jobs.rss';
const WORKING_NOMADS_API = 'https://www.workingnomads.com/api/exposed_jobs/';
const JUSTREMOTE_RSS = 'https://justremote.co/feed/remote-jobs';

// Category mapping
const CATEGORY_MAPPING: Record<string, string> = {
  dev: 'Engineering',
  developer: 'Engineering',
  engineer: 'Engineering',
  programming: 'Engineering',
  software: 'Engineering',
  frontend: 'Engineering',
  backend: 'Engineering',
  fullstack: 'Engineering',
  'full-stack': 'Engineering',
  design: 'Design',
  designer: 'Design',
  ux: 'Design',
  ui: 'Design',
  marketing: 'Marketing',
  sales: 'Sales',
  support: 'Customer Support',
  customer: 'Customer Support',
  product: 'Product',
  data: 'Data',
  analytics: 'Data',
  ops: 'Engineering',
  devops: 'Engineering',
  finance: 'Other',
  legal: 'Other',
  hr: 'Other',
  engineering: 'Engineering',
};

interface JobData {
  title: string;
  company: string;
  description: string;
  requirements?: string | null;
  location: string;
  job_type: string;
  category: string;
  tags: string[];
  salary_min?: number | null;
  salary_max?: number | null;
  salary_currency?: string;
  apply_url: string;
  company_url?: string | null;
  company_logo_url?: string | null;
  source: string;
  source_id: string;
  published_at: string;
  remote_type?: string;
  is_featured?: boolean;
  is_active: boolean;
}

interface ScraperStats {
  inserted: number;
  duplicates: number;
  errors: number;
}

function normalizeCategory(tags: string[]): string {
  if (!tags || tags.length === 0) return 'Other';

  for (const tag of tags) {
    const tagLower = tag.toLowerCase();
    for (const [key, value] of Object.entries(CATEGORY_MAPPING)) {
      if (tagLower.includes(key)) {
        return value;
      }
    }
  }

  return 'Engineering';
}

function normalizeJobType(originalType: string): string {
  const typeLower = originalType?.toLowerCase() || '';

  if (typeLower.includes('full') || typeLower.includes('fulltime')) {
    return 'Full-time';
  } else if (typeLower.includes('part') || typeLower.includes('parttime')) {
    return 'Part-time';
  } else if (typeLower.includes('contract')) {
    return 'Contract';
  } else if (typeLower.includes('freelance')) {
    return 'Freelance';
  }

  return 'Full-time';
}

function parseXML(xmlString: string): any[] {
  const items: any[] = [];
  const itemMatches = xmlString.match(/<item>[\s\S]*?<\/item>/g);

  if (!itemMatches) return items;

  for (const item of itemMatches) {
    const getTag = (tag: string) => {
      const match = item.match(new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>|<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`));
      return match ? (match[1] || match[2] || '').trim() : '';
    };

    items.push({
      title: getTag('title'),
      link: getTag('link'),
      description: getTag('description'),
      pubDate: getTag('pubDate'),
      category: getTag('category'),
    });
  }

  return items;
}

async function scrapeRemoteOK(): Promise<JobData[]> {
  console.log('🔍 Scraping RemoteOK...');

  try {
    const response = await fetch(REMOTEOK_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`RemoteOK returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobsData = data.slice(1, 501); // Skip metadata, get first 500

    const jobs: JobData[] = [];

    for (const job of jobsData) {
      try {
        if (!job.id || !job.position || !job.company) continue;

        const tags = Array.isArray(job.tags) ? job.tags.filter((t: string) => t).slice(0, 10) : [];
        const category = normalizeCategory(tags);

        const publishedAt = job.epoch
          ? new Date(parseInt(job.epoch) * 1000).toISOString()
          : new Date().toISOString();

        const jobObj: JobData = {
          title: job.position || 'Untitled',
          company: job.company || 'Unknown Company',
          description: job.description || 'No description provided.',
          requirements: null,
          location: job.location || 'Worldwide',
          job_type: normalizeJobType(job.type || ''),
          category,
          tags,
          salary_min: job.salary_min ? parseInt(job.salary_min) : null,
          salary_max: job.salary_max ? parseInt(job.salary_max) : null,
          salary_currency: 'USD',
          apply_url: job.url || job.apply_url || `https://remoteok.com/remote-jobs/${job.id}`,
          company_url: job.company_url || null,
          company_logo_url: job.logo || null,
          source: 'RemoteOK',
          source_id: String(job.id),
          published_at: publishedAt,
          is_featured: false,
          is_active: true,
        };

        jobs.push(jobObj);
      } catch (err) {
        console.error('Error parsing RemoteOK job:', err);
      }
    }

    console.log(`✅ Found ${jobs.length} jobs from RemoteOK`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching RemoteOK:', error);
    return [];
  }
}

async function scrapeRemotive(): Promise<JobData[]> {
  console.log('🔍 Scraping Remotive...');

  try {
    const response = await fetch(`${REMOTIVE_API}?limit=300`, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Remotive returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobsData = data.jobs || [];

    const jobs: JobData[] = [];

    for (const job of jobsData) {
      try {
        if (!job.id || !job.title || !job.company_name) continue;

        const category = normalizeCategory([job.category || '']);
        const jobType = normalizeJobType(job.job_type || 'full-time');

        const tags: string[] = [];
        if (job.category) tags.push(job.category.toLowerCase());
        if (job.tags) tags.push(...job.tags.slice(0, 5).map((t: string) => t.toLowerCase()));

        const jobObj: JobData = {
          title: job.title,
          company: job.company_name,
          description: (job.description || 'No description provided.').substring(0, 5000),
          requirements: null,
          location: job.candidate_required_location || 'Worldwide',
          job_type: jobType,
          category,
          tags: tags.slice(0, 10),
          salary_min: null,
          salary_max: null,
          salary_currency: 'USD',
          apply_url: job.url || '',
          company_url: job.company_logo_url || null,
          company_logo_url: job.company_logo || null,
          source: 'Remotive',
          source_id: String(job.id),
          published_at: job.publication_date || new Date().toISOString(),
          remote_type: 'fully-remote',
          is_active: true,
        };

        jobs.push(jobObj);
      } catch (err) {
        console.error('Error parsing Remotive job:', err);
      }
    }

    console.log(`✅ Found ${jobs.length} jobs from Remotive`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching Remotive:', error);
    return [];
  }
}

async function scrapeWeWorkRemotely(): Promise<JobData[]> {
  console.log('🔍 Scraping We Work Remotely...');

  try {
    const response = await fetch(WWR_RSS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`We Work Remotely returned ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const items = parseXML(xmlText);

    const jobs: JobData[] = [];

    for (const item of items.slice(0, 500)) {
      try {
        if (!item.title || !item.link) continue;

        // Extract company from title (format: "Company: Job Title")
        const titleParts = item.title.split(':');
        const company = titleParts.length > 1 ? titleParts[0].trim() : 'Unknown Company';
        const title = titleParts.length > 1 ? titleParts.slice(1).join(':').trim() : item.title;

        const category = normalizeCategory([item.category || 'programming']);
        const tags = item.category ? [item.category.toLowerCase()] : ['programming'];

        // Generate unique ID from link
        const sourceId = item.link.split('/').filter((p: string) => p).pop() || `wwr-${Date.now()}`;

        const jobObj: JobData = {
          title,
          company,
          description: item.description || 'No description provided.',
          requirements: null,
          location: 'Worldwide',
          job_type: 'Full-time',
          category,
          tags,
          salary_min: null,
          salary_max: null,
          salary_currency: 'USD',
          apply_url: item.link,
          company_url: null,
          company_logo_url: null,
          source: 'WeWorkRemotely',
          source_id: sourceId,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          remote_type: 'fully-remote',
          is_active: true,
        };

        jobs.push(jobObj);
      } catch (err) {
        console.error('Error parsing WeWorkRemotely job:', err);
      }
    }

    console.log(`✅ Found ${jobs.length} jobs from We Work Remotely`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching We Work Remotely:', error);
    return [];
  }
}

async function scrapeWorkingNomads(): Promise<JobData[]> {
  console.log('🔍 Scraping Working Nomads...');

  try {
    const response = await fetch(WORKING_NOMADS_API, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'application/json',
      },
    });

    if (!response.ok) {
      console.error(`Working Nomads returned ${response.status}`);
      return [];
    }

    const data = await response.json();
    const jobsData = Array.isArray(data) ? data : [];

    const jobs: JobData[] = [];

    for (const job of jobsData.slice(0, 200)) {
      try {
        if (!job.id || !job.title || !job.company_name) continue;

        const category = normalizeCategory([job.category || job.tags?.[0] || '']);
        const tags = job.tags ? job.tags.slice(0, 5).map((t: string) => t.toLowerCase()) : [];

        const jobObj: JobData = {
          title: job.title,
          company: job.company_name,
          description: job.description || 'No description provided.',
          requirements: null,
          location: job.location || 'Worldwide',
          job_type: normalizeJobType(job.type || 'full-time'),
          category,
          tags,
          salary_min: null,
          salary_max: null,
          salary_currency: 'USD',
          apply_url: job.url || `https://www.workingnomads.com/jobs?id=${job.id}`,
          company_url: null,
          company_logo_url: job.company_logo || null,
          source: 'WorkingNomads',
          source_id: String(job.id),
          published_at: job.pub_date ? new Date(job.pub_date * 1000).toISOString() : new Date().toISOString(),
          remote_type: 'fully-remote',
          is_active: true,
        };

        jobs.push(jobObj);
      } catch (err) {
        console.error('Error parsing Working Nomads job:', err);
      }
    }

    console.log(`✅ Found ${jobs.length} jobs from Working Nomads`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching Working Nomads:', error);
    return [];
  }
}

async function scrapeJustRemote(): Promise<JobData[]> {
  console.log('🔍 Scraping JustRemote...');

  try {
    const response = await fetch(JUSTREMOTE_RSS, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    });

    if (!response.ok) {
      console.error(`JustRemote returned ${response.status}`);
      return [];
    }

    const xmlText = await response.text();
    const items = parseXML(xmlText);

    const jobs: JobData[] = [];

    for (const item of items.slice(0, 400)) {
      try {
        if (!item.title || !item.link) continue;

        // Try to extract company from description
        const descLower = item.description?.toLowerCase() || '';
        const companyMatch = descLower.match(/company[:\s]+([a-z0-9\s]+)/i);
        const company = companyMatch ? companyMatch[1].trim() : 'Unknown Company';

        const category = normalizeCategory([item.category || item.title]);
        const tags = item.category ? [item.category.toLowerCase()] : [];

        // Generate unique ID from link
        const sourceId = item.link.split('/').filter((p: string) => p).pop() || `jr-${Date.now()}`;

        const jobObj: JobData = {
          title: item.title,
          company,
          description: item.description || 'No description provided.',
          requirements: null,
          location: 'Worldwide',
          job_type: 'Full-time',
          category,
          tags,
          salary_min: null,
          salary_max: null,
          salary_currency: 'USD',
          apply_url: item.link,
          company_url: null,
          company_logo_url: null,
          source: 'JustRemote',
          source_id: sourceId,
          published_at: item.pubDate ? new Date(item.pubDate).toISOString() : new Date().toISOString(),
          remote_type: 'fully-remote',
          is_active: true,
        };

        jobs.push(jobObj);
      } catch (err) {
        console.error('Error parsing JustRemote job:', err);
      }
    }

    console.log(`✅ Found ${jobs.length} jobs from JustRemote`);
    return jobs;
  } catch (error) {
    console.error('❌ Error fetching JustRemote:', error);
    return [];
  }
}

async function insertJobs(jobs: JobData[]): Promise<ScraperStats> {
  const stats: ScraperStats = {
    inserted: 0,
    duplicates: 0,
    errors: 0,
  };

  console.log(`📥 Inserting ${jobs.length} jobs into database...`);

  for (const job of jobs) {
    try {
      const { data, error } = await supabase.from('jobs').insert(job);

      if (error) {
        const errorMsg = error.message.toLowerCase();
        if (errorMsg.includes('unique') || errorMsg.includes('duplicate')) {
          stats.duplicates++;
        } else {
          stats.errors++;
          console.error(`Error inserting ${job.title}:`, error.message);
        }
      } else {
        stats.inserted++;
        if (stats.inserted <= 10) { // Only log first 10 to avoid spam
          console.log(`  ✅ Inserted: ${job.title} at ${job.company}`);
        }
      }
    } catch (err) {
      stats.errors++;
      console.error('Unexpected error:', err);
    }
  }

  return stats;
}

async function deactivateOldJobs(days: number = 30): Promise<number> {
  console.log(`🧹 Deactivating jobs older than ${days} days...`);

  try {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const { data, error } = await supabase
      .from('jobs')
      .update({ is_active: false })
      .lt('published_at', cutoffDate.toISOString())
      .eq('is_active', true)
      .select();

    if (error) {
      console.error('Error deactivating old jobs:', error);
      return 0;
    }

    const count = data?.length || 0;
    console.log(`✅ Deactivated ${count} old jobs`);
    return count;
  } catch (error) {
    console.error('❌ Error deactivating old jobs:', error);
    return 0;
  }
}

export default async function handler(req: Request) {
  console.log('🚀 Job Scraper Started');
  console.log(`⏰ Time: ${new Date().toISOString()}`);

  try {
    // Verify this is a cron job or authorized request
    const authHeader = req.headers.get('authorization');
    const cronSecret = process.env.CRON_SECRET;

    if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
      return new Response('Unauthorized', { status: 401 });
    }

    // Collect jobs from all sources
    const allJobs: JobData[] = [];
    const sourceStats: Record<string, number> = {};

    // Scrape RemoteOK
    const remoteokJobs = await scrapeRemoteOK();
    allJobs.push(...remoteokJobs);
    sourceStats['RemoteOK'] = remoteokJobs.length;

    // Wait a bit to be nice to APIs
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scrape Remotive
    const remotiveJobs = await scrapeRemotive();
    allJobs.push(...remotiveJobs);
    sourceStats['Remotive'] = remotiveJobs.length;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scrape We Work Remotely
    const wwrJobs = await scrapeWeWorkRemotely();
    allJobs.push(...wwrJobs);
    sourceStats['WeWorkRemotely'] = wwrJobs.length;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scrape Working Nomads
    const wnJobs = await scrapeWorkingNomads();
    allJobs.push(...wnJobs);
    sourceStats['WorkingNomads'] = wnJobs.length;

    await new Promise(resolve => setTimeout(resolve, 2000));

    // Scrape JustRemote
    const jrJobs = await scrapeJustRemote();
    allJobs.push(...jrJobs);
    sourceStats['JustRemote'] = jrJobs.length;

    if (allJobs.length === 0) {
      console.log('⚠️  No jobs found to insert');
      return Response.json({
        success: true,
        message: 'No jobs found',
        stats: sourceStats,
      });
    }

    // Insert jobs into database
    const stats = await insertJobs(allJobs);

    // Deactivate old jobs
    const deactivated = await deactivateOldJobs(30);

    // Print summary
    console.log('📊 SUMMARY');
    console.log('Jobs by Source:', sourceStats);
    console.log(`Total Fetched: ${allJobs.length}`);
    console.log(`✅ Inserted: ${stats.inserted}`);
    console.log(`⏭️  Duplicates: ${stats.duplicates}`);
    console.log(`❌ Errors: ${stats.errors}`);
    console.log(`🧹 Deactivated: ${deactivated}`);

    return Response.json({
      success: true,
      message: 'Scraper completed successfully',
      stats: {
        sources: sourceStats,
        total: allJobs.length,
        inserted: stats.inserted,
        duplicates: stats.duplicates,
        errors: stats.errors,
        deactivated,
      },
    });
  } catch (error) {
    console.error('❌ Scraper failed:', error);
    return Response.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// Configure as Edge Function for better performance
export const config = {
  runtime: 'edge',
};
