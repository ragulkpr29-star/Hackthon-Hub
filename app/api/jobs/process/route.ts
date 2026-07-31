import { NextRequest, NextResponse } from "next/server";
import { AnalysisRunnerService } from "@/lib/services/analysis-runner.service";
import { Logger } from "@/lib/core/logger";

// We set this route to run on the Edge or as a maxDuration function if using Vercel,
// to allow the background task time to complete.
export const maxDuration = 300; // 5 minutes

export async function POST(req: NextRequest) {
  try {
    const { jobId, userId, githubUrl } = await req.json();

    if (!jobId || !userId || !githubUrl) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // We do NOT await this in Vercel Edge functions usually if we want fire-and-forget, 
    // but Next.js App Router API routes might require awaiting or using `waitUntil`.
    // For local dev and standard deployments, we can await it or run it asynchronously.
    // To prevent the lambda from dying before it finishes on Vercel, we must await it.
    
    await AnalysisRunnerService.processJob(jobId, userId, githubUrl);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    Logger.error("Failed in background job process route", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
