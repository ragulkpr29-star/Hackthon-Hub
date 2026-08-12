import { ResumeAnalysisResult } from "@/lib/types/resume-analysis";
import { Logger } from "@/lib/core/logger";

const FASTAPI_BASE_URL =
  process.env.RESUME_ANALYSIS_URL ?? "http://localhost:8000";
const FETCH_TIMEOUT_MS = 30_000; // 30s to download the file
const ANALYSIS_TIMEOUT_MS = 60_000; // 60s for FastAPI ML processing

// ============================================================
// ResumeService — server-side resume parsing
// Called from the background analysis pipeline.
// Fetches the resume file from Supabase Storage URL,
// then forwards it to the FastAPI microservice.
// Failures are non-blocking — returns null on any error.
// ============================================================
export class ResumeService {
  /**
   * Fetch resume from a public Supabase Storage URL and send
   * to FastAPI for NLP/ML extraction. Returns null if FastAPI
   * is offline or any step fails (pipeline continues without resume).
   */
  static async parseFromUrl(
    resumeUrl: string
  ): Promise<ResumeAnalysisResult | null> {
    Logger.info("Fetching resume for server-side analysis", {
      url: resumeUrl.split("?")[0], // log without query params
    });

    try {
      // Step 1: Download the resume file from Supabase Storage
      const fileResponse = await fetch(resumeUrl, {
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });

      if (!fileResponse.ok) {
        Logger.warn("Could not download resume file", {
          status: fileResponse.status,
        });
        return null;
      }

      const fileBlob = await fileResponse.blob();
      const fileName =
        resumeUrl.split("/").pop()?.split("?")[0] || "resume.pdf";
      const file = new File([fileBlob], fileName, {
        type: fileBlob.type || "application/pdf",
      });

      // Step 2: POST file to FastAPI /analyze-resume
      const formData = new FormData();
      formData.append("resume", file);

      const analysisResponse = await fetch(
        `${FASTAPI_BASE_URL}/analyze-resume`,
        {
          method: "POST",
          body: formData,
          signal: AbortSignal.timeout(ANALYSIS_TIMEOUT_MS),
        }
      );

      if (!analysisResponse.ok) {
        Logger.warn("FastAPI resume analysis returned non-OK status", {
          status: analysisResponse.status,
        });
        return null;
      }

      const json = await analysisResponse.json();

      if (!json.success || !json.analysis) {
        Logger.warn("FastAPI returned success:false or no analysis", { json });
        return null;
      }

      Logger.info("Resume analysis complete from FastAPI");
      return json.analysis as ResumeAnalysisResult;
    } catch (err: any) {
      // Network errors (ECONNREFUSED = FastAPI not running) are expected and non-fatal
      const isNetworkError =
        err instanceof TypeError ||
        err?.cause?.code === "ECONNREFUSED" ||
        err?.name === "AbortError" ||
        err?.name === "TimeoutError";

      if (isNetworkError) {
        Logger.warn(
          "Resume analysis service unavailable — continuing without resume data",
          { error: err.message }
        );
      } else {
        Logger.error("Unexpected error during resume analysis", err);
      }
      return null;
    }
  }
}
