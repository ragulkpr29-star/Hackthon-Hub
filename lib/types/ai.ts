import { z } from "zod";

export const AiGeminiResponseSchema = z.object({
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommended_role: z.string(),
  recommended_team: z.array(z.string()),
  recommended_hackathons: z.array(z.string()),
  learning_roadmap: z.array(z.string()),
  explanation: z.string(),
});

export type AiGeminiResponse = z.infer<typeof AiGeminiResponseSchema>;

export interface DeterministicScores {
  overall_score: number;
  frontend_score: number;
  backend_score: number;
  ai_score: number;
  cloud_score: number;
  game_dev_score: number;
  cyber_score: number;
  documentation_score: number;
  problem_solving_score: number;
  project_quality_score: number;
}
