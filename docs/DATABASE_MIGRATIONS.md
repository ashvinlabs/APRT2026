# Database Migrations Guide

This guide explains how to manage database changes across **Staging** and **Production** environments using the Supabase CLI.

## 1. Prerequisites

- [Supabase CLI](https://supabase.com/docs/guides/cli) installed.
- Logged in to your Supabase account:
  ```powershell
  supabase login
  ```

## 2. Migration Workflow

All database changes should be stored as files in the `supabase/migrations` directory. These files are version-controlled and ensure consistency across environments.

### Step A: Apply to Staging (Test)
Always apply changes to the Staging environment first to verify the code logic.

1. **Link to Staging Project**:
   ```powershell
   supabase link --project-ref your-staging-project-ref
   ```
   *(Find the Project Ref ID in Supabase Dashboard > Settings > General)*

2. **Push Migrations**:
   ```powershell
   supabase db push
   ```
   This will detect any new files in `supabase/migrations/` and execute them on Staging.

### Step B: Apply to Production (Live)
Once verified on Staging, follow the same steps for Production.

1. **Link to Production Project**:
   ```powershell
   supabase link --project-ref your-production-project-ref
   ```

2. **Push Migrations**:
   ```powershell
   supabase db push
   ```

## 3. Creating New Migrations

If you need to make new changes:

1. **Generate a new migration file**:
   ```powershell
   supabase migration new descriptive_name
   ```
2. **Edit the file**: Open the newly created file in `supabase/migrations/` and add your SQL.
3. **Reflect on Local/Staging**: Run `supabase db push`.

## 4. Why use CLI Migrations?

- **Consistency**: Prevents "drift" where Staging and Production have different structures.
- **Traceability**: You can see exactly what changed and when in your Git history.
- **Automation**: Allows for future CI/CD integration (e.g., automatically pushing migrations when a PR is merged).

---
*Last updated for Semi-Digital Workflow (2026-01-12)*
