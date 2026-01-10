# Guide: Setting Up Staging (Supabase + Vercel Preview)

To keep your production data safe, it's recommended to use a separate Supabase project for your **Preview** deployments.

## 1. Create a Staging Supabase Project
1. Create a second project on [Supabase Dashboard](https://supabase.com/dashboard).
2. Name it something like `APRT2026-Staging`.
3. Run the [schema.sql](file:///g:/Work/ashvinlabs/repos/APRT2026/schema.sql) query in the new project's SQL Editor to set up the tables.

## 2. Configure Vercel Scoped Variables

Vercel allows you to have different values for the same variable name depending on the environment.

1. Go to your **Vercel Dashboard > APRT2026 Project**.
2. Navigate to **Settings > Environment Variables**.
3. For each variable (`NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`):
   - **Edit** the existing variable.
   - Uncheck **Preview** and **Development** from the existing entry (so it only applies to **Production**).
   - Click **Save**.
4. Click **Add New**:
   - **Key**: `NEXT_PUBLIC_SUPABASE_URL`
   - **Value**: (Your **Staging** Supabase URL)
   - **Environment**: Check **ONLY "Preview"** and **"Development"**.
   - Click **Save**.
5. Repeat for `NEXT_PUBLIC_SUPABASE_ANON_KEY` using your Staging Anon Key.

## 3. Configure Redirects for Staging

Since Preview URLs change for every PR (e.g., `aprt2026-git-feature...-vercel.app`), you need to allow wildcards in your **Staging** Supabase project.

1. Go to your **Staging Supabase Project > Authentication > URL Configuration**.
2. Set **Site URL** to your main staging domain or just the base Vercel path.
3. Add a wildcard to **Redirect URLs**:
   - `https://*-ashvinlabs.vercel.app/**` (This allows all Vercel preview URLs for your team).
   - If using a custom staging domain, add that too.

## 4. Redeploy
Go to the **Deployments** tab in Vercel and **Redeploy** your latest preview branch to pick up the new environment variables.

> [!TIP]
> This setup ensures that every time you make a Pull Request, it automatically connects to the **Staging** database, while the `main` branch stays connected to **Production**.
