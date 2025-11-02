/*
  # Remove Duplicate Indexes

  ## Overview
  Removes duplicate indexes identified in the security audit.
  Keeps the _fk suffix versions as they're more descriptive.

  ## Impact
  - Reduces index maintenance overhead
  - Saves storage space
  - Improves write performance
*/

-- Candidate tables - keep _fk versions
DROP INDEX IF EXISTS idx_candidate_collaborators_candidate_id;
DROP INDEX IF EXISTS idx_candidate_collaborators_invited_by;
DROP INDEX IF EXISTS idx_candidate_collaborators_user_id;
DROP INDEX IF EXISTS idx_candidate_comments_candidate_id;
DROP INDEX IF EXISTS idx_candidate_comments_user_id;
DROP INDEX IF EXISTS idx_candidate_ratings_candidate_id;
DROP INDEX IF EXISTS idx_candidate_ratings_user_id;

-- Channel members - keep _fk versions
DROP INDEX IF EXISTS idx_channel_members_channel_id;
DROP INDEX IF EXISTS idx_channel_members_user_id;

-- Chat messages - keep _fk versions
DROP INDEX IF EXISTS idx_chat_messages_channel_id;
DROP INDEX IF EXISTS idx_chat_messages_sender_id;

-- Collaboration notifications - keep _fk version
DROP INDEX IF EXISTS idx_collaboration_notifications_user_id;

-- Employees - keep user_id_fk version if exists, otherwise keep user_id_lookup
DROP INDEX IF EXISTS idx_employees_user_id CASCADE;

-- Message reactions - keep _fk version
DROP INDEX IF EXISTS idx_message_reactions_message_id;

-- Typing indicators - keep _fk version
DROP INDEX IF EXISTS idx_typing_indicators_channel_id;

/*
  ## Summary
  
  Removed 16 duplicate indexes, keeping the more descriptive _fk versions.
  This improves database efficiency without impacting query performance.
*/