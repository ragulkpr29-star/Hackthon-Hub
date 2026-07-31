import { createClient } from "@/lib/supabase/server";
import { AiAnalysis, GithubAnalysis } from "@/lib/types/models";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";

export class AnalysisRepository {
  static async saveGithubAnalysis(data: Omit<GithubAnalysis, "id" | "created_at" | "updated_at">): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("github_analysis")
      .upsert(data, { onConflict: "user_id" });

    if (error) {
      Logger.error("Failed to save github analysis", error);
      throw new DatabaseError("Failed to save github analysis");
    }
  }

  static async saveAiAnalysis(data: Omit<AiAnalysis, "id" | "created_at" | "updated_at">): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("ai_analysis")
      .upsert(data, { onConflict: "user_id" });

    if (error) {
      Logger.error("Failed to save ai analysis", error);
      throw new DatabaseError("Failed to save ai analysis");
    }
  }

  static async getGithubAnalysis(userId: string): Promise<GithubAnalysis | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("github_analysis")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      Logger.error("Failed to fetch github analysis", error);
      throw new DatabaseError("Failed to fetch github analysis");
    }

    return (data as GithubAnalysis) || null;
  }

  static async getAiAnalysis(userId: string): Promise<AiAnalysis | null> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("ai_analysis")
      .select("*")
      .eq("user_id", userId)
      .single();

    if (error && error.code !== "PGRST116") {
      Logger.error("Failed to fetch ai analysis", error);
      throw new DatabaseError("Failed to fetch ai analysis");
    }

    return (data as AiAnalysis) || null;
  }
}
