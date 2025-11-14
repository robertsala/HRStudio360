// Object uploader component for HRStudio360
// Simplified file upload without Uppy modal to avoid module resolution issues
import { useState, useRef } from "react";
import type { ReactNode } from "react";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: (file: File) => Promise<{
    method: string;
    url: string;
    fields?: Record<string, string>;
    headers?: Record<string, string>;
  }>;
  onComplete?: (result: { successful: Array<{ uploadURL: string }> }) => void;
  buttonClassName?: string;
  children: ReactNode;
}

/**
 * A simple file upload component that uses native HTML file input
 * Simplified version without Uppy modal to avoid module resolution issues
 */
export function ObjectUploader({
  maxFileSize = 10485760, // 10MB default
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Validate file size
    if (file.size > maxFileSize) {
      alert(`File is too large. Maximum size is ${(maxFileSize / (1024 * 1024)).toFixed(1)}MB`);
      return;
    }

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      alert('Please select an image file');
      return;
    }

    setIsUploading(true);
    try {
      // Get presigned URL from backend
      const { method, url } = await onGetUploadParameters(file);

      // Upload file to storage using the full presigned URL (with query params)
      const uploadResponse = await fetch(url, {
        method,
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      });

      if (!uploadResponse.ok) {
        throw new Error('Upload failed');
      }

      // Call onComplete with the full upload URL (needed for normalization)
      onComplete?.({ 
        successful: [{ uploadURL: url }] 
      });
    } catch (error) {
      console.error('Upload error:', error);
      alert('Failed to upload file. Please try again.');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
        data-testid="input-file-upload"
      />
      <button 
        type="button"
        onClick={() => fileInputRef.current?.click()}
        disabled={isUploading}
        className={buttonClassName || "px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center disabled:opacity-50 disabled:cursor-not-allowed"}
        data-testid="button-upload-image"
      >
        {isUploading ? 'Uploading...' : children}
      </button>
    </div>
  );
}
