#!/usr/bin/env python3
"""
Remote Jobs Scraper - Multi-Source Edition
Automatically scrapes remote job listings from multiple sources and adds them to Supabase

Supported Sources:
- RemoteOK
- We Work Remotely
- Remote.co
- Remotive
"""

import os
import sys
import time
import requests
from datetime import datetime, timezone, timedelta
from typing import List, Dict, Optional
from dotenv import load_dotenv
from supabase import create_client, Client
from bs4 import BeautifulSoup
import re
import xml.etree.ElementTree as ET

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

# Job source URLs
REMOTEOK_API = "https://remoteok.com/api"
WEWORKREMOTELY_RSS = "https://weworkremotely.com/categories/remote-programming-jobs.rss"
REMOTECARE_RSS = "https://weworkremotely.com/categories/remote-customer-support-jobs.rss"
WEWORKREMOTELY_DESIGN_RSS = "https://weworkremotely.com/categories/remote-design-jobs.rss"
WEWORKREMOTELY_MARKETING_RSS = "https://weworkremotely.com/categories/remote-marketing-jobs.rss"
REMOTIVE_API = "https://remotive.com/api/remote-jobs"
REMOTE_CO_RSS = "https://remote.co/remote-jobs/developer/feed/"

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


def extract_salary_from_text(text: str) -> tuple[Optional[int], Optional[int], str]:
    """Extract salary range from text"""
    if not text:
        return None, None, 'USD'

    # Common patterns: $50k-100k, $50,000 - $100,000, €40k-60k
    patterns = [
        r'[\$€£]?\s*(\d+)k?\s*-\s*(\d+)k',
        r'[\$€£]?\s*([\d,]+)\s*-\s*([\d,]+)',
    ]

    for pattern in patterns:
        match = re.search(pattern, text, re.IGNORECASE)
        if match:
            min_sal = int(match.group(1).replace(',', ''))
            max_sal = int(match.group(2).replace(',', ''))

            # Normalize to full amounts if abbreviated
            if 'k' in text.lower():
                min_sal *= 1000
                max_sal *= 1000

            # Detect currency
            currency = 'USD'
            if '€' in text:
                currency = 'EUR'
            elif '£' in text:
                currency = 'GBP'

            return min_sal, max_sal, currency

    return None, None, 'USD'


def clean_html(html_text: str) -> str:
    """Remove HTML tags and clean up text"""
    if not html_text:
        return ''
    soup = BeautifulSoup(html_text, 'html.parser')
    return soup.get_text(separator='\n', strip=True)


def parse_rss_feed(url: str) -> List[Dict]:
    """Parse RSS feed using requests and xml.etree"""
    try:
        headers = {'User-Agent': 'RemoteJobsHub/1.0 (Job Aggregator)'}
        response = requests.get(url, headers=headers, timeout=30)
        response.raise_for_status()

        # Parse XML
        root = ET.fromstring(response.content)

        # Find all items in the feed
        items = []
        # Try both RSS 2.0 and Atom formats
        for item in root.findall('.//item'):  # RSS 2.0
            entry = {}
            title_elem = item.find('title')
            link_elem = item.find('link')
            desc_elem = item.find('description')
            pubdate_elem = item.find('pubDate')

            entry['title'] = title_elem.text if title_elem is not None else ''
            entry['link'] = link_elem.text if link_elem is not None else ''
            entry['description'] = desc_elem.text if desc_elem is not None else ''
            entry['pubDate'] = pubdate_elem.text if pubdate_elem is not None else ''

            items.append(entry)

        # Also try Atom format
        for entry_elem in root.findall('.//{http://www.w3.org/2005/Atom}entry'):
            entry = {}
            title_elem = entry_elem.find('{http://www.w3.org/2005/Atom}title')
            link_elem = entry_elem.find('{http://www.w3.org/2005/Atom}link')
            content_elem = entry_elem.find('{http://www.w3.org/2005/Atom}content')

            entry['title'] = title_elem.text if title_elem is not None else ''
            entry['link'] = link_elem.get('href', '') if link_elem is not None else ''
            entry['description'] = content_elem.text if content_elem is not None else ''
            entry['pubDate'] = ''

            items.append(entry)

        return items
    except Exception as e:
        print(f"Error parsing RSS feed {url}: {str(e)}")
        return []


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
        for job in jobs_data[:200]:  # Increased from 50 to 200
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
                    'source': 'RemoteOK',
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


def scrape_weworkremotely() -> List[Dict]:
    """Scrape jobs from We Work Remotely RSS feeds"""
    print("\n🔍 Scraping We Work Remotely...")

    jobs = []
    rss_feeds = [
        (WEWORKREMOTELY_RSS, 'Engineering'),
        (REMOTECARE_RSS, 'Customer Support'),
        (WEWORKREMOTELY_DESIGN_RSS, 'Design'),
        (WEWORKREMOTELY_MARKETING_RSS, 'Marketing'),
    ]

    for feed_url, default_category in rss_feeds:
        try:
            entries = parse_rss_feed(feed_url)

            for entry in entries[:50]:  # 50 per category
                try:
                    # Extract job details
                    title = entry.get('title', 'Untitled')
                    link = entry.get('link', '')

                    # Parse description
                    description = clean_html(entry.get('description', ''))

                    # Extract company from title (usually format: "Company: Job Title")
                    company = 'Unknown Company'
                    if ':' in title:
                        parts = title.split(':', 1)
                        company = parts[0].strip()
                        title = parts[1].strip() if len(parts) > 1 else title

                    # Parse published date
                    published_at = datetime.now(timezone.utc).isoformat()

                    # Generate unique ID from link
                    source_id = link.split('/')[-1] if link else str(hash(title + company))

                    # Extract salary from description
                    salary_min, salary_max, currency = extract_salary_from_text(description)

                    job_obj = {
                        'title': title,
                        'company': company,
                        'description': description[:5000],  # Limit length
                        'location': 'Worldwide',
                        'job_type': 'Full-time',
                        'category': default_category,
                        'tags': [default_category.lower()],
                        'salary_min': salary_min,
                        'salary_max': salary_max,
                        'salary_currency': currency,
                        'apply_url': link,
                        'source': 'WeWorkRemotely',
                        'source_id': source_id,
                        'published_at': published_at,
                        'remote_type': 'fully-remote',
                        'is_active': True,
                    }

                    jobs.append(job_obj)

                except Exception as e:
                    print(f"⚠️  Error parsing WWR entry: {str(e)}")
                    continue

        except Exception as e:
            print(f"⚠️  Error fetching WWR feed {feed_url}: {str(e)}")
            continue

    print(f"✅ Found {len(jobs)} jobs from We Work Remotely")
    return jobs


def scrape_remotive() -> List[Dict]:
    """Scrape jobs from Remotive API"""
    print("\n🔍 Scraping Remotive...")

    try:
        headers = {
            'User-Agent': 'RemoteJobsHub/1.0 (Job Aggregator)'
        }
        params = {
            'limit': 100  # Get up to 100 jobs
        }
        response = requests.get(REMOTIVE_API, headers=headers, params=params, timeout=30)
        response.raise_for_status()

        data = response.json()
        jobs_data = data.get('jobs', [])

        jobs = []
        for job in jobs_data:
            try:
                # Skip if missing required fields
                if not job.get('id') or not job.get('title') or not job.get('company_name'):
                    continue

                # Parse category
                category = normalize_category([job.get('category', '')])

                # Parse job type
                job_type_raw = job.get('job_type', 'full-time')
                job_type = normalize_job_type(job_type_raw)

                # Parse date
                published_at = job.get('publication_date', datetime.now(timezone.utc).isoformat())

                # Extract salary
                salary_text = job.get('salary', '')
                salary_min, salary_max, currency = extract_salary_from_text(salary_text)

                # Build tags
                tags = []
                if job.get('category'):
                    tags.append(job['category'].lower())
                if job.get('tags'):
                    tags.extend([tag.lower() for tag in job['tags'][:5]])

                job_obj = {
                    'title': job.get('title', 'Untitled'),
                    'company': job.get('company_name', 'Unknown Company'),
                    'description': job.get('description', 'No description provided.')[:5000],
                    'location': job.get('candidate_required_location', 'Worldwide'),
                    'job_type': job_type,
                    'category': category,
                    'tags': tags[:10],
                    'salary_min': salary_min,
                    'salary_max': salary_max,
                    'salary_currency': currency,
                    'apply_url': job.get('url', ''),
                    'company_url': job.get('company_logo_url', ''),
                    'company_logo_url': job.get('company_logo', ''),
                    'source': 'Remotive',
                    'source_id': str(job.get('id')),
                    'published_at': published_at,
                    'remote_type': 'fully-remote',
                    'is_active': True,
                }

                jobs.append(job_obj)

            except Exception as e:
                print(f"⚠️  Error parsing Remotive job {job.get('id')}: {str(e)}")
                continue

        print(f"✅ Found {len(jobs)} jobs from Remotive")
        return jobs

    except Exception as e:
        print(f"❌ Error fetching Remotive: {str(e)}")
        return []


def scrape_remote_co() -> List[Dict]:
    """Scrape jobs from Remote.co RSS feed"""
    print("\n🔍 Scraping Remote.co...")

    try:
        entries = parse_rss_feed(REMOTE_CO_RSS)
        jobs = []

        for entry in entries[:100]:  # Get up to 100 jobs
            try:
                title = entry.get('title', 'Untitled')
                link = entry.get('link', '')
                description = clean_html(entry.get('description', ''))

                # Parse company from description or title
                company = 'Unknown Company'
                # Remote.co often has company in the title or description
                if '|' in title:
                    parts = title.split('|')
                    company = parts[0].strip()
                    title = parts[1].strip() if len(parts) > 1 else title

                # Parse published date
                published_at = datetime.now(timezone.utc).isoformat()

                # Generate unique ID from link
                source_id = link.split('/')[-2] if link else str(hash(title + company))

                # Extract salary
                salary_min, salary_max, currency = extract_salary_from_text(description)

                # Determine category (default to Engineering for developer RSS)
                category = 'Engineering'
                tags = ['developer', 'engineering']

                job_obj = {
                    'title': title,
                    'company': company,
                    'description': description[:5000],
                    'location': 'Worldwide',
                    'job_type': 'Full-time',
                    'category': category,
                    'tags': tags,
                    'salary_min': salary_min,
                    'salary_max': salary_max,
                    'salary_currency': currency,
                    'apply_url': link,
                    'source': 'RemoteCo',
                    'source_id': source_id,
                    'published_at': published_at,
                    'remote_type': 'fully-remote',
                    'is_active': True,
                }

                jobs.append(job_obj)

            except Exception as e:
                print(f"⚠️  Error parsing Remote.co entry: {str(e)}")
                continue

        print(f"✅ Found {len(jobs)} jobs from Remote.co")
        return jobs

    except Exception as e:
        print(f"❌ Error fetching Remote.co: {str(e)}")
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
    print("=" * 70)
    print("🚀 Remote Jobs Scraper Started - Multi-Source Edition")
    print("=" * 70)
    print(f"⏰ Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Collect jobs from all sources
    all_jobs = []
    source_stats = {}

    # Scrape RemoteOK
    print("\n" + "=" * 70)
    remoteok_jobs = scrape_remoteok()
    all_jobs.extend(remoteok_jobs)
    source_stats['RemoteOK'] = len(remoteok_jobs)
    time.sleep(2)  # Be nice to APIs

    # Scrape We Work Remotely
    print("\n" + "=" * 70)
    wwr_jobs = scrape_weworkremotely()
    all_jobs.extend(wwr_jobs)
    source_stats['We Work Remotely'] = len(wwr_jobs)
    time.sleep(2)

    # Scrape Remotive
    print("\n" + "=" * 70)
    remotive_jobs = scrape_remotive()
    all_jobs.extend(remotive_jobs)
    source_stats['Remotive'] = len(remotive_jobs)
    time.sleep(2)

    # Scrape Remote.co
    print("\n" + "=" * 70)
    remoteco_jobs = scrape_remote_co()
    all_jobs.extend(remoteco_jobs)
    source_stats['Remote.co'] = len(remoteco_jobs)

    print("\n" + "=" * 70)

    if not all_jobs:
        print("\n⚠️  No jobs found to insert")
        return

    # Insert jobs into database
    stats = insert_jobs(all_jobs)

    # Deactivate old jobs
    deactivate_old_jobs(days=30)

    # Print detailed summary
    print("\n" + "=" * 70)
    print("📊 DETAILED SUMMARY")
    print("=" * 70)
    print("\n📋 Jobs by Source:")
    for source, count in source_stats.items():
        print(f"   • {source}: {count} jobs")
    print(f"\n   Total Fetched: {len(all_jobs)} jobs")
    print("\n💾 Database Operations:")
    print(f"   ✅ Successfully inserted: {stats['inserted']}")
    print(f"   ⏭️  Duplicates skipped: {stats['duplicates']}")
    print(f"   ❌ Errors: {stats['errors']}")
    print("=" * 70)
    print("✅ Scraper completed successfully!")
    print("=" * 70)


if __name__ == "__main__":
    main()
