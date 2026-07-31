import { z } from "zod";

export const GithubProfileSchema = z.object({
  login: z.string(),
  name: z.string().nullable().optional(),
  bio: z.string().nullable().optional(),
  followers: z.number().default(0),
  following: z.number().default(0),
  avatar_url: z.string().url(),
  public_repos: z.number().default(0),
  html_url: z.string().url(),
  company: z.string().nullable().optional(),
  blog: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
});

export type GithubProfile = z.infer<typeof GithubProfileSchema>;

export const GithubRepositorySchema = z.object({
  name: z.string(),
  description: z.string().nullable().optional(),
  language: z.string().nullable().optional(),
  stargazers_count: z.number().default(0),
  forks_count: z.number().default(0),
  topics: z.array(z.string()).default([]),
  updated_at: z.string(),
  homepage: z.string().nullable().optional(),
  html_url: z.string().url(),
  size: z.number().default(0),
});

export type GithubRepository = z.infer<typeof GithubRepositorySchema>;

export const GithubLanguageSchema = z.record(z.string(), z.number());
export type GithubLanguage = z.infer<typeof GithubLanguageSchema>;

export const GithubMetricsSchema = z.object({
  total_repositories: z.number(),
  total_stars: z.number(),
  total_forks: z.number(),
  average_stars: z.number(),
  average_forks: z.number(),
  most_used_language: z.string().nullable(),
  languages: z.record(z.string(), z.number()),
  frameworks: z.array(z.string()),
  topics: z.record(z.string(), z.number()),
  recent_activity_score: z.number(),
});

export type GithubMetrics = z.infer<typeof GithubMetricsSchema>;

export interface GitHubSummary {
  profile: GithubProfile;
  metrics: GithubMetrics;
  languages: Record<string, number>;
  frameworks: string[];
  topics: Record<string, number>;
  projects: GithubRepository[];
  readme: string | null;
}
