# Supabase Zero-Beginner Guide

This project uses 2 tables in Supabase.

1. `dashboard_rows`
   - Stores imported Excel row data.
2. `dashboard_targets`
   - Stores store-level monthly targets.

## Why 2 tables?

Because data rows and targets are different things:
- one Excel row = one `dashboard_rows` record
- one store + one month target = one `dashboard_targets` record

## What you should do

1. Create a Supabase project.
2. Open `SQL Editor`.
3. Copy all content from `SUPABASE_SCHEMA.sql`.
4. Paste it into Supabase and click `Run`.
5. After success, open `Table Editor`.
6. You should see 2 tables:
   - `dashboard_rows`
   - `dashboard_targets`
7. Go to `Project Settings` -> `API`.
8. Copy:
   - Project URL
   - anon public key
9. Put them into Netlify environment variables:
   - `REACT_APP_SUPABASE_URL`
   - `REACT_APP_SUPABASE_ANON_KEY`
10. Trigger a new deploy in Netlify.

## Important

- If Supabase is not configured, the app falls back to local state.
- For cross-device sharing, everyone must open the same deployed site linked to the same Supabase project.
- After you change environment variables in Netlify, you must redeploy. The page will not update by itself.