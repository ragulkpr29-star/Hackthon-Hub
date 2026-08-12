import { env } from "@/lib/core/env";
import { OpenRouterApiError } from "@/lib/core/errors";
import { withRetry } from "@/lib/core/retry";
import { Logger } from "@/lib/core/logger";
import { AiOpenRouterResponse, AiOpenRouterResponseSchema } from "@/lib/types/ai";

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "deepseek/deepseek-chat";
const TIMEOUT_MS = 90_000; // 90 seconds

// ============================================================
// OpenRouterClient — Enterprise wrapper
// Features: retry, timeout, JSON validation, typed responses,
//           env-driven model switching, structured logging.
// ============================================================
export class OpenRouterClient {
    private static getApiKey(): string {
        const key = env.OPENROUTER_API_KEY;
        if (!key) {
            throw new OpenRouterApiError("OPENROUTER_API_KEY is not configured", 500);
        }
        return key;
    }

    private static getModel(): string {
        return env.OPENROUTER_MODEL ?? DEFAULT_MODEL;
    }

    /**
     * Analyzes a developer profile and returns structured AI insights.
     * Validates the response against AiOpenRouterResponseSchema before returning.
     */
    static async analyzeProfile(prompt: string): Promise<AiOpenRouterResponse> {
        const model = this.getModel();
        Logger.info(`Starting OpenRouter analysis`, { model });

        return withRetry(
            async () => {
                const apiKey = this.getApiKey();
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), TIMEOUT_MS);

                let response: Response;
                try {
                    response = await fetch(OPENROUTER_API_URL, {
                        method: "POST",
                        headers: {
                            Authorization: `Bearer ${apiKey}`,
                            "Content-Type": "application/json",
                            "HTTP-Referer": "https://hackathonhub.app",
                            "X-Title": "HackathonHub AI Pipeline",
                        },
                        body: JSON.stringify({
                            model,
                            messages: [
                                {
                                    role: "system",
                                    content:
                                        "You are a technical recruiter AI. You MUST respond with a single raw JSON object only. " +
                                        "No markdown. No explanation. No code blocks. No bullet points. Pure JSON only.",
                                },
                                {
                                    role: "user",
                                    content: prompt,
                                },
                            ],
                            response_format: { type: "json_object" },
                            temperature: 0.2,
                            max_tokens: 2048,
                        }),
                        signal: controller.signal,
                    });
                } finally {
                    clearTimeout(timeoutId);
                }

                if (!response.ok) {
                    const errorText = await response.text().catch(() => "Unknown error");
                    throw new OpenRouterApiError(
                        `OpenRouter API responded with ${response.status}: ${response.statusText}`,
                        response.status,
                        { response: errorText, model }
                    );
                }

                const rawResult = await response.json();

                console.log("========================================");
                console.log("RAW OPENROUTER RESPONSE");
                console.log("========================================");
                console.dir(rawResult, { depth: null });

                const content = rawResult?.choices?.[0]?.message?.content;

                console.log("========================================");
                console.log("CONTENT FROM MODEL");
                console.log("========================================");
                console.log(content);

                if (!content) {
                    throw new OpenRouterApiError("OpenRouter returned an empty response", 500, { rawResult });
                }

                // Parse the JSON content string
                let parsedJson: unknown;
                try {
                    parsedJson =
                        typeof content === "string" ? JSON.parse(content) : content;
                    console.log("========================================");
                    console.log("PARSED JSON");
                    console.log("========================================");
                    console.dir(parsedJson, { depth: null });
                } catch {
                    Logger.error("Failed to parse OpenRouter JSON content", { content: String(content).slice(0, 500) });
                    throw new OpenRouterApiError("OpenRouter returned malformed JSON", 500);
                }

                // Validate against schema — be lenient with defaults
                const validated = AiOpenRouterResponseSchema.safeParse(parsedJson);
                if (!validated.success) {
                    console.log("========================================");
                    console.log("ZOD VALIDATION ERRORS");
                    console.log("========================================");
                    console.dir(validated.error.issues, { depth: null });
                    Logger.warn("OpenRouter response validation had issues — applying defaults", {
                        errors: validated.error.issues.slice(0, 5),

                    });

                    // Apply defaults for any missing/invalid fields
                    const withDefaults = {
                        professionalSummary: "",
                        experienceLevel: "Intermediate",
                        technicalSkills: [],
                        programmingLanguages: [],
                        frameworks: [],
                        tools: [],
                        strengths: [],
                        weaknesses: [],
                        recommendedHackathonRole: "Full-Stack Developer",
                        projectComplexity: "Medium",
                        frontendScore: 0,
                        backendScore: 0,
                        databaseScore: 0,
                        cloudScore: 0,
                        aiScore: 0,
                        mobileScore: 0,
                        problemSolvingScore: 0,
                        leadershipScore: 0,
                        overallSkillScore: 0,
                        confidence: 50,
                        ...(parsedJson as Record<string, unknown>),
                    };

                    const retried = AiOpenRouterResponseSchema.safeParse(withDefaults);
                    if (!retried.success) {
                        throw new OpenRouterApiError("OpenRouter response failed schema validation after defaults", 500);
                    }
                    return retried.data;
                }

                Logger.info("OpenRouter analysis complete", {
                    model,
                    overallScore: validated.data.overallSkillScore,
                    confidence: validated.data.confidence,
                });

                return validated.data;
            },
            "OpenRouter Analysis",
            { maxRetries: 2, initialDelay: 3000 }
        );
    }
}

// ============================================================
// Legacy function — kept for backward compatibility
// Used by: /api/test-gemini, /test-ai page
// DO NOT REMOVE
// ============================================================
export async function askOpenRouter(prompt: string) {
    const apiKey = process.env.OPENROUTER_API_KEY;
    const model = process.env.OPENROUTER_MODEL ?? DEFAULT_MODEL;

    const response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify({
            model,
            messages: [{ role: "user", content: prompt }],
        }),
    });

    if (!response.ok) {
        throw new Error(await response.text());
    }

    return response.json();
}