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
      console.log("========== GET PROFILE ERROR ==========");
      console.log(error);
      console.log(JSON.stringify(error, null, 2));

      if (error.code === "PGRST116") return null;

      Logger.error("Failed to get profile", error);
      throw error;
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
      console.log("========== CREATE PROFILE ERROR ==========");
      console.log(error);
      console.log(JSON.stringify(error, null, 2));

      Logger.error("Failed to create profile", error);
      throw error;
    }

    return data as Profile;
  }

  static async updateProfile(
    userId: string,
    updates: Partial<Profile>
  ): Promise<Profile> {
    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
      .select()
      .single();

    if (error) {
      console.log("========== UPDATE PROFILE ERROR ==========");
      console.log(error);
      console.log(JSON.stringify(error, null, 2));

      Logger.error("Failed to update profile", error);
      throw error;
    }

    return data as Profile;
  }

  static async upsertProfile(
    profile: Partial<Profile> & { id: string }
  ): Promise<Profile> {

    console.log("========== UPSERT PROFILE ==========");
    console.log("Incoming Profile:");
    console.log(JSON.stringify(profile, null, 2));

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("profiles")
      .upsert(profile, {
        onConflict: "id",
      })
      .select()
      .single();

    console.log("Returned Data:");
    console.log(data);

    console.log("Returned Error:");
    console.log(error);

    if (error) {
      console.log("========== UPSERT PROFILE ERROR ==========");
      console.log(error);
      console.log(JSON.stringify(error, null, 2));

      Logger.error("Failed to upsert profile", error);

      // Throw the ORIGINAL Supabase error
      throw error;
    }

    console.log("========== UPSERT SUCCESS ==========");
    console.log(data);

    return data as Profile;
  }
}