import { NextRequest, NextResponse } from "next/server";
import { GithubAnalyzer } from "@/lib/github/analyzer";
import { OpenRouterClient } from "@/lib/ai/openrouter";
import { AiPromptBuilder } from "@/lib/ai/prompt";
import { Logger } from "@/lib/core/logger";

// ============================================================
// POST /api/github/analyze
// PERMANENT DEBUG / TESTING ENDPOINT — DO NOT REMOVE
// Used by: /test-ai page for standalone GitHub AI testing
//
// Returns full AI analysis JSON without saving to DB.
// Useful for debugging the AI pipeline independently.
// ============================================================

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { githubUrl } = body;

    if (!githubUrl) {
      return NextResponse.json(
        { success: false, error: "githubUrl is required" },
        { status: 400 }
      );
    }

    // Extract username from URL
    let username: string;
    try {
      const urlObj = new URL(githubUrl);
      const pathParts = urlObj.pathname.split("/").filter(Boolean);
      username = pathParts[0];
      if (!username) throw new Error("No username found in URL");
    } catch {
      return NextResponse.json(
        { success: false, error: "Invalid GitHub URL" },
        { status: 400 }
      );
    }

    Logger.info(`[DEBUG] GitHub analyze for: ${username}`);

    // Fetch GitHub data
    const summary = await GithubAnalyzer.analyze(username);

    // Build prompt and call OpenRouter
    const prompt = AiPromptBuilder.buildPrompt(summary, null);
    const aiResponse = await OpenRouterClient.analyzeProfile(prompt);

    Logger.info(`[DEBUG] AI analysis complete for ${username}`, {
      overallScore: aiResponse.overallSkillScore,
    });

    // Return everything for debugging — no DB saves
    return NextResponse.json({
      success: true,
      username,
      githubSummary: {
        profile: summary.profile,
        metrics: summary.metrics,
        topLanguages: Object.keys(summary.languages).slice(0, 10),
        frameworks: summary.metrics.frameworks,
        projectCount: summary.projects.length,
      },
      aiAnalysis: aiResponse,
    });
  } catch (err: any) {
    Logger.error("[DEBUG] /api/github/analyze failed", err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 }
    );
  }
}