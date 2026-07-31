import { AiGeminiResponse, DeterministicScores } from "@/lib/types/ai";

export class RecommendationEngine {
  static synthesize(aiResponse: AiGeminiResponse, scores: DeterministicScores): Omit<AiGeminiResponse, "explanation"> & DeterministicScores {
    // In a more complex system, we might override Gemini's recommendations if our deterministic scores strongly disagree.
    // For now, we trust Gemini's qualitative insights (strengths, weaknesses, roles) and combine them with our deterministic scores.
    
    return {
      strengths: aiResponse.strengths,
      weaknesses: aiResponse.weaknesses,
      recommended_role: aiResponse.recommended_role,
      recommended_team: aiResponse.recommended_team,
      recommended_hackathons: aiResponse.recommended_hackathons,
      learning_roadmap: aiResponse.learning_roadmap,
      ...scores,
    };
  }
}
