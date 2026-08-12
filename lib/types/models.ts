import { z } from "zod";

export const ProfileSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1, "Name is required"),
  role: z.string().min(1, "Role is required"),
  bio: z.string().nullable().optional(),
  github_url: z.string().url("Must be a valid GitHub URL").nullable().optional(),
  linkedin_url: z.string().url("Must be a valid LinkedIn URL").nullable().optional(),
  resume_url: z.string().url("Must be a valid URL").nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type Profile = z.infer<typeof ProfileSchema>;

export const AnalysisJobStatus = z.enum([
  "PENDING",
  "FETCHING_GITHUB",
  "ANALYZING_REPOSITORIES",
  "CALCULATING_METRICS",
  "GENERATING_AI",
  "CALCULATING_SCORES",
  "SAVING_RESULTS",
  "COMPLETED",
  "FAILED",
]);

export type AnalysisJobStatusType = z.infer<typeof AnalysisJobStatus>;

export const AnalysisJobSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  status: AnalysisJobStatus,
  progress: z.number().min(0).max(100),
  current_step: z.string(),
  retry_count: z.number(),
  error_message: z.string().nullable().optional(),
  started_at: z.string().nullable().optional(),
  completed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AnalysisJob = z.infer<typeof AnalysisJobSchema>;

export const GithubAnalysisSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  profile_json: z.record(z.string(), z.any()),
  metrics_json: z.record(z.string(), z.any()),
  languages_json: z.record(z.string(), z.any()),
  frameworks_json: z.record(z.string(), z.any()),
  topics_json: z.record(z.string(), z.any()),
  raw_json: z.record(z.string(), z.any()).nullable().optional(),
  repo_hash: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type GithubAnalysis = z.infer<typeof GithubAnalysisSchema>;

export const AiAnalysisSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  professional_summary: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
  overall_score: z.number(),
  frontend_score: z.number(),
  backend_score: z.number(),
  ai_score: z.number(),
  cloud_score: z.number(),
  game_dev_score: z.number(),
  cyber_score: z.number(),
  documentation_score: z.number(),
  problem_solving_score: z.number(),
  project_quality_score: z.number(),
  strengths: z.array(z.string()),
  weaknesses: z.array(z.string()),
  recommended_role: z.string().nullable().optional(),
  recommended_team: z.array(z.string()).nullable().optional(),
  recommended_hackathons: z.array(z.string()).nullable().optional(),
  learning_roadmap: z.array(z.string()).nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type AiAnalysis = z.infer<typeof AiAnalysisSchema>;

// ============================================================
// Developer Vector — full AI-generated skill vector
// Used for team formation queries without re-calling AI
// ============================================================
export const DeveloperVectorSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  frontend_score: z.number().min(0).max(100),
  backend_score: z.number().min(0).max(100),
  database_score: z.number().min(0).max(100),
  cloud_score: z.number().min(0).max(100),
  ai_score: z.number().min(0).max(100),
  mobile_score: z.number().min(0).max(100),
  problem_solving_score: z.number().min(0).max(100),
  leadership_score: z.number().min(0).max(100),
  overall_score: z.number().min(0).max(100),
  recommended_role: z.string().nullable().optional(),
  experience_level: z.string().nullable().optional(),
  professional_summary: z.string().nullable().optional(),
  project_complexity: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100).nullable().optional(),
  prompt_version: z.string().default("v1"),
  analyzed_at: z.string().nullable().optional(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type DeveloperVector = z.infer<typeof DeveloperVectorSchema>;
