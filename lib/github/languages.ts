import { GithubApi } from "./api";
import { GithubRepository } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";

export class GithubLanguagesFetcher {
  static async getAggregateLanguages(username: string, repositories: GithubRepository[]): Promise<Record<string, number>> {
    const aggregateLanguages: Record<string, number> = {};

    // We only fetch languages for the top 10 most recently updated repos to avoid rate limiting
    // In a real-world scenario we might do this in batches.
    const topRepos = repositories.slice(0, 10);

    const promises = topRepos.map(async (repo) => {
      try {
        const langData = await GithubApi.get(`/repos/${username}/${repo.name}/languages`);
        return langData;
      } catch (error) {
        Logger.warn(`Failed to fetch languages for repo ${repo.name}`, error as any);
        return {};
      }
    });

    const results = await Promise.all(promises);

    for (const repoLangs of results) {
      if (typeof repoLangs === "object" && repoLangs !== null) {
        for (const [lang, bytes] of Object.entries(repoLangs)) {
          if (typeof bytes === "number") {
            aggregateLanguages[lang] = (aggregateLanguages[lang] || 0) + bytes;
          }
        }
      }
    }

    return aggregateLanguages;
  }
}
