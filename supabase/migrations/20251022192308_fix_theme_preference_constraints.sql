/*
  # Fix Theme Preference Constraints

  1. Changes
    - Remove old `theme_preference_check` constraint that allows 'system'
    - Keep `profiles_theme_preference_check` that only allows 'light' and 'dark'
    - Update any existing 'system' values to 'light'

  2. Purpose
    - Ensure only 'light' and 'dark' themes are allowed
    - Remove conflicting constraints
    - Clean up data integrity
*/

-- Update any remaining 'system' values to 'light'
UPDATE profiles
SET theme_preference = 'light'
WHERE theme_preference = 'system' OR theme_preference NOT IN ('light', 'dark');

-- Drop the old constraint that allows 'system'
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'theme_preference_check'
  ) THEN
    ALTER TABLE profiles DROP CONSTRAINT theme_preference_check;
  END IF;
END $$;

-- Ensure the correct constraint exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'profiles_theme_preference_check'
  ) THEN
    ALTER TABLE profiles
    ADD CONSTRAINT profiles_theme_preference_check
    CHECK (theme_preference IN ('light', 'dark'));
  END IF;
END $$;
