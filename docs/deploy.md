---
description: Deployment guide for APRT2026 to Vercel and Supabase
---

# Deployment Guide

Follow these steps to deploy the APRT2026 application to Vercel and Supabase.

## 1. Supabase Setup (Database & Auth)

1. Create a new project on [Supabase](https://supabase.com/).
2. In the Supabase Dashboard, go to **SQL Editor**.
3. Create a new query and paste the contents of [schema.sql](file:///g:/Work/ashvinlabs/repos/APRT2026/schema.sql) and run it. This will create all necessary tables and RLS policies.
4. Go to **Project Settings > API** and copy:
   - `Project URL`
   - `anon public API Key`
5. Go to **Authentication > Providers** and ensure `Email` is enabled. 
6. (Optional) Disable `Confirm Email` if you want immediate access after registration for testing.

## 2. Vercel Setup (Frontend)

1. Create a new project on [Vercel](https://vercel.com/).
2. Connect your GitHub repository.
3. In the **Environment Variables** section, add the following:
   - `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase Project URL.
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Your Supabase anon public API Key.
4. Leave other settings as default and click **Deploy**.

## 3. Initial Super Admin Setup

1. Once deployed, navigate to your Vercel URL.
2. Go to the registrations page (once implemented in the next phase) or use the Supabase Auth Dashboard to create the first user.
3. After creating the user in Supabase Auth, go to the `public.staff` table in the Supabase Table Editor.
4. Manually insert a row for your user:
   - `user_id`: The ID of the user you just created in Auth.
   - `name`: Your name.
   - `role`: `super_admin`.

## 4. Troubleshooting

- **CORS Issues**: If you encounter CORS issues, ensure your Vercel URL is added to the "Additional Redirect URLs" in **Supabase > Authentication > URL Configuration**.
- **Custom Domains**: If you want to use a custom domain (e.g., `aprt12-2026.ashvinlabs.com`), follow the [Custom Domain Guide](file:///g:/Work/ashvinlabs/repos/APRT2026/docs/custom-domain.md).
- **RLS Errors**: Ensure all RLS policies in `schema.sql` are correctly applied.
