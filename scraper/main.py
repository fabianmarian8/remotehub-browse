#!/usr/bin/env python3
"""
RemoteJobsHub RSS Scraper
Fetches jobs from multiple RSS feeds and stores in Supabase
"""

import os
import sys
import time
import hashlib
import feedparser
import requests
from datetime import datetime, timezone
from typing import Dict, List, Optional
from dotenv import load_dotenv
from supabase import create_client, Client

# Load environment variables
load_dotenv()

# Supabase client
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')  # Use service key for insert

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY in .env")
    sys.exit(1)

supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# RSS Sources - Phase 1 Priority
RSS_SOURCES = [
    {
        'name': 'WeWorkRemotely',
        'url': 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
        'type': 'rss',
        'category': 'Engineering'
    },
    {
        'name': 'RemoteOK',
        'url': 'https://remoteok.com/remote-jobs.rss',
        'type': 'rss',
        'category': 'Engineering'
    },
    {
        'name': 'Himalayas',
        'url': 'https://himalayas.app/jobs/rss',
        'type': 'rss',
        'category': 'Engineering'
    }
]

# Category mapping for normalization
CATEGORY_MAP = {
    'programming': 'Engineering',
    'developer': 'Engineering',
    'engineering': 'Engineering',
    'design': 'Design',
    'marketing': 'Marketing',
    'sales': 'Sales',
    'support': 'Customer Support',
    'product': 'Product',
    'data': 'Data',
}

def normalize_job_type(job_type: str) -> str:
    """Normalize job type to standard format"""
    if not job_type:
        return 'Full-time'
    
    job_type = job_type.lower().strip()
    
    if 'full' in job_type or 'ft' in job_type:
        return 'Full-time'
    elif 'part' in job_type or 'pt' in job_type:
        return 'Part-time'
    elif 'contract' in job_type or 'freelance' in job_type:
        return 'Contract'
    else:
        return 'Full-time'

def normalize_category(category: str) -> str:
    """Normalize category to standard format"""
    if not category:
        return 'Other'
    
    category_lower = category.lower().strip()
    for key, value in CATEGORY_MAP.items():
        if key in category_lower:
            return value
    return 'Other'

def clean_html(text: str) -> str:
    """Remove HTML tags and clean text"""
    if not text:
        return ''
    
    # Simple HTML tag removal
    import re
    text = re.sub(r'<[^>]+>', '', text)
    text = text.replace('&nbsp;', ' ')
    text = text.replace('&amp;', '&')
    text = text.replace('&lt;', '<')
    text = text.replace('&gt;', '>')
    text = ' '.join(text.split())  # Normalize whitespace
    return text.strip()

def generate_source_id(url: str) -> str:
    """Generate unique source ID from URL"""
    return hashlib.md5(url.encode()).hexdigest()

def parse_rss_entry(entry: Dict, source_name: str, default_category: str) -> Optional[Dict]:
    """Parse RSS entry and return normalized job data"""
    try:
        # Extract basic info
        title = entry.get('title', '').strip()
        company = entry.get('author', 'Unknown Company').strip()
        description = clean_html(entry.get('description', ''))
        apply_url = entry.get('link', '').strip()
        
        if not title or not apply_url:
            return None
        
        # Generate unique source_id
        source_id = generate_source_id(apply_url)
        
        # Parse published date
        published_parsed = entry.get('published_parsed')
        if published_parsed:
            published_at = datetime(*published_parsed[:6], tzinfo=timezone.utc)
        else:
            published_at = datetime.now(timezone.utc)
        
        # Extract category from tags or use default
        category = default_category
        tags = []
        if 'tags' in entry:
            for tag in entry.tags:
                tag_term = tag.get('term', '').strip()
                if tag_term:
                    tags.append(tag_term)
                    # Try to determine category from tags
                    normalized = normalize_category(tag_term)
                    if normalized != 'Other':
                        category = normalized
        
        # Build job data
        job_data = {
            'title': title,
            'company': company,
            'description': description[:5000],  # Limit description length
            'location': 'Worldwide',
            'job_type': normalize_job_type('Full-time'),
            'category': category,
            'tags': tags[:10] if tags else [],  # Limit tags
            'apply_url': apply_url,
            'source': source_name,
            'source_id': source_id,
            'published_at': published_at.isoformat(),
            'is_active': True
        }
        
        return job_data
        
    except Exception as e:
        print(f"⚠️  Error parsing entry: {e}")
        return None

def fetch_rss_feed(source: Dict) -> List[Dict]:
    """Fetch and parse RSS feed"""
    jobs = []
    
    try:
        print(f"📡 Fetching from {source['name']}...")
        
        # Parse RSS feed
        feed = feedparser.parse(source['url'])
        
        if not feed.entries:
            print(f"⚠️  No entries found in {source['name']}")
            return jobs
        
        # Parse each entry
        for entry in feed.entries:
            job_data = parse_rss_entry(entry, source['name'], source['category'])
            if job_data:
                jobs.append(job_data)
        
        print(f"✅ Fetched {len(jobs)} jobs from {source['name']}")
        
    except Exception as e:
        print(f"❌ Error fetching {source['name']}: {e}")
    
    return jobs

def insert_job(job_data: Dict) -> bool:
    """Insert job into Supabase with duplicate check"""
    try:
        # Try to insert - will fail if duplicate (source + source_id)
        result = supabase.table('jobs').insert(job_data).execute()
        return True
        
    except Exception as e:
        error_msg = str(e)
        
        # Check if it's a duplicate error
        if 'unique_source_job' in error_msg or 'duplicate' in error_msg.lower():
            # Job already exists, skip silently
            return False
        else:
            # Other error, log it
            print(f"⚠️  Error inserting job '{job_data['title']}': {e}")
            return False

def main():
    """Main scraper function"""
    print("🚀 RemoteJobsHub Scraper Starting...")
    print(f"📅 {datetime.now(timezone.utc).isoformat()}")
    print("-" * 50)
    
    total_fetched = 0
    total_inserted = 0
    
    # Fetch from all sources
    for source in RSS_SOURCES:
        jobs = fetch_rss_feed(source)
        total_fetched += len(jobs)
        
        # Insert jobs
        for job in jobs:
            if insert_job(job):
                total_inserted += 1
        
        # Be respectful - delay between sources
        time.sleep(2)
    
    print("-" * 50)
    print(f"✅ Scraping Complete!")
    print(f"📊 Total fetched: {total_fetched}")
    print(f"💾 Total inserted: {total_inserted}")
    print(f"🔄 Duplicates skipped: {total_fetched - total_inserted}")

if __name__ == '__main__':
    main()
