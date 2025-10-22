/**
 * Algolia Sync Script
 * Syncs job data from Supabase to Algolia search index
 * Run this periodically or after data updates
 */

import algoliasearch from 'algoliasearch';
import { createClient } from '@supabase/supabase-js';

// Configuration
const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const ALGOLIA_APP_ID = process.env.ALGOLIA_APP_ID || process.env.VITE_ALGOLIA_APP_ID;
const ALGOLIA_ADMIN_KEY = process.env.ALGOLIA_ADMIN_KEY; // Use admin key for indexing
const ALGOLIA_INDEX_NAME = process.env.ALGOLIA_INDEX_NAME || process.env.VITE_ALGOLIA_INDEX_NAME || 'jobs';

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

if (!ALGOLIA_APP_ID || !ALGOLIA_ADMIN_KEY) {
  console.error('❌ Missing Algolia credentials');
  console.log('ℹ️  Note: You need ALGOLIA_ADMIN_KEY (not search key) to update the index');
  process.exit(1);
}

// Initialize clients
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);
const algoliaClient = algoliasearch(ALGOLIA_APP_ID, ALGOLIA_ADMIN_KEY);
const index = algoliaClient.initIndex(ALGOLIA_INDEX_NAME);

async function syncToAlgolia() {
  console.log('🔄 Starting Algolia sync...');
  console.log(`📊 Syncing to index: ${ALGOLIA_INDEX_NAME}`);

  try {
    // Configure index settings
    console.log('\n⚙️  Configuring index settings...');
    await index.setSettings({
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
        'filterOnly(salary_min)',
        'filterOnly(salary_max)',
        'filterOnly(is_active)',
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
      attributesToHighlight: ['title', 'company', 'description'],
      highlightPreTag: '<mark>',
      highlightPostTag: '</mark>',
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
        'company_size',
        'company_logo_url',
        'apply_url',
        'published_at',
        'is_featured',
        'is_active',
      ],
    });

    console.log('✅ Index settings configured');

    // Fetch all active jobs from Supabase
    console.log('\n📥 Fetching jobs from Supabase...');

    let allJobs: any[] = [];
    let from = 0;
    const batchSize = 1000;
    let hasMore = true;

    while (hasMore) {
      const { data, error } = await supabase
        .from('jobs')
        .select('*')
        .eq('is_active', true)
        .range(from, from + batchSize - 1);

      if (error) {
        throw error;
      }

      if (data && data.length > 0) {
        allJobs = allJobs.concat(data);
        from += batchSize;
        console.log(`   Fetched ${allJobs.length} jobs...`);

        if (data.length < batchSize) {
          hasMore = false;
        }
      } else {
        hasMore = false;
      }
    }

    console.log(`✅ Fetched ${allJobs.length} active jobs`);

    if (allJobs.length === 0) {
      console.log('⚠️  No jobs to sync');
      return;
    }

    // Transform jobs for Algolia (add objectID)
    console.log('\n🔄 Transforming data for Algolia...');
    const algoliaRecords = allJobs.map(job => ({
      ...job,
      objectID: job.id, // Algolia requires objectID
    }));

    // Upload to Algolia in batches
    console.log('\n📤 Uploading to Algolia...');
    const chunkSize = 1000; // Algolia recommends max 1000 records per batch
    const chunks = [];

    for (let i = 0; i < algoliaRecords.length; i += chunkSize) {
      chunks.push(algoliaRecords.slice(i, i + chunkSize));
    }

    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`   Uploading batch ${i + 1}/${chunks.length} (${chunk.length} records)...`);
      await index.saveObjects(chunk);
    }

    console.log('✅ Upload complete');

    // Get index stats
    console.log('\n📊 Index statistics:');
    const stats = await index.search('', {
      hitsPerPage: 0,
      attributesToRetrieve: [],
    });
    console.log(`   Total records in index: ${stats.nbHits}`);

    console.log('\n✅ Algolia sync completed successfully!');

  } catch (error) {
    console.error('❌ Error syncing to Algolia:', error);
    process.exit(1);
  }
}

// Run the sync
syncToAlgolia();
