/*
  # Migrate System Theme Preferences to Light Theme

  1. Changes
    - Update all existing 'system' theme preferences to 'light'
    - Add check constraint to only allow 'light' or 'dark' values
    - Set default theme preference to 'light' for future profiles
  
  2. Security
    - No changes to RLS policies
    - Only updates data and adds constraint for data integrity
*/

-- Update all existing 'system' theme preferences to 'light'
UPDATE profiles
SET theme_preference = 'light'
WHERE theme_preference = 'system' OR theme_preference IS NULL;

-- Add check constraint to only allow 'light' or 'dark' values
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

-- Update the default value to 'light'
ALTER TABLE profiles
ALTER COLUMN theme_preference SET DEFAULT 'light';
