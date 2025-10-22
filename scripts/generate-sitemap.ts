/**
 * Sitemap Generator
 * Generates sitemap.xml for SEO optimization
 * Run this script periodically or as part of build process
 */

import { createClient } from '@supabase/supabase-js';
import { writeFileSync } from 'fs';
import { join } from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;
const BASE_URL = process.env.BASE_URL || 'https://remotejobshub.com';

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function generateSitemap() {
  console.log('🗺️  Generating sitemap...');

  try {
    // Fetch active jobs
    const { data: jobs, error } = await supabase
      .from('jobs')
      .select('id, created_at, updated_at')
      .eq('is_active', true)
      .order('published_at', { ascending: false })
      .limit(10000); // Limit to 10k jobs for sitemap

    if (error) {
      throw error;
    }

    console.log(`📊 Found ${jobs?.length || 0} active jobs`);

    const now = new Date().toISOString();

    // Static pages
    const staticPages = [
      { loc: BASE_URL, priority: '1.0', changefreq: 'daily', lastmod: now },
      { loc: `${BASE_URL}/jobs`, priority: '1.0', changefreq: 'hourly', lastmod: now },
      { loc: `${BASE_URL}/trends`, priority: '0.8', changefreq: 'daily', lastmod: now },
      { loc: `${BASE_URL}/saved`, priority: '0.7', changefreq: 'daily' },
      { loc: `${BASE_URL}/preferences`, priority: '0.6', changefreq: 'weekly' },
    ];

    // Job pages
    const jobPages = (jobs || []).map(job => ({
      loc: `${BASE_URL}/jobs/${job.id}`,
      lastmod: job.updated_at || job.created_at || now,
      priority: '0.9',
      changefreq: 'daily',
    }));

    const allPages = [...staticPages, ...jobPages];

    // Generate XML
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allPages.map(page => `  <url>
    <loc>${page.loc}</loc>
    ${page.lastmod ? `<lastmod>${page.lastmod}</lastmod>` : ''}
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`).join('\n')}
</urlset>`;

    // Write to public directory
    const outputPath = join(process.cwd(), 'public', 'sitemap.xml');
    writeFileSync(outputPath, xml, 'utf-8');

    console.log(`✅ Sitemap generated successfully!`);
    console.log(`📝 Total URLs: ${allPages.length}`);
    console.log(`📍 Location: ${outputPath}`);

  } catch (error) {
    console.error('❌ Error generating sitemap:', error);
    process.exit(1);
  }
}

// Run the generator
generateSitemap();
