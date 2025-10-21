#!/usr/bin/env python3
"""
Check if database is ready
"""

import os
import sys
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not SUPABASE_URL or not SUPABASE_KEY:
    print("❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY")
    sys.exit(1)

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

print("🔍 Checking database...")
print(f"URL: {SUPABASE_URL}")
print(f"Key: {SUPABASE_KEY[:20]}...")

try:
    # Try to query the jobs table
    result = supabase.table('jobs').select('*').limit(1).execute()
    print("\n✅ Database is ready!")
    print(f"✅ Table 'jobs' exists")
    print(f"📊 Current job count: {len(result.data)}")
    
except Exception as e:
    error_msg = str(e)
    
    if 'relation "public.jobs" does not exist' in error_msg or 'does not exist' in error_msg:
        print("\n⚠️  Table 'jobs' does not exist yet!")
        print("\n📋 Please run the SQL schema in Supabase SQL Editor:")
        print("   1. Go to: https://supabase.com/dashboard/project/kmlnucziquwadmjuyuzi/sql/new")
        print("   2. Copy contents of: supabase/001_create_jobs_table.sql")
        print("   3. Click 'Run' button")
        sys.exit(1)
    else:
        print(f"\n❌ Error: {error_msg}")
        sys.exit(1)
