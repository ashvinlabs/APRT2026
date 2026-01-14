-- Migration: Add photo_url to staff table
-- Date: 2026-01-14 00:00:00
-- Description: Adds a photo_url column to the staff table to support profile photos.

ALTER TABLE public.staff ADD COLUMN IF NOT EXISTS photo_url TEXT;

-- Update the audit log trigger to capture this new column is handled automatically 
-- by the existing generic trigger which captures row_to_json(NEW).
