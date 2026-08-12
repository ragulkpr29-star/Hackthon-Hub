import { JobRepository } from "@/lib/repositories/job.repository";
import { UserRepository } from "@/lib/repositories/user.repository";
import { GithubService } from "./github.service";
import { AiService } from "./ai.service";
import { ResumeService } from "./resume.service";
import { Logger } from "@/lib/core/logger";
import { LinkedInService } from "./linkedin.service";
// ============================================================
// AnalysisRunnerService — background job orchestrator
//
// Pipeline flow:
//   FETCHING_GITHUB (10%)     — Fetch + cache GitHub profile
//   ANALYZING_REPOSITORIES (35%) — Process repos / metrics
//   CALCULATING_METRICS (50%) — Parse resume via FastAPI
//   GENERATING_AI (65%)       — OpenRouter AI analysis
//   CALCULATING_SCORES (85%)  — Skill scores + developer vector
//   SAVING_RESULTS (90%)      — Final DB writes
//   COMPLETED (100%)          — Job done, redirect allowed
// ============================================================
export class AnalysisRunnerService {
  static async processJob(
    jobId: string,
    userId: string,
    githubUrl?: string | null,
    linkedinUrl?: string | null
  ): Promise<void> {
    try {
      Logger.info(`Starting analysis job ${jobId} for user ${userId}`);

      // ── Step 1: GitHub ────────────────────────────────────────────────────
      await JobRepository.updateJobProgress(
        jobId,
        "FETCHING_GITHUB",
        10,
        "Fetching GitHub profile..."
      );


      let githubSummary = null;

      if (githubUrl && githubUrl.trim() !== "") {
        const username = this.extractUsername(githubUrl);
        githubSummary = await GithubService.analyzeAndSave(userId, username);

        await JobRepository.updateJobProgress(
          jobId,
          "ANALYZING_REPOSITORIES",
          35,
          "Analyzing repositories..."
        );
      } else {
        Logger.warn(`No GitHub URL for user ${userId} — skipping GitHub analysis`);
        await JobRepository.updateJobProgress(
          jobId,
          "ANALYZING_REPOSITORIES",
          35,
          "No GitHub URL provided — skipping GitHub step"
        );
      }



      // ── LinkedIn ─────────────────────────────────────────────

      // ── LinkedIn ─────────────────────────────────────────────
      let linkedinSummary = null;

      try {
        const profile = await UserRepository.getProfile(userId);

        if (profile?.linkedin_url) {
          Logger.info(`LinkedIn URL found for user ${userId}`);

          linkedinSummary = await LinkedInService.analyze(
            userId,
            profile.linkedin_url
          );

          Logger.info("LinkedIn analysis completed.");
        } else {
          Logger.info("No LinkedIn URL found.");
        }
      } catch (err) {
        Logger.warn("LinkedIn analysis failed", err as Error);
      }

      // ── Step 2: Resume ────────────────────────────────────────────────────
      await JobRepository.updateJobProgress(
        jobId,
        "CALCULATING_METRICS",
        50,
        "Parsing resume..."
      );

      let resumeResult = null;
      try {
        const profile = await UserRepository.getProfile(userId);
        if (profile?.resume_url) {
          Logger.info(`Resume URL found for user ${userId} — parsing...`);
          resumeResult = await ResumeService.parseFromUrl(profile.resume_url);
          if (resumeResult) {
            Logger.info(`Resume parsed successfully for user ${userId}`);
          } else {
            Logger.warn(`Resume parsing returned null for user ${userId}`);
          }
        } else {
          Logger.info(`No resume URL for user ${userId} — skipping resume step`);
        }
      } catch (resumeErr) {
        // Resume parsing is non-blocking — pipeline continues without it
        Logger.warn(`Resume step failed for user ${userId} — continuing`, resumeErr as Error);
      }

      // ── Step 3: AI Analysis ───────────────────────────────────────────────
      await JobRepository.updateJobProgress(
        jobId,
        "GENERATING_AI",
        65,
        "Running AI analysis with DeepSeek..."
      );

      // Skip AI if no GitHub data and no resume
      if (!githubSummary && !resumeResult) {
        Logger.warn(
          `No data available for AI analysis for user ${userId} — completing job without AI`
        );
        await JobRepository.updateJobProgress(
          jobId,
          "COMPLETED",
          100,
          "Profile saved. Add a GitHub URL or resume to enable AI analysis."
        );
        return;
      }

      // Use a minimal summary if GitHub was skipped
      if (!githubSummary) {
        githubSummary = this.buildEmptySummary();
      }

      await AiService.processAndSave(
        userId,
        githubSummary,
        linkedinSummary,
        resumeResult
      );

      // ── Step 4: Finalise ──────────────────────────────────────────────────
      await JobRepository.updateJobProgress(
        jobId,
        "CALCULATING_SCORES",
        85,
        "Generating your developer profile..."
      );

      await JobRepository.updateJobProgress(
        jobId,
        "SAVING_RESULTS",
        90,
        "Saving your profile..."
      );

      await JobRepository.updateJobProgress(
        jobId,
        "COMPLETED",
        100,
        "Analysis complete!"
      );

      Logger.info(`Completed analysis job ${jobId} for user ${userId}`);
    } catch (error: any) {
      Logger.error(`Failed to process analysis job ${jobId}`, error);
      await JobRepository.updateJobProgress(
        jobId,
        "FAILED",
        0,
        "Analysis failed",
        error.message || "An unexpected error occurred during analysis"
      );
    }
  }

  private static extractUsername(githubUrl: string): string {
    try {
      const urlObj = new URL(githubUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      const username = pathParts[0];
      if (!username) throw new Error("No username in path");
      return username;
    } catch {
      throw new Error(`Invalid GitHub URL: ${githubUrl}`);
    }
  }

  /** Minimal GitHub summary for AI analysis when GitHub step was skipped */
  private static buildEmptySummary() {
    return {
      profile: { login: "", name: "", bio: null, company: null, followers: 0, public_repos: 0 } as any,
      metrics: {
        total_repositories: 0,
        total_stars: 0,
        total_forks: 0,
        average_stars: 0,
        average_forks: 0,
        most_used_language: null,
        languages: {},
        frameworks: [],
        topics: {},
        recent_activity_score: 0,
      },
      languages: {},
      frameworks: {},
      topics: {},
      projects: [],
      readme: null,
    };
  }
}
