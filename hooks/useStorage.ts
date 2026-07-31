'use client';

import { useState, useCallback } from 'react';
import { StorageService } from '../lib/storage/StorageService';

export function useStorage() {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const storageService = new StorageService();

  const uploadFile = useCallback(async (bucket: string, path: string, file: File) => {
    setUploading(true);
    setError(null);
    try {
      const url = await storageService.uploadFile(bucket, path, file);
      if (!url) throw new Error('Upload failed');
      return url;
    } catch (err: any) {
      setError(err.message || 'An error occurred during upload');
      return null;
    } finally {
      setUploading(false);
    }
  }, []);

  return { uploadFile, uploading, error };
}
