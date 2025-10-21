# Supabase Database Setup

## Krok 1: Spustenie SQL Migration

1. Choď na: https://supabase.com/dashboard/project/kmlnucziquwadmjuyuzi
2. V ľavom menu klikni na **SQL Editor**
3. Klikni na **New query**
4. Otvor súbor `001_create_jobs_table.sql`
5. Skopíruj celý obsah a vlož ho do SQL editora
6. Klikni **Run** (alebo Ctrl+Enter)

## Krok 2: Overenie

Po spustení SQL skriptu by si mal vidieť:
- ✅ Tabuľka `jobs` vytvorená
- ✅ Indexy vytvorené
- ✅ RLS policies nastavené
- ✅ Trigger pre updated_at

## Krok 3: Testovanie

V SQL Editore spusti:
```sql
SELECT * FROM public.jobs LIMIT 10;
```

Mali by si dostať prázdny výsledok (zatiaľ žiadne jobs).

## Ďalšie kroky

Po úspešnom vytvorení databázy môžeme:
1. Vytvoriť Job Listing stránku v Reacte
2. Vytvoriť Python scraper
3. Naplniť databázu prvými jobmi
