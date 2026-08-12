import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OnboardingService } from "@/lib/services/onboarding.service";
import { Logger } from "@/lib/core/logger";

// ============================================================
// Onboarding request schema — matches ProfileFormData from
// the onboarding page. userId is read from the auth session
// (NOT from the request body — security best practice).
// ============================================================
const OnboardingRequestSchema = z.object({
  // Profile fields
  bio: z.string().optional().nullable(),
  github_url: z
    .string()
    .url("Must be a valid URL")
    .refine((u) => u.includes("github.com"), "Must be a GitHub URL")
    .optional()
    .nullable()
    .or(z.literal("")),
  linkedin_url: z.string().url().optional().nullable().or(z.literal("")),
  portfolio_url: z.string().url().optional().nullable().or(z.literal("")),
  availability_status: z.string().optional().nullable(),
  technical_interests: z.array(z.string()).optional().default([]),
  programming_languages: z.array(z.string()).optional().default([]),
  frameworks: z.array(z.string()).optional().default([]),
  tools: z.array(z.string()).optional().default([]),
  // Uploaded file URLs (browser-side upload, passed to backend)
  avatar_url: z.string().url().optional().nullable().or(z.literal("")),
  resume_url: z.string().url().optional().nullable().or(z.literal("")),
});

export async function POST(req: NextRequest) {
  try {
    // ── Auth: read userId from session cookie ─────────────────────────────
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json(
        { error: "Unauthorized — please log in" },
        { status: 401 }
      );
    }

    const userId = user.id;

    // ── Validate body ─────────────────────────────────────────────────────
    const body = await req.json();
    const parsed = OnboardingRequestSchema.safeParse(body);

    if (!parsed.success) {
      Logger.warn("Onboarding request validation failed", {
        issues: parsed.error.issues,
      });
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const profileData = parsed.data;
    const githubUrl = profileData.github_url || null;
    const linkedinUrl = profileData.linkedin_url || null;

    // ── Start onboarding pipeline ─────────────────────────────────────────
    const jobId = await OnboardingService.startOnboarding(userId, {
      bio: profileData.bio ?? undefined,
      github_url: githubUrl ?? undefined,
      linkedin_url: profileData.linkedin_url ?? undefined,
      resume_url: profileData.resume_url ?? undefined,
      // Note: avatar_url, portfolio_url, interests etc. go in the upsert
      // via the profileData spread — ensure the Profile type supports them
    });

    // ── Fire-and-forget background processing ────────────────────────────
    const baseUrl = req.nextUrl.origin;
    fetch(`${baseUrl}/api/jobs/process`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        jobId,
        userId,
        githubUrl,
        linkedinUrl,
      }),
    }).catch((e) => {
      Logger.error(`Failed to trigger background job ${jobId}`, e);
    });

    Logger.info(`Onboarding started for user ${userId}, job ${jobId}`);

    // ── Return immediately with jobId for frontend polling ────────────────
    return NextResponse.json({ success: true, jobId }, { status: 202 });
  } catch (error: any) {
    Logger.error("Onboarding route error", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}
