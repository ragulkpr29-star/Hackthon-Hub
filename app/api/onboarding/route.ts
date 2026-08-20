import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { OnboardingService } from "@/lib/services/onboarding.service";
import { Logger } from "@/lib/core/logger";
import { Profile } from "@/lib/types";

// ============================================================
// Onboarding request schema — matches ProfileFormData from
// the onboarding page. userId is read from the auth session
// (NOT from the request body — security best practice).
// ============================================================
const OnboardingRequestSchema = z.object({
  // Profile fields
  name: z.string().optional().nullable(),
  student_id: z.string().optional().nullable(),
  department: z.string().optional().nullable(),
  year: z.union([z.string(), z.number()]).optional().nullable(),
  bio: z.string().optional().nullable(),
  github_url: z
    .string()
    .min(1, "github url is mandatory")
    .url("Must be a valid URL")
    .refine((u) => u.includes("github.com"), "Must be a GitHub URL"),
  linkedin_url: z
    .string()
    .min(1, "linkedin url is mandatory")
    .url("Must be a valid LinkedIn URL"),
  portfolio_url: z.string().url().optional().nullable().or(z.literal("")),
  availability_status: z.enum(["looking_for_team", "available", "busy", "in_team"]).optional().nullable(),
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

    // ── Merge fields with user_metadata ────────────────────────────────────
    const name = profileData.name || user.user_metadata?.name;
    const student_id = profileData.student_id || user.user_metadata?.student_id;
    const department = profileData.department || user.user_metadata?.department;
    const yearRaw = profileData.year || user.user_metadata?.year;
    
    // Convert year to number safely
    const year = yearRaw ? Number(yearRaw) : undefined;

    if (!student_id) {
        return NextResponse.json(
          { error: "Validation failed: student_id is required" },
          { status: 400 }
        );
    }

    // ── Start onboarding pipeline ─────────────────────────────────────────
    const payload: Partial<Profile> = {
      ...profileData,
      email: user.email,
      name,
      student_id,
      department,
      year,
      availability_status: profileData.availability_status || "looking_for_team",
      github_url: githubUrl ?? null,
      linkedin_url: linkedinUrl ?? null,
      resume_url: profileData.resume_url ?? null,
      portfolio_url: profileData.portfolio_url ?? null,
      avatar_url: profileData.avatar_url ?? null,
      bio: profileData.bio ?? null,
    };

    const jobId = await OnboardingService.startOnboarding(userId, payload);

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
