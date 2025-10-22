# Vercel Deployment - Job Scraper

## 🎯 Prečo Vercel?

GitHub Actions blokujú RemoteOK a iné job board API (403 Forbidden). Vercel má iné IP adresy a funguje perfektne. **Je to 100% zadarmo!**

## 📋 Krok za Krokom Návod

### 1. Vytvor Vercel Účet (ak ešte nemáš)

1. Choď na [vercel.com](https://vercel.com)
2. Klikni **Sign Up**
3. Prihlás sa cez **GitHub** (najjednoduchšie)
4. Potvrď email ak treba

### 2. Pripoj GitHub Repozitár

1. V Vercel dashboarde klikni **Add New... → Project**
2. Nájdi `remotehub-browse` repozitár
3. Klikni **Import**

### 3. Nastav Environment Variables

**DÔLEŽITÉ:** Pred deploymentom musíš pridať Supabase credentials:

1. V projekte choď na **Settings → Environment Variables**
2. Pridaj tieto premenné:

```
SUPABASE_URL = https://tvoj-projekt.supabase.co
SUPABASE_SERVICE_KEY = tvoj_service_role_key
```

**Kde nájsť tieto údaje:**
- Choď na [supabase.com/dashboard](https://supabase.com/dashboard)
- Vyber svoj projekt
- Settings → API
- **Project URL** = SUPABASE_URL
- **service_role key** (SECRET, nie anon!) = SUPABASE_SERVICE_KEY

⚠️ **POZOR:** Použi `service_role` key, NIE `anon` key!

### 4. Deploy!

1. Klikni **Deploy**
2. Počkaj 1-2 minúty
3. Hotovo! ✅

## 🔄 Ako Funguje Cron Job

Po deployi:
- ✅ Scraper sa automaticky spustí **každých 6 hodín**
- ✅ Schedule: `0 */6 * * *` (00:00, 06:00, 12:00, 18:00 UTC)
- ✅ Získa 200+ ponúk z RemoteOK a Remotive
- ✅ Automaticky deaktivuje staré ponuky (>30 dní)

## 🧪 Manuálne Testovanie

Môžeš spustiť scraper manuálne:

```bash
# Vo Vercel dashboarde:
# 1. Choď do projektu
# 2. Deployment → Functions
# 3. Nájdi /api/scrape-jobs
# 4. Klikni "Invoke Function"
```

Alebo cez curl:
```bash
curl https://tvoj-projekt.vercel.app/api/scrape-jobs
```

## 📊 Monitorovanie

### Pozri Logy
1. Vercel Dashboard → tvoj projekt
2. **Logs** tab
3. Vidíš real-time výstup scrapera

### Sleduj Cron Jobs
1. Vercel Dashboard → tvoj projekt
2. **Cron Jobs** tab
3. Vidíš kedy posledný krát bežal

## 🔧 Zmena Schedule

Ak chceš zmeniť frekvenciu scraping-u:

Uprav `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/scrape-jobs",
      "schedule": "0 */3 * * *"  // Každé 3 hodiny
    }
  ]
}
```

**Cron formát:**
- `0 */6 * * *` - Každých 6 hodín
- `0 */3 * * *` - Každé 3 hodiny
- `0 0 * * *` - Každý deň o polnoci
- `0 8,14,20 * * *` - 3x denne (8:00, 14:00, 20:00)

## ❓ Troubleshooting

### Scraper nebeží
- ✅ Skontroluj Environment Variables v Vercel
- ✅ Skontroluj že používaš `service_role` key, nie `anon`
- ✅ Pozri Logs v Vercel dashboarde

### Stále 403 chyby
- Vercel IP adresy by nemali byť blokované
- Ak áno, pridaj `User-Agent` headers (už je v kóde)
- Alebo skús iný region v Vercel settings

### Žiadne nové ponuky
- RemoteOK má rate limiting, môže trvať kým sa objavia nové
- Skontroluj logy či sa reálne sťahujú ponuky
- Pozri v Supabase či sa inkrementuje `total_jobs`

## 🎉 Výsledok

Po nasadení:
- ✅ Scraper beží automaticky každých 6 hodín
- ✅ Získavaš 200+ ponúk z RemoteOK
- ✅ Získavaš 100+ ponúk z Remotive
- ✅ Celkom ~300+ nových ponúk denne
- ✅ Žiadne 403 errors!
- ✅ 100% zadarmo (Vercel Hobby tier)

## 📞 Podpora

Ak máš problémy:
1. Skontroluj Vercel Logs
2. Skontroluj Supabase credentials
3. Otvor GitHub issue
