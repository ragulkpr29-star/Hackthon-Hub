import { AiPromptBuilder } from "@/lib/ai/prompt";
import { GeminiClient } from "@/lib/ai/gemini";
import { DeterministicScorer } from "@/lib/ai/scoring";
import { RecommendationEngine } from "@/lib/ai/recommendations";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { GitHubSummary } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";
import { AiAnalysis } from "@/lib/types/models";

export class AiService {
  static async processAndSave(userId: string, githubSummary: GitHubSummary): Promise<Omit<AiAnalysis, "id" | "created_at" | "updated_at">> {
    Logger.info(`Starting AI service pipeline for user ${userId}`);

    // Build Prompt
    const prompt = AiPromptBuilder.buildPrompt(githubSummary);

    // Get Gemini Analysis
    const geminiResponse = await GeminiClient.analyzeProfile(prompt);

    // Calculate Deterministic Scores
    const scores = DeterministicScorer.calculate(githubSummary);

    // Generate Final Recommendations
    const finalAnalysis = RecommendationEngine.synthesize(geminiResponse, scores);

    // Save Results
    const aiAnalysisRecord = {
      user_id: userId,
      ...finalAnalysis,
    };

    await AnalysisRepository.saveAiAnalysis(aiAnalysisRecord);

    Logger.info(`Completed AI service pipeline for user ${userId}`);
    
    return aiAnalysisRecord;
  }
}
