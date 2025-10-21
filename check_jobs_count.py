#!/usr/bin/env python3
"""
Check jobs count and show sample
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

supabase = create_client(
    os.getenv('SUPABASE_URL'),
    os.getenv('SUPABASE_SERVICE_KEY')
)

print("🔍 Checking jobs in database...")

# Get total count
result = supabase.table('jobs').select('*', count='exact').execute()

print(f"\n✅ Total jobs in database: {result.count}")

# Show first 5 jobs
if result.count > 0:
    print("\n📋 Sample jobs:")
    jobs = supabase.table('jobs').select('title, company, source').limit(5).execute()
    for i, job in enumerate(jobs.data, 1):
        print(f"{i}. {job['title']} at {job['company']} (from {job['source']})")
