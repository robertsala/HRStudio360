/*
  # Video and Voice Calling System

  1. New Tables
    - `call_sessions`
      - `id` (uuid, primary key)
      - `channel_id` (uuid, references chat_channels)
      - `caller_id` (uuid, references auth.users)
      - `call_type` (text: 'voice' or 'video')
      - `status` (text: 'ringing', 'active', 'ended', 'missed', 'declined')
      - `started_at` (timestamptz)
      - `ended_at` (timestamptz)
      - `duration` (integer, seconds)
    
    - `call_participants`
      - `id` (uuid, primary key)
      - `call_session_id` (uuid, references call_sessions)
      - `user_id` (uuid, references auth.users)
      - `joined_at` (timestamptz)
      - `left_at` (timestamptz)
      - `status` (text: 'calling', 'connected', 'disconnected')
    
    - `call_signaling`
      - `id` (uuid, primary key)
      - `call_session_id` (uuid, references call_sessions)
      - `from_user_id` (uuid, references auth.users)
      - `to_user_id` (uuid, references auth.users)
      - `signal_type` (text: 'offer', 'answer', 'ice-candidate')
      - `signal_data` (jsonb)
      - `created_at` (timestamptz)

  2. Security
    - Enable RLS on all tables
    - Policies for call participants only
*/

-- Call Sessions Table
CREATE TABLE IF NOT EXISTS call_sessions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  channel_id uuid REFERENCES chat_channels(id) ON DELETE CASCADE NOT NULL,
  caller_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  call_type text NOT NULL CHECK (call_type IN ('voice', 'video')),
  status text NOT NULL DEFAULT 'ringing' CHECK (status IN ('ringing', 'active', 'ended', 'missed', 'declined')),
  started_at timestamptz DEFAULT now(),
  ended_at timestamptz,
  duration integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE call_sessions ENABLE ROW LEVEL SECURITY;

-- Call Participants Table
CREATE TABLE IF NOT EXISTS call_participants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id uuid REFERENCES call_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  joined_at timestamptz DEFAULT now(),
  left_at timestamptz,
  status text NOT NULL DEFAULT 'calling' CHECK (status IN ('calling', 'connected', 'disconnected')),
  created_at timestamptz DEFAULT now()
);

ALTER TABLE call_participants ENABLE ROW LEVEL SECURITY;

-- Call Signaling Table (for WebRTC)
CREATE TABLE IF NOT EXISTS call_signaling (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  call_session_id uuid REFERENCES call_sessions(id) ON DELETE CASCADE NOT NULL,
  from_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  to_user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  signal_type text NOT NULL CHECK (signal_type IN ('offer', 'answer', 'ice-candidate')),
  signal_data jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE call_signaling ENABLE ROW LEVEL SECURITY;

-- Policies for call_sessions
CREATE POLICY "Channel members can view calls"
  ON call_sessions FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = call_sessions.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Channel members can create calls"
  ON call_sessions FOR INSERT
  TO authenticated
  WITH CHECK (
    caller_id = auth.uid() AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.channel_id = call_sessions.channel_id
      AND channel_members.user_id = auth.uid()
    )
  );

CREATE POLICY "Call participants can update calls"
  ON call_sessions FOR UPDATE
  TO authenticated
  USING (
    caller_id = auth.uid() OR
    id IN (
      SELECT call_session_id FROM call_participants
      WHERE user_id = auth.uid()
    )
  )
  WITH CHECK (
    caller_id = auth.uid() OR
    id IN (
      SELECT call_session_id FROM call_participants
      WHERE user_id = auth.uid()
    )
  );

-- Policies for call_participants
CREATE POLICY "Users can view their call participations"
  ON call_participants FOR SELECT
  TO authenticated
  USING (
    user_id = auth.uid() OR
    call_session_id IN (
      SELECT call_session_id FROM call_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create their participation"
  ON call_participants FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their participation"
  ON call_participants FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Policies for call_signaling
CREATE POLICY "Call participants can view signals"
  ON call_signaling FOR SELECT
  TO authenticated
  USING (
    from_user_id = auth.uid() OR
    to_user_id = auth.uid() OR
    call_session_id IN (
      SELECT call_session_id FROM call_participants
      WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Call participants can send signals"
  ON call_signaling FOR INSERT
  TO authenticated
  WITH CHECK (
    from_user_id = auth.uid() AND
    call_session_id IN (
      SELECT call_session_id FROM call_participants
      WHERE user_id = auth.uid()
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_call_sessions_channel ON call_sessions(channel_id);
CREATE INDEX IF NOT EXISTS idx_call_sessions_status ON call_sessions(status);
CREATE INDEX IF NOT EXISTS idx_call_participants_session ON call_participants(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_participants_user ON call_participants(user_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_session ON call_signaling(call_session_id);
CREATE INDEX IF NOT EXISTS idx_call_signaling_to_user ON call_signaling(to_user_id);
