# 🤖 RemoteJobsHub RSS Scraper

Python scraper na automatické sťahovanie remote job postings z RSS feedov.

## 📋 Funkcie

- ✅ Parsovanie RSS feedov (WeWorkRemotely, RemoteOK, Himalayas)
- ✅ Normalizácia dát (job types, categories, locations)
- ✅ Duplikát detekcia (unique constraint na source + source_id)
- ✅ Automatické čistenie HTML tagov
- ✅ Supabase integrácia
- ✅ Error handling a logging

## 🚀 Použitie

### Lokálne spustenie

1. Nainštaluj dependencies:
```bash
cd scraper
pip install -r requirements.txt
```

2. Nastav environment variables v `.env`:
```bash
SUPABASE_URL=your_supabase_url
SUPABASE_SERVICE_KEY=your_service_key
```

3. Spusti scraper:
```bash
python main.py
```

### GitHub Actions

Scraper beží automaticky každú hodinu cez GitHub Actions.

**Nastavenie secrets:**
1. Choď do GitHub repo → Settings → Secrets and variables → Actions
2. Pridaj:
   - `SUPABASE_URL`
   - `SUPABASE_SERVICE_KEY`

**Manuálne spustenie:**
1. Choď do Actions tab
2. Vyber "Scrape Remote Jobs"
3. Klikni "Run workflow"

## 📊 Zdroje RSS Feedov

### Phase 1 (Aktuálne aktívne)
- **WeWorkRemotely** - Programming jobs
- **RemoteOK** - All remote jobs
- **Himalayas** - All remote jobs

### Phase 2 (Plánované)
- Remotive API
- JustRemote RSS
- Working Nomads API

## 🔧 Pridanie nového zdroja

1. Pridaj do `RSS_SOURCES` v `main.py`:
```python
{
    'name': 'SourceName',
    'url': 'https://example.com/feed.rss',
    'type': 'rss',
    'category': 'Engineering'
}
```

2. (Voliteľné) Vytvor custom parser pre špeciálne formáty

## 📈 Štatistiky

Po spustení scraper vypíše:
- Celkový počet stiahnutých jobs
- Počet nových jobs vložených do DB
- Počet duplikátov preskočených

## ⚠️ Troubleshooting

**Error: Missing SUPABASE_URL or SUPABASE_SERVICE_KEY**
→ Skontroluj `.env` súbor

**Error: duplicate key value violates unique constraint**
→ OK, job už existuje v databáze (normálne správanie)

**No entries found**
→ Skontroluj, či RSS feed URL je funkčný
