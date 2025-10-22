#!/usr/bin/env python3
"""
Remote Jobs Scraper
Automatically scrapes remote job listings from multiple sources and adds them to Supabase
"""

import os
import sys
import time
import requests
from datetime import datetime, timezone
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase configuration
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_SERVICE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_SERVICE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env file")
    sys.exit(1)

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

# Job sources
REMOTEOK_API = "https://remoteok.com/api"

# Category mapping from source to our categories
CATEGORY_MAPPING = {
    'dev': 'Engineering',
    'design': 'Design',
    'marketing': 'Marketing',
    'sales': 'Sales',
    'support': 'Customer Support',
    'product': 'Product',
    'data': 'Data',
    'ops': 'Engineering',
    'finance': 'Other',
    'legal': 'Other',
    'hr': 'Other',
    'customer': 'Customer Support',
    'engineering': 'Engineering',
}


def normalize_category(tags: List[str]) -> str:
    """Normalize category from tags"""
    if not tags:
        return 'Other'

    # Check each tag against our mapping
    for tag in tags:
        tag_lower = tag.lower()
        for key, value in CATEGORY_MAPPING.items():
            if key in tag_lower:
                return value

    # Default to Engineering if we can't determine
    return 'Engineering'


def normalize_job_type(original_type: str) -> str:
    """Normalize job type to our accepted values"""
    type_lower = original_type.lower() if original_type else ''

    if 'full' in type_lower or 'fulltime' in type_lower:
        return 'Full-time'
    elif 'part' in type_lower or 'parttime' in type_lower:
        return 'Part-time'
    elif 'contract' in type_lower:
        return 'Contract'
    elif 'freelance' in type_lower:
        return 'Freelance'

    # Default to Full-time
    return 'Full-time'


def scrape_remoteok() -> List[Dict]:
    """Scrape jobs from RemoteOK API"""
    print("\n🔍 Scraping RemoteOK...")

    try:
        headers = {
            'User-Agent': 'RemoteJobsHub/1.0 (Job Aggregator)'
        }
        response = requests.get(REMOTEOK_API, headers=headers, timeout=30)
        response.raise_for_status()

        data = response.json()

        # Skip first item (it's metadata)
        jobs_data = data[1:] if len(data) > 1 else []

        jobs = []
        for job in jobs_data[:50]:  # Limit to 50 jobs per run
            try:
                # Skip if missing required fields
                if not job.get('id') or not job.get('position') or not job.get('company'):
                    continue

                # Parse tags
                tags = job.get('tags', [])
                if isinstance(tags, list):
                    # Filter out empty tags and limit to 10
                    tags = [tag for tag in tags if tag][:10]
                else:
                    tags = []

                # Determine category from tags
                category = normalize_category(tags)

                # Parse salary if available
                salary_min = None
                salary_max = None
                if job.get('salary_min'):
                    salary_min = int(job.get('salary_min'))
                if job.get('salary_max'):
                    salary_max = int(job.get('salary_max'))

                # Parse date
                epoch = job.get('epoch', job.get('date'))
                if epoch:
                    published_at = datetime.fromtimestamp(int(epoch), tz=timezone.utc).isoformat()
                else:
                    published_at = datetime.now(timezone.utc).isoformat()

                # Build job object
                job_obj = {
                    'title': job.get('position', 'Untitled'),
                    'company': job.get('company', 'Unknown Company'),
                    'description': job.get('description', 'No description provided.'),
                    'requirements': None,  # RemoteOK doesn't separate requirements
                    'location': job.get('location', 'Worldwide'),
                    'job_type': normalize_job_type(job.get('type', '')),
                    'category': category,
                    'tags': tags,
                    'salary_min': salary_min,
                    'salary_max': salary_max,
                    'salary_currency': 'USD',
                    'apply_url': job.get('url', job.get('apply_url', f"https://remoteok.com/remote-jobs/{job.get('id')}")),
                    'company_url': job.get('company_url'),
                    'company_logo_url': job.get('logo'),
                    'source': 'remoteok',
                    'source_id': str(job.get('id')),
                    'published_at': published_at,
                    'is_featured': False,
                    'is_active': True,
                }

                jobs.append(job_obj)

            except Exception as e:
                print(f"⚠️  Error parsing job {job.get('id')}: {str(e)}")
                continue

        print(f"✅ Found {len(jobs)} jobs from RemoteOK")
        return jobs

    except requests.exceptions.RequestException as e:
        print(f"❌ Error fetching RemoteOK: {str(e)}")
        return []
    except Exception as e:
        print(f"❌ Unexpected error scraping RemoteOK: {str(e)}")
        return []


def insert_jobs(jobs: List[Dict]) -> Dict[str, int]:
    """Insert jobs into Supabase database"""
    stats = {
        'inserted': 0,
        'duplicates': 0,
        'errors': 0
    }

    print(f"\n📥 Inserting {len(jobs)} jobs into database...")

    for job in jobs:
        try:
            # Try to insert the job
            response = supabase.table('jobs').insert(job).execute()

            if response.data:
                stats['inserted'] += 1
                print(f"  ✅ Inserted: {job['title']} at {job['company']}")

        except Exception as e:
            error_msg = str(e).lower()

            # Check if it's a duplicate (unique constraint violation)
            if 'unique' in error_msg or 'duplicate' in error_msg:
                stats['duplicates'] += 1
                print(f"  ⏭️  Skipped (duplicate): {job['title']} at {job['company']}")
                # Show first duplicate error for debugging
                if stats['duplicates'] == 1:
                    print(f"     → First duplicate error: {str(e)[:200]}")
            else:
                stats['errors'] += 1
                print(f"  ❌ Error inserting {job['title']}: {str(e)}")
                print(f"     Full error: {repr(e)}")

    return stats


def deactivate_old_jobs(days: int = 30):
    """Deactivate jobs older than X days"""
    print(f"\n🧹 Deactivating jobs older than {days} days...")

    try:
        # Calculate cutoff date
        from datetime import timedelta
        cutoff = (datetime.now(timezone.utc) - timedelta(days=days)).isoformat()

        # Update old jobs to inactive
        response = supabase.table('jobs').update({
            'is_active': False
        }).lt('published_at', cutoff).eq('is_active', True).execute()

        count = len(response.data) if response.data else 0
        print(f"✅ Deactivated {count} old jobs")

    except Exception as e:
        print(f"❌ Error deactivating old jobs: {str(e)}")


def main():
    """Main scraper function"""
    print("=" * 60)
    print("🚀 Remote Jobs Scraper Started")
    print("=" * 60)
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Collect jobs from all sources
    all_jobs = []

    # Scrape RemoteOK
    remoteok_jobs = scrape_remoteok()
    all_jobs.extend(remoteok_jobs)

    # Add more sources here in the future:
    # weworkremotely_jobs = scrape_weworkremotely()
    # all_jobs.extend(weworkremotely_jobs)

    if not all_jobs:
        print("\n⚠️  No jobs found to insert")
        return

    # Insert jobs into database
    stats = insert_jobs(all_jobs)

    # Deactivate old jobs
    deactivate_old_jobs(days=30)

    # Print summary
    print("\n" + "=" * 60)
    print("📊 SUMMARY")
    print("=" * 60)
    print(f"✅ Successfully inserted: {stats['inserted']}")
    print(f"⏭️  Duplicates skipped: {stats['duplicates']}")
    print(f"❌ Errors: {stats['errors']}")
    print(f"📝 Total processed: {len(all_jobs)}")
    print("=" * 60)
    print("✅ Scraper completed successfully!")
    print("=" * 60)


if __name__ == "__main__":
    main()
