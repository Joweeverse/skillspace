-- Migration: Add cover_url column to courses table (if it doesn't already exist)
-- Run this in the Supabase SQL editor ONLY if the column is missing.
-- Check first: SELECT column_name FROM information_schema.columns WHERE table_name = 'courses' AND column_name = 'cover_url';

ALTER TABLE courses ADD COLUMN IF NOT EXISTS cover_url text;
