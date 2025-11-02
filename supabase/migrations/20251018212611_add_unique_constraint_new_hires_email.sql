/*
  # Add unique constraint to new_hires table

  1. Changes
    - Add unique constraint on email field in new_hires table
    - Prevents duplicate new hire records for the same candidate
    - Also add index on candidate_id for better lookups

  2. Notes
    - This ensures each candidate can only be converted to new hire once
    - Existing duplicate records have been cleaned up before this migration
*/

-- Add unique constraint on email
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'new_hires_email_key'
  ) THEN
    ALTER TABLE new_hires ADD CONSTRAINT new_hires_email_key UNIQUE (email);
  END IF;
END $$;

-- Add index on candidate_id for faster lookups
CREATE INDEX IF NOT EXISTS idx_new_hires_candidate_id ON new_hires(candidate_id);