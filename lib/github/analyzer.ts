import { GithubProfileFetcher } from "./profile";
import { GithubRepositoriesFetcher } from "./repositories";
import { GithubLanguagesFetcher } from "./languages";
import { GithubReadmeFetcher } from "./readme";
import { GithubMetricsCalculator } from "./metrics";
import { GitHubSummary } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";

export class GithubAnalyzer {
  static async analyze(username: string): Promise<GitHubSummary> {
    try {
      Logger.info(`Starting GitHub analysis for ${username}`);

      // Fetch profile
      const profile = await GithubProfileFetcher.getProfile(username);
      
      // Fetch repositories
      const projects = await GithubRepositoriesFetcher.getRepositories(username);
      
      // Fetch languages and README concurrently
      const [languages, readme] = await Promise.all([
        GithubLanguagesFetcher.getAggregateLanguages(username, projects),
        GithubReadmeFetcher.getReadme(username),
      ]);

      // Calculate deterministic metrics
      const metrics = GithubMetricsCalculator.calculate(projects, languages);

      Logger.info(`Completed GitHub analysis for ${username}`);

      return {
        profile,
        metrics,
        languages: metrics.languages as any,
        frameworks: metrics.frameworks as any,
        topics: metrics.topics as any,
        projects,
        readme,
      };
    } catch (error) {
      Logger.error(`Error during overall GitHub analysis for ${username}`, error);
      throw error;
    }
  }
}