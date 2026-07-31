import { createClient } from '@/lib/supabase/client';
import type { Profile, SkillCategory } from '@/lib/types';
import type { ProfileFormData } from '@/lib/schemas/profile.schema';

export interface SkillScoreRow {
  user_id: string;
  category: SkillCategory;
  score: number;
  evidence: Record<string, unknown>;
  explanation: string;
  improvement_tips: string[];
}

export class ProfileRepository {
  private supabase = createClient();

  async getProfile(userId: string): Promise<Profile | null> {
    const { data, error } = await this.supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching profile:', error);
      return null;
    }

    return data as Profile;
  }

  async updateProfile(
    userId: string,
    data: Partial<Profile>
  ): Promise<boolean> {

    console.log("========================================");
    console.log("PROFILE UPDATE START");
    console.log("========================================");

    // -------------------------------------------------------
    // Check authenticated session
    // -------------------------------------------------------

    const {
      data: { session },
    } = await this.supabase.auth.getSession();

    console.log("SESSION:");
    console.log(session);

    console.log("USER ID:");
    console.log(session?.user?.id);

    console.log("TARGET PROFILE:");
    console.log(userId);

    // -------------------------------------------------------
    // Log update payload
    // -------------------------------------------------------

    console.log("UPDATE PAYLOAD:");
    console.log(JSON.stringify(data, null, 2));

    // -------------------------------------------------------
    // Perform update
    // -------------------------------------------------------

    const {
      data: updatedRow,
      error,
    } = await this.supabase
      .from('profiles')
      .update(data)
      .eq('id', userId)
      .select();

    console.log("UPDATED ROW:");
    console.log(updatedRow);

    if (error) {
      console.error("========================================");
      console.error("SUPABASE UPDATE ERROR");
      console.error("========================================");

      console.error("MESSAGE:");
      console.error(error.message);

      console.error("DETAILS:");
      console.error(error.details);

      console.error("HINT:");
      console.error(error.hint);

      console.error("CODE:");
      console.error(error.code);

      console.error(error);

      return false;
    }

    console.log("========================================");
    console.log("PROFILE UPDATED SUCCESSFULLY");
    console.log("========================================");

    return true;
  }

  async upsertSkillScores(rows: SkillScoreRow[]): Promise<boolean> {

    console.log("========================================");
    console.log("UPSERT SKILL SCORES");
    console.log("========================================");

    console.log(rows);

    if (rows.length === 0) {
      console.log("No skill scores to save.");
      return true;
    }

    const {
      data,
      error,
    } = await this.supabase
      .from('skill_scores')
      .upsert(rows, {
        onConflict: 'user_id,category',
      })
      .select();

    console.log("UPSERT RESULT:");
    console.log(data);

    if (error) {
      console.error("SKILL SCORE ERROR");
      console.error(error);
      return false;
    }

    console.log("SKILL SCORES SAVED");

    return true;
  }
}