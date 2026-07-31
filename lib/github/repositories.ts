import { GithubApi } from "./api";
import { GithubRepository, GithubRepositorySchema } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";
import { z } from "zod";

export class GithubRepositoriesFetcher {
  static async getRepositories(username: string): Promise<GithubRepository[]> {
    try {
      // Fetch up to 100 repositories (max per page for GitHub API)
      // Only non-forks, sorted by updated
      const data = await GithubApi.get(`/users/${username}/repos?type=owner&sort=updated&per_page=100`);
      
      if (!Array.isArray(data)) {
        throw new Error("Expected array of repositories");
      }

      const repositories: GithubRepository[] = [];

      for (const repo of data) {
        if (repo.fork) continue; // Skip forks as per standard analytics

        const parsed = GithubRepositorySchema.safeParse(repo);
        if (parsed.success) {
          repositories.push(parsed.data);
        } else {
          Logger.warn(`Skipping invalid repo schema for ${repo.name || "unknown"}`);
        }
      }

      return repositories;
    } catch (error) {
      Logger.error(`Failed to fetch GitHub repositories for ${username}`, error);
      throw error;
    }
  }
}