# 🌐 RSS Sources Database

## ✅ Verified Working Sources

### 1. WeWorkRemotely
- **URL:** https://weworkremotely.com/remote-jobs.rss
- **Category URLs:**
  - Programming: https://weworkremotely.com/categories/remote-programming-jobs.rss
  - Design: https://weworkremotely.com/categories/remote-design-jobs.rss
  - Marketing: https://weworkremotely.com/categories/remote-marketing-jobs.rss
- **Volume:** ~50-100 jobs/day
- **Quality:** ⭐⭐⭐⭐⭐ (High quality, verified companies)
- **Format:** Standard RSS 2.0

### 2. RemoteOK
- **URL:** https://remoteok.com/remote-jobs.rss
- **API:** https://remoteok.com/api
- **Volume:** ~200-300 jobs/day
- **Quality:** ⭐⭐⭐⭐ (Good, some spam)
- **Format:** JSON API available

### 3. Remotive
- **URL:** https://remotive.com/api/remote-jobs (JSON)
- **Volume:** ~50 jobs/day
- **Quality:** ⭐⭐⭐⭐⭐ (Curated, high quality)
- **Format:** JSON API

### 4. JustRemote
- **URL:** https://justremote.co/rss
- **Volume:** ~30-50 jobs/day
- **Quality:** ⭐⭐⭐⭐ (Good variety)
- **Format:** RSS 2.0

### 5. Remote.co
- **URL:** https://remote.co/remote-jobs/developer/
- **RSS:** https://remote.co/feed/ (blog posts, nie jobs)
- **Note:** Potrebuje scraping, nemá RSS pre jobs
- **Volume:** ~20-40 jobs/day
- **Quality:** ⭐⭐⭐⭐

### 6. Himalayas
- **URL:** https://himalayas.app/jobs/rss
- **Volume:** ~100+ jobs/day
- **Quality:** ⭐⭐⭐⭐⭐ (Excellent, modern)
- **Format:** RSS 2.0

### 7. Working Nomads
- **API:** https://www.workingnomads.co/api/exposed_jobs/
- **Volume:** ~50 jobs/day
- **Quality:** ⭐⭐⭐⭐ (Curated)
- **Format:** JSON API

### 8. Jobspresso
- **URL:** https://jobspresso.co/remote-work/ (no RSS)
- **Note:** Requires scraping
- **Volume:** ~30-50 jobs/day
- **Quality:** ⭐⭐⭐⭐

### 9. AngelList (Wellfound)
- **URL:** https://wellfound.com/jobs (API available)
- **Volume:** 1000+ startup jobs
- **Quality:** ⭐⭐⭐⭐⭐
- **Note:** Requires API key (free)

### 10. Otta
- **URL:** https://otta.com/jobs
- **RSS:** Not available
- **Volume:** ~500+ jobs
- **Quality:** ⭐⭐⭐⭐⭐ (UK/EU focused)
- **Note:** Requires scraping

---

## 🎯 Priority Implementation Order

### Phase 1 (Immediate)
1. WeWorkRemotely - Programming RSS ✅
2. RemoteOK - Main RSS ✅
3. Himalayas - RSS ✅

**Reason:** Easy RSS, high volume, good quality

### Phase 2 (Week 2)
4. Remotive - JSON API ✅
5. JustRemote - RSS ✅
6. Working Nomads - JSON API ✅

**Reason:** APIs available, stable

### Phase 3 (Week 3-4)
7. AngelList/Wellfound - API (requires key)
8. Remote.co - Scraping
9. Otta - Scraping

**Reason:** Requires more complex setup

---

## 📊 Expected Total Volume

**Daily:** ~500-800 new jobs  
**After deduplication:** ~200-300 unique jobs/day  
**Monthly database:** ~6000-9000 active jobs  

---

## 🔧 RSS Parser Examples

### Standard RSS (WeWorkRemotely, JustRemote)
```python
import feedparser

feed = feedparser.parse('https://weworkremotely.com/remote-jobs.rss')
for entry in feed.entries:
    job = {
        'title': entry.title,
        'company': entry.get('author', 'Unknown'),
        'description': entry.description,
        'url': entry.link,
        'published': entry.published_parsed
    }
```

### JSON API (RemoteOK, Remotive)
```python
import requests

response = requests.get('https://remoteok.com/api')
jobs = response.json()
for job in jobs[1:]:  # Skip first item (metadata)
    # Process job data
```

---

## ⚠️ Common Issues & Solutions

### Issue 1: Rate Limiting
**Solution:** 
- Delay between requests (2-5s)
- Respectful user agent
- Cache results locally

### Issue 2: Duplicate Jobs
**Solution:**
- Use `source + source_id` as unique key
- Check `apply_url` for exact match
- Title + company similarity check

### Issue 3: Data Quality
**Solution:**
- Validate required fields
- Clean HTML from descriptions
- Normalize salary formats
- Filter spam keywords

### Issue 4: Expired Jobs
**Solution:**
- Auto-delete after 30 days
- Check if `apply_url` still accessible
- Mark as inactive instead of delete

---

## 🎯 Data Normalization Rules

### Job Types
- "Full Time" / "Full-time" / "FT" → "Full-time"
- "Part Time" / "PT" → "Part-time"
- "Contractor" / "Freelance" → "Contract"

### Locations
- "Remote" / "Anywhere" / "Worldwide" → "Worldwide"
- "Remote - US Only" → "United States"
- "Remote - EU" → "Europe"

### Categories
- Map to standard list:
  - Engineering
  - Design
  - Marketing
  - Sales
  - Customer Support
  - Product
  - Data
  - Other

---

**READY FOR IMPLEMENTATION!** 🚀
