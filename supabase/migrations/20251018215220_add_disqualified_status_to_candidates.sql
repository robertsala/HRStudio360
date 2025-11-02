/*
  # Add Disqualified Status and Reason to Candidates

  1. Changes
    - Add 'Disqualified' to the status enum
    - Add disqualified_reason column to store why candidate was disqualified
    - Add disqualified_date column to track when disqualification happened
    
  2. Security
    - No changes to RLS policies needed
*/

-- Drop existing check constraint
DO $$ 
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.constraint_column_usage 
    WHERE table_name = 'candidates' AND constraint_name LIKE '%status%check%'
  ) THEN
    ALTER TABLE candidates DROP CONSTRAINT IF EXISTS candidates_status_check;
  END IF;
END $$;

-- Add new columns if they don't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'disqualified_reason'
  ) THEN
    ALTER TABLE candidates ADD COLUMN disqualified_reason text DEFAULT '';
  END IF;
  
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'disqualified_date'
  ) THEN
    ALTER TABLE candidates ADD COLUMN disqualified_date timestamptz;
  END IF;
END $$;

-- Add new check constraint with Disqualified status
ALTER TABLE candidates 
ADD CONSTRAINT candidates_status_check 
CHECK (status IN ('New Candidate', 'Phone Screen', 'Interview', 'Offer Sent', 'Offer Accepted', 'Hired', 'Rejected', 'Disqualified'));