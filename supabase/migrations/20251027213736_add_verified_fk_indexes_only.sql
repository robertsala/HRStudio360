/*
  # Add Foreign Key Indexes for Verified Tables Only

  ## Overview
  Adds foreign key indexes only for tables that are verified to exist
  in the 20251027_complete_chat_system_rebuild.sql migration.

  ## Coverage
  Chat system and hiring collaboration tables
*/

-- Chat System
CREATE INDEX IF NOT EXISTS idx_chat_channels_created_by_fk ON chat_channels(created_by);
CREATE INDEX IF NOT EXISTS idx_channel_members_channel_id_fk ON channel_members(channel_id);
CREATE INDEX IF NOT EXISTS idx_channel_members_user_id_fk ON channel_members(user_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_id_fk ON chat_messages(channel_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_sender_id_fk ON chat_messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_chat_messages_reply_to_message_id_fk ON chat_messages(reply_to_message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id_fk ON message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id_fk ON message_reactions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_presence_user_id_fk ON user_presence(user_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_channel_id_fk ON typing_indicators(channel_id);
CREATE INDEX IF NOT EXISTS idx_typing_indicators_user_id_fk ON typing_indicators(user_id);

-- Hiring Collaboration
CREATE INDEX IF NOT EXISTS idx_candidate_ratings_candidate_id_fk ON candidate_ratings(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_ratings_user_id_fk ON candidate_ratings(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_candidate_id_fk ON candidate_comments(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_comments_user_id_fk ON candidate_comments(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_candidate_id_fk ON candidate_collaborators(candidate_id);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_user_id_fk ON candidate_collaborators(user_id);
CREATE INDEX IF NOT EXISTS idx_candidate_collaborators_invited_by_fk ON candidate_collaborators(invited_by);
CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_collaborator_id_fk ON collaboration_notifications(collaborator_id);
CREATE INDEX IF NOT EXISTS idx_collaboration_notifications_user_id_fk ON collaboration_notifications(user_id);

-- Composite indexes
CREATE INDEX IF NOT EXISTS idx_chat_messages_channel_created_at ON chat_messages(channel_id, created_at DESC);

ANALYZE chat_messages;
ANALYZE chat_channels;
ANALYZE candidate_ratings;

/*
  Added 20 foreign key indexes for chat and hiring systems.
*/