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

// Category mapping
const CATEGORY_MAPPING: Record<string, string> = {
  dev: 'Engineering',
  design: 'Design',
  marketing: 'Marketing',
  sales: 'Sales',
  support: 'Customer Support',
  product: 'Product',
  data: 'Data',
  ops: 'Engineering',
  finance: 'Other',
  legal: 'Other',
  hr: 'Other',
  customer: 'Customer Support',
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
    const jobsData = data.slice(1, 201); // Skip metadata, get first 200

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
    const response = await fetch(`${REMOTIVE_API}?limit=100`, {
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
        console.log(`  ✅ Inserted: ${job.title} at ${job.company}`);
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
