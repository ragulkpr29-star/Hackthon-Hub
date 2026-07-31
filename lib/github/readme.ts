import { GithubApi } from "./api";
import { Logger } from "@/lib/core/logger";

export class GithubReadmeFetcher {
  static async getReadme(username: string): Promise<string | null> {
    try {
      // Fetch the raw README file from the special profile repository
      const content = await GithubApi.get(`/repos/${username}/${username}/readme`);
      
      if (typeof content === "object" && content.content && content.encoding === "base64") {
         return Buffer.from(content.content, "base64").toString("utf-8");
      }
      
      return null;
    } catch (error: any) {
      // 404 is completely normal if they don't have a profile README
      if (error.statusCode === 404) {
        return null;
      }
      Logger.warn(`Failed to fetch GitHub README for ${username}`, error);
      return null;
    }
  }
}
