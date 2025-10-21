# 🚀 RemoteJobsHub - Master Plan

## 📊 Project Overview

**Cieľ:** Automatizovaný job board pre remote pozície s RSS agregáciou  
**Target:** Globálny trh (anglický jazyk)  
**Monetizácia:** Google AdSense, featured listings  
**Rozpočet:** 10-20€/mesiac  
**GitHub:** https://github.com/fabianmarian8/remotehub-browse

---

## 🏗️ Tech Stack

### Frontend (✅ HOTOVO - Lovable)
- React 18 + Vite
- TypeScript
- Tailwind CSS
- shadcn/ui (kompletné UI komponenty)
- TanStack Query (data fetching)
- React Router (routing)
- React Hook Form + Zod (forms)

### Backend (🔨 TO DO)
- **Supabase** (PostgreSQL database, FREE tier)
  - Authentication (optional)
  - Real-time subscriptions
  - Edge Functions
  
### Automation (🔨 TO DO)
- **Python RSS Scraper** (BeautifulSoup / feedparser)
- **GitHub Actions** (cron jobs - FREE)
- **OpenAI API** (optional - data cleaning/categorization)

### Hosting
- **Vercel** - Frontend (FREE)
- **Supabase** - Database (FREE tier: 500MB, 50k rows)
- **GitHub Actions** - Automation (FREE: 2000 min/month)

---

## 📋 Implementation Phases

### ✅ PHASE 0: Base Setup (HOTOVO)
- [x] React + Vite project
- [x] Homepage s nadpisom
- [x] GitHub repository
- [x] shadcn/ui komponenty

### 🔨 PHASE 1: Database & API Setup
- [ ] Supabase projekt setup
- [ ] Database schema design
- [ ] Supabase client integration
- [ ] API queries & mutations

### 🔨 PHASE 2: Frontend Development  
- [ ] Job listing page (/jobs)
- [ ] Job detail page (/jobs/:id)
- [ ] Search & filter komponenty
- [ ] Job card komponenty
- [ ] Pagination
- [ ] Loading states & skeletons
- [ ] Error handling

### 🔨 PHASE 3: RSS Scraper Development
- [ ] Python scraper script
- [ ] RSS feed parser (10+ sources)
- [ ] Data normalization
- [ ] Supabase insert logic
- [ ] Duplicate detection
- [ ] Error handling & logging

### 🔨 PHASE 4: Automation & Deployment
- [ ] GitHub Actions workflow
- [ ] Cron job setup (každú hodinu)
- [ ] Vercel deployment
- [ ] Environment variables setup
- [ ] Monitoring & alerts

### 🔨 PHASE 5: SEO & Monetization
- [ ] Meta tags optimization
- [ ] Sitemap generation
- [ ] Google Search Console setup
- [ ] Google AdSense integration
- [ ] Analytics (Plausible/Google Analytics)

---

## 🗄️ Database Schema (Supabase)

### Table: `jobs`
```sql
CREATE TABLE jobs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  
  -- Job Info
  title TEXT NOT NULL,
  company TEXT NOT NULL,
  description TEXT NOT NULL,
  requirements TEXT,
  
  -- Location & Type
  location TEXT DEFAULT 'Worldwide',
  job_type TEXT CHECK (job_type IN ('Full-time', 'Part-time', 'Contract', 'Freelance')),
  
  -- Categories
  category TEXT NOT NULL, -- 'Engineering', 'Design', 'Marketing', etc.
  tags TEXT[], -- ['react', 'typescript', 'remote']
  
  -- Salary
  salary_min INTEGER,
  salary_max INTEGER,
  salary_currency TEXT DEFAULT 'USD',
  
  -- Application
  apply_url TEXT NOT NULL,
  company_url TEXT,
  company_logo_url TEXT,
  
  -- Metadata
  source TEXT NOT NULL, -- 'WeWorkRemotely', 'RemoteOK', etc.
  source_id TEXT UNIQUE, -- Original job ID from source
  published_at TIMESTAMPTZ NOT NULL,
  expires_at TIMESTAMPTZ,
  
  -- Internal
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  is_featured BOOLEAN DEFAULT FALSE,
  is_active BOOLEAN DEFAULT TRUE,
  
  -- Indexes
  CONSTRAINT unique_source_job UNIQUE(source, source_id)
);

CREATE INDEX idx_jobs_published ON jobs(published_at DESC);
CREATE INDEX idx_jobs_category ON jobs(category);
CREATE INDEX idx_jobs_type ON jobs(job_type);
CREATE INDEX idx_jobs_active ON jobs(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_jobs_search ON jobs USING GIN(to_tsvector('english', title || ' ' || company || ' ' || description));
```

---

## 🔌 RSS Sources (10+ Free Feeds)

### Top Priority (Large Volume)
1. **WeWorkRemotely** - https://weworkremotely.com/categories/remote-programming-jobs.rss
2. **RemoteOK** - https://remoteok.com/remote-jobs.rss
3. **Remotive** - https://remotive.com/api/remote-jobs
4. **JustRemote** - https://justremote.co/rss
5. **Remote.co** - https://remote.co/feed/

### Secondary Sources
6. **FlexJobs** - (paid API, možno neskôr)
7. **Himalayas** - https://himalayas.app/jobs/rss
8. **Working Nomads** - https://www.workingnomads.co/api/exposed_jobs/
9. **Jobspresso** - RSS feed available
10. **Remote | OK GitHub** - GitHub Jobs API (deprecated, ale ešte funguje)

---

## 🤖 Python Scraper Architecture

```python
# scraper/main.py

import feedparser
from supabase import create_client, Client
import os
from datetime import datetime
import hashlib

# Sources configuration
RSS_SOURCES = [
    {
        'name': 'WeWorkRemotely',
        'url': 'https://weworkremotely.com/categories/remote-programming-jobs.rss',
        'parser': 'standard_rss'
    },
    {
        'name': 'RemoteOK', 
        'url': 'https://remoteok.com/remote-jobs.rss',
        'parser': 'standard_rss'
    },
    # ... add more
]

def fetch_jobs():
    """Main scraper function"""
    supabase: Client = create_client(
        os.environ.get("SUPABASE_URL"),
        os.environ.get("SUPABASE_KEY")
    )
    
    for source in RSS_SOURCES:
        print(f"Fetching from {source['name']}...")
        feed = feedparser.parse(source['url'])
        
        for entry in feed.entries:
            job_data = normalize_job(entry, source['name'])
            insert_job(supabase, job_data)

def normalize_job(entry, source_name):
    """Normalize different RSS formats"""
    # Extract & clean data
    # Return standardized dict

def insert_job(supabase, job_data):
    """Insert into Supabase with duplicate check"""
    # Use source + source_id for deduplication
```

---

## ⏰ GitHub Actions Workflow

```yaml
# .github/workflows/scrape-jobs.yml
name: Scrape Remote Jobs

on:
  schedule:
    - cron: '0 * * * *'  # Every hour
  workflow_dispatch:  # Manual trigger

jobs:
  scrape:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      
      - name: Install dependencies
        run: |
          cd scraper
          pip install -r requirements.txt
      
      - name: Run scraper
        env:
          SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
          SUPABASE_KEY: ${{ secrets.SUPABASE_KEY }}
        run: |
          cd scraper
          python main.py
```

---

## 💰 Monetization Strategy

### Primary: Google AdSense
- **Placement:** 
  - Above job listings (banner)
  - Between job cards (native ads)
  - Sidebar (skyscraper)
- **Expected CPM:** $2-5 (tech audience)
- **Target:** 10k visitors/day = 300k views/month
- **Revenue:** $600-1500/month

### Secondary: Featured Listings
- Companies pay $50-100 for 30-day featured placement
- Highlighted in search results
- Badge "Featured"

### Future: Email Newsletter
- Weekly digest of best jobs
- Sponsored job slots ($200-500/email)

---

## 📈 Growth Strategy

### Month 1-3: Foundation
- Build & populate database (1000+ jobs)
- Basic SEO optimization
- Submit to Google Search Console
- Goal: 100-500 visitors/day

### Month 4-6: SEO Push
- Publish job categories as separate pages
- Long-tail keywords optimization
- Backlink building (Reddit, Indie Hackers, HN)
- Goal: 1k-3k visitors/day

### Month 7-12: Scale
- Add more RSS sources
- Launch email newsletter
- Featured listings monetization
- Goal: 5k-10k visitors/day = $500-1000/month

---

## 🎯 Success Metrics

### Technical KPIs
- Jobs in database: 5000+ active
- Scraper uptime: 99%+
- Page load time: <2s
- API response: <500ms

### Business KPIs
- Daily visitors: 10,000+
- Conversion to apply: 5%+
- AdSense CTR: 1%+
- Monthly revenue: €1000+

---

## 🚦 Next Steps (IMMEDIATE)

1. ✅ **Setup Supabase** (5 min)
   - Vytvor projekt na supabase.com
   - Copy URL & API key

2. ✅ **Create Database Schema** (10 min)
   - Run SQL v Supabase SQL Editor

3. ✅ **Integrate Supabase do Reactu** (15 min)
   - Install @supabase/supabase-js
   - Create lib/supabase.ts
   - Setup env variables

4. ✅ **Build Job Listing Page** (1-2 hodiny)
   - Fetch jobs from Supabase
   - Display v cards
   - Basic styling

5. ✅ **Python Scraper** (2-3 hodiny)
   - Parse RSS feeds
   - Insert do Supabase
   - Test locally

---

**READY TO START?** 🚀
