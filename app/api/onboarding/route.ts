import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { OnboardingService } from "@/lib/services/onboarding.service";
import { Logger } from "@/lib/core/logger";

// We're mocking the user auth here for the sake of the architecture, but in a real app,
// you'd get the user ID from Supabase Auth middleware.
// import { createClient } from "@/lib/supabase/server";

const OnboardingRequestSchema = z.object({
  id: z.string().uuid(), // Usually from Auth, but we accept it for now
  name: z.string().min(1),
  role: z.string().min(1),
  bio: z.string().optional(),
  github_url: z.string().url(),
  linkedin_url: z.string().url().optional().or(z.literal("")),
  resume_url: z.string().url().optional().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = OnboardingRequestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { id, ...profileData } = parsed.data;

    // Start Onboarding pipeline
    const jobId = await OnboardingService.startOnboarding(id, profileData);

    // Call our internal edge API to kick off background processing without blocking this request
    // This is a common pattern for "fire and forget" background jobs in serverless environments like Vercel.
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/jobs/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jobId, userId: id, githubUrl: profileData.github_url }),
    }).catch((e) => {
      Logger.error(`Failed to trigger background processing for job ${jobId}`, e);
    });

    // Return success immediately with Job ID
    return NextResponse.json({ success: true, jobId }, { status: 202 });
  } catch (error: any) {
    Logger.error("Failed to process onboarding request", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
