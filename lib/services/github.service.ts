import { createHash } from "crypto";
import { GithubAnalyzer } from "@/lib/github/analyzer";
import { AnalysisRepository } from "@/lib/repositories/analysis.repository";
import { GitHubSummary } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";

export class GithubService {
  /**
   * Analyzes a GitHub user and saves results.
   *
   * Cache strategy (in order):
   * 1. If cached data exists AND repo hash hasn't changed → skip API call entirely
   * 2. If cached data < 24 hours old → return cached (legacy time-based cache)
   * 3. Otherwise → fetch fresh data, compute hash, save to DB
   */
  static async analyzeAndSave(
    userId: string,
    username: string
  ): Promise<GitHubSummary> {
    Logger.info(`Starting GitHub service for user: ${username}`);

    const cached = await AnalysisRepository.getGithubAnalysis(userId);

    // Legacy time-based cache: skip API call if data is fresh (< 24 hours)
    if (cached) {
      const cachedDate = new Date(cached.updated_at).getTime();
      const hoursSinceUpdate = (Date.now() - cachedDate) / (1000 * 3600);

      if (hoursSinceUpdate < 24) {
        Logger.info(`Using cached GitHub analysis for ${username} (${hoursSinceUpdate.toFixed(1)}h old)`);

        // Restore summary from cached JSON — projects come from raw_json if available
        const projects = cached.raw_json?.projects ?? [];
        return {
          profile: cached.profile_json as any,
          metrics: cached.metrics_json as any,
          languages: cached.languages_json as any,
          frameworks: cached.frameworks_json as any,
          topics: cached.topics_json as any,
          projects: projects as any,
          readme: (cached.raw_json?.readme as string) ?? null,
        };
      }
    }

    // Fresh analysis
    Logger.info(`Fetching fresh GitHub data for ${username}`);
    const summary = await GithubAnalyzer.analyze(username);

    // Compute repo content hash for AI cache invalidation
    const repoHash = this.computeRepoHash(summary.projects, summary.languages);

    // If hash matches cached → GitHub data unchanged, no need to update DB
    if (cached?.repo_hash && cached.repo_hash === repoHash) {
      Logger.info(
        `GitHub repo hash unchanged for ${username} — reusing stored analysis`
      );
      return summary;
    }

    // Save to DB with raw_json + hash
    const rawJson = {
      projects: summary.projects,
      readme: summary.readme,
      fetchedAt: new Date().toISOString(),
    };

    await AnalysisRepository.saveGithubAnalysis({
      user_id: userId,
      profile_json: summary.profile as any,
      metrics_json: summary.metrics as any,
      languages_json: summary.languages as any,
      frameworks_json: summary.frameworks as any,
      topics_json: summary.topics as any,
      raw_json: rawJson as any,
      repo_hash: repoHash,
    });

    Logger.info(`GitHub analysis saved for ${username}`, {
      repos: summary.projects.length,
      hash: repoHash.slice(0, 8),
    });

    return summary;
  }

  /**
   * Computes a deterministic SHA-256 hash of the repository list.
   * Used to detect whether GitHub data has changed since last analysis,
   * allowing the AI step to be skipped if nothing changed.
   */
  private static computeRepoHash(
    projects: GitHubSummary["projects"],
    languages: Record<string, number>
  ): string {
    const data = projects
      .map((r) => `${r.name}:${r.updated_at}:${r.stargazers_count}`)
      .sort()
      .join("|");
    const langStr = Object.entries(languages)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(",");
    return createHash("sha256").update(`${data}||${langStr}`).digest("hex");
  }
}
