import { GithubApi } from "./api";
import { GithubProfile, GithubProfileSchema } from "@/lib/types/github";
import { Logger } from "@/lib/core/logger";
import { ValidationError } from "@/lib/core/errors";

export class GithubProfileFetcher {
  static async getProfile(username: string): Promise<GithubProfile> {
    try {
      const data = await GithubApi.get(`/users/${username}`);
      
      const parsed = GithubProfileSchema.safeParse(data);
      if (!parsed.success) {
        Logger.error(`Invalid GitHub profile data for ${username}`, parsed.error);
        throw new ValidationError("Invalid GitHub profile data", { issues: parsed.error.issues });
      }

      return parsed.data;
    } catch (error) {
      Logger.error(`Failed to fetch GitHub profile for ${username}`, error);
      throw error;
    }
  }
}