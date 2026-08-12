import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { VectorRepository } from "@/lib/repositories/vector.repository";
import { Logger } from "@/lib/core/logger";

// ============================================================
// GET /api/analysis/me
// Returns AI analysis data for the currently authenticated user.
// Combines: ai_analysis + github_analysis + skill_scores + developer_vector
// Used by: AiProfileCard (home page sidebar)
// ============================================================
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = user.id;

    // Parallel fetch — all queries are independent
    const [aiAnalysis, githubAnalysis, skillScores, developerVector] =
      await Promise.allSettled([
        AnalysisRepository.getAiAnalysis(userId),
        AnalysisRepository.getGithubAnalysis(userId),
        AnalysisRepository.getSkillScores(userId),
        VectorRepository.getVector(userId),
      ]);

    return NextResponse.json({
      aiAnalysis:
        aiAnalysis.status === "fulfilled" ? aiAnalysis.value : null,
      githubAnalysis:
        githubAnalysis.status === "fulfilled" ? githubAnalysis.value : null,
      skillScores:
        skillScores.status === "fulfilled" ? skillScores.value : [],
      developerVector:
        developerVector.status === "fulfilled" ? developerVector.value : null,
    });
  } catch (error: any) {
    Logger.error("GET /api/analysis/me failed", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
