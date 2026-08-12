import { AiPromptBuilder } from "@/lib/ai/prompt";
import { OpenRouterClient } from "@/lib/ai/openrouter";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { VectorRepository } from "@/lib/repositories/vector.repository";
import { GitHubSummary } from "@/lib/types/github";
import { ResumeAnalysisResult } from "@/lib/types/resume-analysis";
import { AiAnalysis } from "@/lib/types/models";
import { AiOpenRouterResponse } from "@/lib/types/ai";
import { Logger } from "@/lib/core/logger";

const PROMPT_VERSION = "v1";

// ============================================================
// AiService — orchestrates AI analysis for a developer
// Flow: Build prompt → OpenRouter → Map → Save to 3 tables
//   1. ai_analysis  — summary, scores, strengths/weaknesses
//   2. skill_scores — per-category score rows
//   3. developer_vectors — full vector for team matching
// ============================================================
export class AiService {
  /**
   * Runs AI analysis and saves results to ai_analysis, skill_scores,
   * and developer_vectors tables.
   */
  static async processAndSave(
    userId: string,
    githubSummary: GitHubSummary,
    linkedinSummary: any = null,
    resumeResult?: ResumeAnalysisResult | null
  ): Promise<Omit<AiAnalysis, "id" | "created_at" | "updated_at">> {
    Logger.info(`Starting AI service pipeline for user ${userId}`, {
      hasResume: !!resumeResult,
    });

    // ── Step 1: Build prompt ────────────────────────────────────────────────
    const prompt = AiPromptBuilder.buildPrompt(
      githubSummary,
      linkedinSummary,
      resumeResult
    );

    // ── Step 2: Call OpenRouter ─────────────────────────────────────────────
    const aiResponse = await OpenRouterClient.analyzeProfile(prompt);

    // ── Step 3: Map to ai_analysis row ──────────────────────────────────────
    const aiAnalysisRecord: Omit<AiAnalysis, "id" | "created_at" | "updated_at"> = {
      user_id: userId,
      professional_summary: aiResponse.professionalSummary,
      experience_level: aiResponse.experienceLevel,
      overall_score: aiResponse.overallSkillScore,
      frontend_score: aiResponse.frontendScore,
      backend_score: aiResponse.backendScore,
      ai_score: aiResponse.aiScore,
      cloud_score: aiResponse.cloudScore,
      game_dev_score: 0, // Not part of new schema — preserved for backward compat
      cyber_score: 0,
      documentation_score: 0,
      problem_solving_score: aiResponse.problemSolvingScore,
      project_quality_score: aiResponse.confidence,
      strengths: aiResponse.strengths,
      weaknesses: aiResponse.weaknesses,
      recommended_role: aiResponse.recommendedHackathonRole,
      recommended_team: [],
      recommended_hackathons: [],
      learning_roadmap: [],
    };

    // ── Step 4: Save ai_analysis ─────────────────────────────────────────────
    await AnalysisRepository.saveAiAnalysis(aiAnalysisRecord);
    Logger.info(`AI analysis saved for user ${userId}`);

    // ── Step 5: Save skill_scores rows ──────────────────────────────────────
    await this.saveSkillScores(userId, aiResponse, resumeResult);

    // ─────────────────────────────────────────────────────────────
    // Step 6 : Save Developer Vector
    // ─────────────────────────────────────────────────────────────
    /*
        const embedding = [
          aiResponse.frontendScore,
          aiResponse.backendScore,
          aiResponse.databaseScore,
          aiResponse.cloudScore,
          aiResponse.aiScore,
          aiResponse.mobileScore,
          aiResponse.problemSolvingScore,
          aiResponse.leadershipScore,
          aiResponse.overallSkillScore,
        ];
    
        const metadata = {
          frontend_score: aiResponse.frontendScore,
          backend_score: aiResponse.backendScore,
          database_score: aiResponse.databaseScore,
          cloud_score: aiResponse.cloudScore,
          ai_score: aiResponse.aiScore,
          mobile_score: aiResponse.mobileScore,
          problem_solving_score: aiResponse.problemSolvingScore,
          leadership_score: aiResponse.leadershipScore,
          overall_score: aiResponse.overallSkillScore,
          recommended_role: aiResponse.recommendedHackathonRole,
          experience_level: aiResponse.experienceLevel,
          professional_summary: aiResponse.professionalSummary,
          project_complexity: aiResponse.projectComplexity,
          confidence: aiResponse.confidence,
          prompt_version: PROMPT_VERSION,
        };
    
    
        
    
        console.log("Embedding length:", embedding.length);
        console.log(embedding);
    
        await VectorRepository.upsertVector(
          userId,
          embedding,
          metadata
        );
    
    
        Logger.info(`Developer vector saved for user ${userId}`);
    */






    // TODO:
    // Generate a real 384-dimensional embedding using a sentence
    // embedding model (MiniLM/BGE/OpenAI) before saving.
    //
    // Skipping vector storage for now because semantic embeddings
    // are not yet implemented.

    Logger.info("Developer vector generation skipped.");
    return aiAnalysisRecord;
  }

  /**
   * Builds and saves per-category skill score rows.
   * Merges GitHub and resume signals for richer context.
   */
  private static async saveSkillScores(
    userId: string,
    ai: AiOpenRouterResponse,
    resume?: ResumeAnalysisResult | null
  ): Promise<void> {
    const rows = [
      {
        user_id: userId,
        category: "frontend",
        score: ai.frontendScore,
        evidence: {
          frameworks: ai.frameworks,
          languages: ai.programmingLanguages,
        },
        explanation: `Frontend score based on ${ai.frameworks.length > 0 ? ai.frameworks.slice(0, 3).join(", ") : "GitHub activity"}.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "backend",
        score: ai.backendScore,
        evidence: {
          tools: ai.tools,
          databases: resume?.databases ?? [],
        },
        explanation: `Backend score based on server-side technology usage.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "ai_ml",
        score: ai.aiScore,
        evidence: {
          ai_ml: resume?.ai_ml ?? [],
          skills: ai.technicalSkills.filter(
            (s) =>
              s.toLowerCase().includes("ml") ||
              s.toLowerCase().includes("ai") ||
              s.toLowerCase().includes("tensorflow") ||
              s.toLowerCase().includes("pytorch")
          ),
        },
        explanation: `AI/ML score based on machine learning frameworks and projects.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "cloud",
        score: ai.cloudScore,
        evidence: {
          cloud: resume?.cloud ?? [],
          devops: resume?.devops ?? [],
        },
        explanation: `Cloud/DevOps score based on deployment and infrastructure tools.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "problem_solving",
        score: ai.problemSolvingScore,
        evidence: { languages: ai.programmingLanguages },
        explanation: `Problem-solving score based on algorithmic language usage and project complexity.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "leadership",
        score: ai.leadershipScore,
        evidence: { strengths: ai.strengths },
        explanation: `Leadership score based on open-source contributions and project ownership.`,
        improvement_tips: [] as string[],
      },
      {
        user_id: userId,
        category: "overall",
        score: ai.overallSkillScore,
        evidence: { confidence: ai.confidence, complexity: ai.projectComplexity },
        explanation: `Overall score (AI confidence: ${ai.confidence}%, project complexity: ${ai.projectComplexity}).`,
        improvement_tips: [] as string[],
      },
    ].filter((row) => row.score > 0);

    if (rows.length > 0) {
      await AnalysisRepository.upsertSkillScores(rows);
      Logger.info(`Skill scores saved for user ${userId}`, {
        categories: rows.map((r) => r.category),
      });
    }
  }
}
