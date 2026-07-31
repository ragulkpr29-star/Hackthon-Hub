'use client';

import { useState, useCallback } from 'react';
import { ProfileService } from '../lib/services/ProfileService';
import type { ProfileFormData } from '../lib/schemas/profile.schema';

export function useProfile() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const profileService = new ProfileService();

  const completeProfile = useCallback(async (
    userId: string,
    data: ProfileFormData,
    avatarFile?: File,
    resumeFile?: File
  ) => {
    setLoading(true);
    setError(null);
    try {
      const success = await profileService.completeOnboarding(userId, data, avatarFile, resumeFile);
      if (!success) throw new Error('Failed to update profile');
      return true;
    } catch (err: any) {
      setError(err.message || 'An error occurred while updating profile');
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  return { completeProfile, loading, error };
}
