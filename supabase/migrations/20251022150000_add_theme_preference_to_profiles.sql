/*
  # Add Theme Preference Support to Profiles

  1. Changes
    - Add `theme_preference` column to `profiles` table
    - Default value is 'system' for auto theme detection
    - Supports 'light', 'dark', and 'system' values

  2. Purpose
    - Enable users to customize their UI theme preference
    - Support dark mode, light mode, and system preference
    - Persist theme choice across sessions
*/

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'profiles' AND column_name = 'theme_preference'
  ) THEN
    ALTER TABLE profiles ADD COLUMN theme_preference text DEFAULT 'system';

    ALTER TABLE profiles ADD CONSTRAINT theme_preference_check
      CHECK (theme_preference IN ('light', 'dark', 'system'));
  END IF;
END $$;

COMMENT ON COLUMN profiles.theme_preference IS 'User theme preference: light, dark, or system';
