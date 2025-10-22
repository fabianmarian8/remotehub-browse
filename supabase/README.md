# Supabase Database Setup

## Krok 1: Spustenie SQL Migration

1. Choď na: https://supabase.com/dashboard/project/kkuybturazislquqaxci
2. V ľavom menu klikni na **SQL Editor**
3. Klikni na **New query**
4. Otvor súbor `001_create_jobs_table.sql`
5. Skopíruj celý obsah a vlož ho do SQL editora
6. Klikni **Run** (alebo Ctrl+Enter)

## Krok 2: Vloženie testovacích dát (voliteľné)

1. V SQL Editore vytvor **New query**
2. Otvor súbor `002_insert_sample_jobs.sql`
3. Skopíruj celý obsah a vlož ho do SQL editora
4. Klikni **Run** (alebo Ctrl+Enter)

Tento skript pridá 8 vzorových job listingov, aby si mohol ihneď vidieť fungujúcu aplikáciu.

## Krok 3: Oprava RLS Policies (DÔLEŽITÉ!)

⚠️ **KRITICKÝ KROK** - Bez tohto scraper nebude fungovať!

1. V SQL Editore vytvor **New query**
2. Otvor súbor `003_fix_rls_policies.sql`
3. Skopíruj celý obsah a vlož ho do SQL editora
4. Klikni **Run** (alebo Ctrl+Enter)

Tento skript opraví Row Level Security policies, aby service_role (scraper) mohol vkladať joby do databázy.

**Čo to opraví:**
- ✅ Service role získa explicitné permissions pre INSERT, UPDATE, SELECT
- ✅ Scraper bude môcť pridávať nové joby
- ✅ Frontend (anon key) bude vidieť len aktívne joby

## Krok 4: Overenie

Po spustení všetkých SQL skriptov by si mal vidieť:
- ✅ Tabuľka `jobs` vytvorená
- ✅ Indexy vytvorené
- ✅ RLS policies OPRAVENÉ (4 nové policies)
- ✅ Trigger pre updated_at
- ✅ 8 testovacích jobov v databáze (ak si spustil krok 2)

## Krok 5: Testovanie

V SQL Editore spusti:
```sql
SELECT COUNT(*) FROM public.jobs WHERE is_active = true;
```

Mali by si vidieť počet aktívnych jobov (8 ak si spustil testové dáta).

## Krok 6: Otestuj aplikáciu

1. Spusti aplikáciu: `npm run dev`
2. Otvor http://localhost:5173
3. Klikni na "Browse Jobs"
4. Mali by sa ti zobraziť všetky aktívne job listings

## Problém s typmi?

Ak máš TypeScript chyby, súbor `src/integrations/supabase/types.ts` bol už aktualizovaný s definíciou tabuľky `jobs`. Reštartuj TypeScript server vo svojom editore.

## Ďalšie kroky

Po úspešnom nastavení databázy môžeš:
1. ✅ Job Listing stránka už je vytvorená v `src/pages/Jobs.tsx`
2. Vytvoriť Python scraper na automatické načítanie jobov
3. Pridať viac funkcií (filtrovanie, vyhľadávanie, favority, atď.)
