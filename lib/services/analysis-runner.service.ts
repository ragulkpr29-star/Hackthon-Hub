import { JobRepository } from "@/lib/repositories/job.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { GithubService } from "./github.service";
import { AiService } from "./ai.service";
import { Logger } from "@/lib/core/logger";

export class AnalysisRunnerService {
  static async processJob(jobId: string, userId: string, githubUrl: string): Promise<void> {
    try {
      Logger.info(`Starting analysis job ${jobId} for user ${userId}`);
      
      // Extract username from URL
      let username = "";
      try {
        const urlObj = new URL(githubUrl);
        const pathParts = urlObj.pathname.split("/").filter(Boolean);
        username = pathParts[0];
        if (!username) throw new Error("Could not extract username");
      } catch (e) {
        throw new Error("Invalid GitHub URL provided");
      }

      await JobRepository.updateJobProgress(jobId, "FETCHING_GITHUB", 10, "Fetching GitHub profile...");
      
      // 1. GitHub Layer
      const githubSummary = await GithubService.analyzeAndSave(userId, username);
      
      await JobRepository.updateJobProgress(jobId, "ANALYZING_REPOSITORIES", 30, "Analyzing repositories...");
      // For UX we can stagger progress updates if the operation is fast
      await new Promise((resolve) => setTimeout(resolve, 500)); 
      
      await JobRepository.updateJobProgress(jobId, "CALCULATING_METRICS", 50, "Calculating development metrics...");
      
      // 2. AI Layer
      await JobRepository.updateJobProgress(jobId, "GENERATING_AI", 60, "Running AI analysis with Gemini...");
      await AiService.processAndSave(userId, githubSummary);
      
      await JobRepository.updateJobProgress(jobId, "CALCULATING_SCORES", 80, "Calculating deterministic scores...");
      
      await JobRepository.updateJobProgress(jobId, "SAVING_RESULTS", 90, "Saving final recommendations...");

      // 3. Complete
      await JobRepository.updateJobProgress(jobId, "COMPLETED", 100, "Analysis complete.");
      Logger.info(`Completed analysis job ${jobId}`);

    } catch (error: any) {
      Logger.error(`Failed to process analysis job ${jobId}`, error);
      
      // We could check if we want to retry based on error type
      // But for this background job loop, we'll mark it as failed and let the frontend poll and show error
      await JobRepository.updateJobProgress(
        jobId, 
        "FAILED", 
        0, 
        "Failed", 
        error.message || "An unknown error occurred during analysis"
      );
    }
  }
}
