/*
  # Chat Attachments Storage Bucket

  1. Storage Setup
    - Creates 'chat-attachments' bucket for file uploads
    - Sets up RLS policies for secure file access
    - Only channel members can access files from their channels
    
  2. Security
    - Files are organized by channel_id/filename
    - Users can only upload to channels they're members of
    - Users can only download files from channels they're members of
*/

-- Create storage bucket for chat attachments
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'chat-attachments',
  'chat-attachments',
  false,
  52428800, -- 50MB limit
  ARRAY[
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-excel',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'text/plain',
    'text/csv'
  ]
)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload files to channels they are members of
CREATE POLICY "Users can upload files to their channels"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'chat-attachments' AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.user_id = auth.uid()
      AND channel_members.channel_id = (storage.foldername(name))[1]::uuid
    )
  );

-- Allow users to view files from channels they are members of
CREATE POLICY "Users can view files from their channels"
  ON storage.objects FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    EXISTS (
      SELECT 1 FROM channel_members
      WHERE channel_members.user_id = auth.uid()
      AND channel_members.channel_id = (storage.foldername(name))[1]::uuid
    )
  );

-- Allow users to delete their own uploaded files
CREATE POLICY "Users can delete their own files"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (
    bucket_id = 'chat-attachments' AND
    owner = auth.uid()
  );
