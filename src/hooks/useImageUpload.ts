'use client';

import { useState } from 'react';

interface UseImageUploadResult {
  uploading: boolean;
  error: string | null;
  uploadImage: (file: File) => Promise<string>;
  deleteImage: (url: string) => Promise<void>;
  progress: number;
}

export function useImageUpload(): UseImageUploadResult {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);

  const uploadImage = async (file: File): Promise<string> => {
    try {
      setUploading(true);
      setError(null);
      setProgress(0);

      // 画像ファイルのバリデーション
      if (!file.type.startsWith('image/')) {
        throw new Error('File must be an image');
      }

      // 10MBを超えるファイルはアップロード不可
      if (file.size > 10 * 1024 * 1024) {
        throw new Error('File size must be less than 10MB');
      }

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('Failed to upload image');
      }

      const data = await response.json();
      setProgress(100);
      return data.url;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    } finally {
      setUploading(false);
    }
  };

  const deleteImage = async (url: string): Promise<void> => {
    try {
      setError(null);

      const response = await fetch(`/api/upload?url=${encodeURIComponent(url)}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete image');
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : 'An error occurred';
      setError(message);
      throw new Error(message);
    }
  };

  return {
    uploading,
    error,
    uploadImage,
    deleteImage,
    progress,
  };
}
