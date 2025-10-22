# Remote Jobs Scraper

Automatický scraper pre získavanie remote job listingov z rôznych zdrojov a pridávanie ich do Supabase databázy.

## 🚀 Funkcie

- ✅ Automatické scrapovanie z RemoteOK API
- ✅ Inteligentná detekcia duplicitov
- ✅ Automatická kategorizácia jobov
- ✅ Automatická deaktivácia starých jobov (30+ dní)
- ✅ Podrobné logovanie výsledkov
- ✅ Jednoduché spustenie a konfigurácia

## 📋 Požiadavky

- Python 3.8 alebo vyšší
- Prístup k Supabase projektu
- Internetové pripojenie

## 🔧 Inštalácia

### 1. Nainštaluj Python dependencies

```bash
cd scraper
pip install -r requirements.txt
```

### 2. Nastav Supabase konfiguráciu

Vytvor `.env` súbor v scraper priečinku:

```bash
cp .env.example .env
```

### 3. Získaj Supabase Service Key

1. Choď na: https://supabase.com/dashboard/project/kkuybturazislquqaxci/settings/api
2. V sekcii **Project API keys** nájdi **service_role** kľúč
3. **DÔLEŽITÉ:** Klikni na "Reveal" a skopíruj **service_role** kľúč (nie anon kľúč!)
4. Vlož ho do `.env` súboru:

```env
SUPABASE_URL=https://kkuybturazislquqaxci.supabase.co
SUPABASE_SERVICE_KEY=tvoj-service-role-kluc-tu
```

⚠️ **BEZPEČNOSŤ:** Service role kľúč je tajný! Nikdy ho nezdieľaj a nepridávaj do git repozitára.

## ▶️ Spustenie

### Manuálne spustenie

```bash
cd scraper
python job_scraper.py
```

### Prvé spustenie

Pri prvom spustení by si mal vidieť niečo ako:

```
============================================================
🚀 Remote Jobs Scraper Started
============================================================
⏰ Time: 2024-01-15 10:30:00

🔍 Scraping RemoteOK...
✅ Found 50 jobs from RemoteOK

📥 Inserting 50 jobs into database...
  ✅ Inserted: Senior Python Developer at TechCorp
  ✅ Inserted: UI/UX Designer at DesignStudio
  ...

🧹 Deactivating jobs older than 30 days...
✅ Deactivated 0 old jobs

============================================================
📊 SUMMARY
============================================================
✅ Successfully inserted: 50
⏭️  Duplicates skipped: 0
❌ Errors: 0
📝 Total processed: 50
============================================================
✅ Scraper completed successfully!
============================================================
```

### Následné spustenia

Pri ďalších spusteniach uvidíš:

```
  ✅ Inserted: New Job Title at Company
  ⏭️  Skipped (duplicate): Existing Job at Company
```

Scraper automaticky detekuje duplicity podľa `source` + `source_id` a preskočí ich.

## 📅 Automatické spúšťanie

### Možnosť 1: GitHub Actions (Odporúčané)

GitHub Actions workflow je už pripravený v `.github/workflows/scrape-jobs.yml`.

**Nastavenie:**

1. Choď na tvoj GitHub repozitár
2. Klikni na **Settings** → **Secrets and variables** → **Actions**
3. Pridaj tieto secrets:
   - `SUPABASE_URL`: `https://kkuybturazislquqaxci.supabase.co`
   - `SUPABASE_SERVICE_KEY`: tvoj service role kľúč

**Workflow beží:**
- ⏰ Každý deň o 8:00 UTC
- 🔄 Môžeš ho spustiť manuálne cez "Actions" → "Scrape Remote Jobs" → "Run workflow"

### Možnosť 2: Cron Job (Linux/Mac)

```bash
# Otvor crontab
crontab -e

# Pridaj tento riadok (beží každý deň o 8:00)
0 8 * * * cd /cesta/k/remotehub-browse/scraper && /usr/bin/python3 job_scraper.py >> /tmp/job_scraper.log 2>&1
```

### Možnosť 3: Task Scheduler (Windows)

1. Otvor **Task Scheduler**
2. Vytvor **New Task**
3. **Trigger:** Denne o 8:00
4. **Action:** Spusti program
   - Program: `python`
   - Arguments: `C:\cesta\k\remotehub-browse\scraper\job_scraper.py`
   - Start in: `C:\cesta\k\remotehub-browse\scraper`

## 🎯 Ako to funguje

### 1. Scraping
- Scraper sa pripojí na RemoteOK API
- Získa najnovších 50 job listingov
- Normalizuje dáta (kategórie, typy, formát dátumov)

### 2. Kategorizácia
Scraper automaticky priraďuje kategórie na základe tagov:
- `dev`, `engineering` → Engineering
- `design` → Design
- `marketing` → Marketing
- `sales` → Sales
- `support`, `customer` → Customer Support
- `product` → Product
- `data` → Data
- Ostatné → Other

### 3. Detekcia duplicitov
- Každý job má `source` (napr. "remoteok") a `source_id` (unikátne ID z daného zdroja)
- Databáza má UNIQUE constraint na `(source, source_id)`
- Duplicitné joby sú automaticky preskočené

### 4. Deaktivácia starých jobov
- Automaticky deaktivuje joby staršie ako 30 dní
- Tieto joby sa prestanú zobrazovať na webe

## 🔍 Monitorovanie

### Kontrola stavu databázy

```sql
-- Celkový počet aktívnych jobov
SELECT COUNT(*) FROM jobs WHERE is_active = true;

-- Joby podľa zdroja
SELECT source, COUNT(*) FROM jobs WHERE is_active = true GROUP BY source;

-- Najnovšie pridané joby
SELECT title, company, published_at, source
FROM jobs
WHERE is_active = true
ORDER BY created_at DESC
LIMIT 10;
```

## 🛠️ Riešenie problémov

### "Missing SUPABASE_URL or SUPABASE_SERVICE_KEY"
- Skontroluj, že máš `.env` súbor v `scraper/` priečinku
- Skontroluj, že hodnoty v `.env` sú správne

### "Error fetching RemoteOK"
- Skontroluj internetové pripojenie
- RemoteOK API môže byť dočasne nedostupné, skús to o chvíľu znova

### "Error inserting job"
- Skontroluj, že používaš **service_role** kľúč (nie anon kľúč)
- Skontroluj, že databázová tabuľka `jobs` existuje

### Žiadne nové joby sa nepridávajú
- To je normálne ak už boli joby z RemoteOK pridané skôr
- RemoteOK aktualizuje joby pomaly, skús to na druhý deň

## 📝 Pridanie ďalších zdrojov

Chceš pridať viac job boardov? Jednoducho pridaj novú funkciu do `job_scraper.py`:

```python
def scrape_weworkremotely() -> List[Dict]:
    """Scrape jobs from We Work Remotely"""
    # Tvoj scraping kód tu
    return jobs

# V main() funkcii:
wwr_jobs = scrape_weworkremotely()
all_jobs.extend(wwr_jobs)
```

## 📊 Štatistiky

Po každom spustení scraper zobrazí:
- ✅ Počet novo pridaných jobov
- ⏭️ Počet preskočených duplicitov
- ❌ Počet chýb
- 📝 Celkový počet spracovaných jobov

## 🔐 Bezpečnosť

- `.env` súbor je v `.gitignore` a nebude commitnutý
- Service role kľúč nikdy nezdieľaj
- Používaj GitHub Secrets pre automatizáciu cez GitHub Actions

## 💡 Tipy

1. **Prvé spustenie:** Získaš až 50 nových jobov
2. **Denné spustenia:** Získaš len nové joby (zvyčajne 5-15 denne)
3. **Staré joby:** Automaticky sa deaktivujú po 30 dňoch
4. **Duplicity:** Automaticky ignorované

## 🆘 Podpora

Ak máš problémy:
1. Skontroluj tento README
2. Pozri sa na error správy v konzole
3. Skontroluj Supabase dashboard pre chyby databázy
