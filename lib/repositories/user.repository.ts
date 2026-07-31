import { createClient } from "@/lib/supabase/server";
import { Profile } from "@/lib/types/models";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";

export class UserRepository {
  static async getProfile(userId: string): Promise<Profile | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (error) {
      if (error.code === "PGRST116") return null; // No rows found
      Logger.error("Failed to get profile", error);
      throw new DatabaseError("Failed to fetch profile from database");
    }

    return data as Profile;
  }

  static async createProfile(profile: Partial<Profile>): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .insert(profile)
      .select()
      .single();

    if (error) {
      Logger.error("Failed to create profile", error);
      throw new DatabaseError("Failed to create profile in database");
    }

    return data as Profile;
  }

  static async updateProfile(userId: string, updates: Partial<Profile>): Promise<Profile> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      Logger.error("Failed to update profile", error);
      throw new DatabaseError("Failed to update profile in database");
    }

    return data as Profile;
  }
}
