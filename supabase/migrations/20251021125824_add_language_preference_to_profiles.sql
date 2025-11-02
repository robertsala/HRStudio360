/*
  # Add Language Preference to Profiles

  1. Changes
    - Add `preferred_language` column to profiles table
    - Default to 'en' for English
    - Allow 'en' or 'es' values
  
  2. Purpose
    - Store user's language preference for the application
    - Persist language selection across sessions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'preferred_language'
  ) THEN
    ALTER TABLE profiles ADD COLUMN preferred_language text DEFAULT 'en' CHECK (preferred_language IN ('en', 'es'));
  END IF;
END $$;
