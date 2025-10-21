#!/usr/bin/env python3
"""
Setup database schema in Supabase
"""

import os
from supabase import create_client
from dotenv import load_dotenv

load_dotenv()

SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

supabase = create_client(SUPABASE_URL, SUPABASE_KEY)

# Read SQL file
with open('supabase/001_create_jobs_table.sql', 'r') as f:
    sql = f.read()

print("🗄️  Creating database schema...")

try:
    # Execute SQL
    result = supabase.rpc('exec_sql', {'sql': sql}).execute()
    print("✅ Database schema created successfully!")
except Exception as e:
    print(f"⚠️  Note: {e}")
    print("This is expected if the table already exists.")
    print("You can also run the SQL manually in Supabase SQL Editor.")

print("\n📊 Checking if table exists...")
try:
    result = supabase.table('jobs').select('*').limit(1).execute()
    print("✅ Table 'jobs' exists and is accessible!")
except Exception as e:
    print(f"❌ Error: {e}")
