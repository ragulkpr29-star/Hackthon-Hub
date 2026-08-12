import { z } from "zod";

// ============================================================
// OpenRouter / DeepSeek Response Schema
// The AI MUST return this exact JSON structure.
// All scores are integers 0-100.
// ============================================================
export const AiOpenRouterResponseSchema = z.object({
  professionalSummary: z.string().default(""),
  experienceLevel: z.string().default("Intermediate"),
  technicalSkills: z.array(z.string()).default([]),
  programmingLanguages: z.array(z.string()).default([]),
  frameworks: z.array(z.string()).default([]),
  tools: z.array(z.string()).default([]),
  strengths: z.array(z.string()).default([]),
  weaknesses: z.array(z.string()).default([]),
  recommendedHackathonRole: z.string().default("Full-Stack Developer"),
  projectComplexity: z.string().default("Medium"),
  frontendScore: z.number().min(0).max(100).default(0),
  backendScore: z.number().min(0).max(100).default(0),
  databaseScore: z.number().min(0).max(100).default(0),
  cloudScore: z.number().min(0).max(100).default(0),
  aiScore: z.number().min(0).max(100).default(0),
  mobileScore: z.number().min(0).max(100).default(0),
  problemSolvingScore: z.number().min(0).max(100).default(0),
  leadershipScore: z.number().min(0).max(100).default(0),
  overallSkillScore: z.number().min(0).max(100).default(0),
  confidence: z.number().min(0).max(100).default(50),
});

export type AiOpenRouterResponse = z.infer<typeof AiOpenRouterResponseSchema>;

// ============================================================
// Deterministic Scores (legacy — scoring.ts still uses this)
// Will be phased out as OpenRouter provides all scores.
// ============================================================
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
