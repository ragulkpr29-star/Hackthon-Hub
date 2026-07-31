import { GithubAnalyzer } from "@/lib/github/analyzer";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { GitHubSummary } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";

export class GithubService {
  static async analyzeAndSave(userId: string, username: string): Promise<GitHubSummary> {
    Logger.info(`Starting GitHub service pipeline for ${username}`);

    // Check if we already have recent cached analysis (within 24 hours)
    const cached = await AnalysisRepository.getGithubAnalysis(userId);
    if (cached) {
      const cachedDate = new Date(cached.updated_at).getTime();
      const now = new Date().getTime();
      const hoursSinceUpdate = (now - cachedDate) / (1000 * 3600);

      if (hoursSinceUpdate < 24) {
        Logger.info(`Using cached GitHub analysis for ${username}`);
        return {
          profile: cached.profile_json as any,
          metrics: cached.metrics_json as any,
          languages: cached.languages_json as any,
          frameworks: cached.frameworks_json as any,
          topics: cached.topics_json as any,
          projects: [], // We don't cache full projects array currently to save DB space, but this can be changed
          readme: null,
        };
      }
    }

    // Run Analyzer
    const summary = await GithubAnalyzer.analyze(username);

    // Save to DB
    await AnalysisRepository.saveGithubAnalysis({
      user_id: userId,
      profile_json: summary.profile,
      metrics_json: summary.metrics,
      languages_json: summary.languages,
      frameworks_json: summary.frameworks as any,
      topics_json: summary.topics as any,
    });

    return summary;
  }
}
