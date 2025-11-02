/*
  # Add Previous Status Tracking to Candidates

  1. Changes
    - Add previous_status column to track the candidate's status before disqualification
    - This allows restoring candidates to their previous stage
    
  2. Security
    - No changes to RLS policies needed
*/

-- Add previous_status column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'candidates' AND column_name = 'previous_status'
  ) THEN
    ALTER TABLE candidates ADD COLUMN previous_status text;
  END IF;
END $$;
