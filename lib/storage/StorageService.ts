import { createClient } from '@/lib/supabase/client';

export class StorageService {
  private supabase = createClient();

  async uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    const { data, error } = await this.supabase.storage
      .from(bucket)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
      });

    if (error) {
      console.error(`Error uploading to ${bucket}:`, error);
      return null;
    }

    const { data: publicUrlData } = this.supabase.storage
      .from(bucket)
      .getPublicUrl(data.path);

    return publicUrlData.publicUrl;
  }
}
