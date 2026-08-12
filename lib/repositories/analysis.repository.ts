import { createClient } from "@/lib/supabase/server";
import { AiAnalysis, GithubAnalysis } from "@/lib/types/models";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";
import type { SkillCategory } from "@/lib/types";

// ============================================================
// SkillScoreRow — matches the skill_scores DB table schema
// ============================================================
export interface SkillScoreRow {
  user_id: string;
  category: SkillCategory | string;
  score: number;
  evidence: Record<string, unknown>;
  explanation: string;
  improvement_tips: string[];
}

export class AnalysisRepository {
  // ── GitHub Analysis ─────────────────────────────────────────────────────────

  static async saveGithubAnalysis(
    data: Omit<GithubAnalysis, "id" | "created_at" | "updated_at">
  ): Promise<void> {

    console.log("========== SAVING GITHUB ANALYSIS ==========");
    console.log(JSON.stringify(data, null, 2));

    const supabase = await createClient();

    const { data: inserted, error } = await supabase
      .from("github_analysis")
      .upsert(data, {
        onConflict: "user_id",
      })
      .select();

    console.log("Inserted:");
    console.log(inserted);

    console.log("Error:");
    console.log(error);

    if (error) {
      console.log(JSON.stringify(error, null, 2));
      throw error;
    }

    console.log("GitHub analysis saved successfully");
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

  // ── AI Analysis ─────────────────────────────────────────────────────────────

  static async saveAiAnalysis(
    data: Omit<AiAnalysis, "id" | "created_at" | "updated_at">
  ): Promise<void> {
    const supabase = await createClient();
    const { error } = await supabase
      .from("ai_analysis")
      .upsert(data, { onConflict: "user_id" });

    if (error) {
      Logger.error("Failed to save ai analysis", error);
      throw new DatabaseError("Failed to save ai analysis");
    }
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

  // ── Skill Scores ─────────────────────────────────────────────────────────────

  static async upsertSkillScores(rows: SkillScoreRow[]): Promise<void> {
    if (rows.length === 0) return;

    const supabase = await createClient();
    const { error } = await supabase
      .from("skill_scores")
      .upsert(rows, { onConflict: "user_id,category" });

    if (error) {
      Logger.error("Failed to upsert skill scores", error);
      throw new DatabaseError("Failed to save skill scores");
    }
  }

  static async getSkillScores(userId: string): Promise<SkillScoreRow[]> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("skill_scores")
      .select("*")
      .eq("user_id", userId)
      .order("score", { ascending: false });

    if (error) {
      Logger.error("Failed to fetch skill scores", error);
      return [];
    }

    return (data as SkillScoreRow[]) || [];
  }
}
