
import { createClient } from "@/lib/supabase/server";
import { AnalysisJob, AnalysisJobStatusType } from "@/lib/types/models";
import { DatabaseError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";

export class JobRepository {
  static async createJob(userId: string): Promise<AnalysisJob> {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from("analysis_jobs")
      .insert({
        user_id: userId,
        status: "PENDING",
        progress: 0,
        current_step: "Initializing",
      })
      .select()
      .single();

    if (error) {
      Logger.error("Failed to create analysis job", error);
      throw new DatabaseError("Failed to create analysis job");
    }

    return data as AnalysisJob;
  }

  static async getJob(jobId: string): Promise<AnalysisJob | null> {

    const supabase = await createClient();

    const { data, error } = await supabase
      .from("analysis_jobs")
      .select("*")
      .eq("id", jobId)
      .single();

    console.log("========== JOB QUERY ==========");
    console.log("Job ID:", jobId);
    console.log("Data:", data);
    console.log("Error:", error);

    if (error) {

      console.log("FULL ERROR OBJECT");
      console.log(JSON.stringify(error, null, 2));

      if (error.code === "PGRST116") {
        return null;
      }

      throw error;
    }

    return data as AnalysisJob;
  }

  static async updateJobProgress(
    jobId: string,
    status: AnalysisJobStatusType,
    progress: number,
    currentStep: string,
    errorMessage?: string
  ): Promise<void> {
    const supabase = await createClient();
    const updateData: any = {
      status,
      progress,
      current_step: currentStep,
    };

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (status === "FETCHING_GITHUB") {
      updateData.started_at = new Date().toISOString();
    } else if (status === "COMPLETED" || status === "FAILED") {
      updateData.completed_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("analysis_jobs")
      .update(updateData)
      .eq("id", jobId);

    if (error) {
      Logger.error("Failed to update job progress", error);
      throw new DatabaseError("Failed to update job progress");
    }
  }

  static async incrementRetry(jobId: string): Promise<void> {
    const supabase = await createClient();

    // We need to fetch current count then increment due to lack of RPC for simple increment right now
    const job = await this.getJob(jobId);
    if (!job) return;

    const { error } = await supabase
      .from("analysis_jobs")
      .update({ retry_count: job.retry_count + 1 })
      .eq("id", jobId);

    if (error) {
      Logger.error("Failed to increment job retry count", error);
    }
  }
}

