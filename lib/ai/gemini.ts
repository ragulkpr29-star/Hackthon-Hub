/*
import { GoogleGenAI } from "@google/genai";
import { env } from "@/lib/core/env";
import { AiGeminiResponse, AiGeminiResponseSchema } from "@/lib/types/ai";
import { GeminiApiError, ValidationError } from "@/lib/core/errors";
import { Logger } from "@/lib/core/logger";
import { withRetry } from "@/lib/core/retry";

export class GeminiClient {
  private static getClient(): GoogleGenAI {
    if (!env.GEMINI_API_KEY) {
      throw new GeminiApiError("Gemini API key is missing");
    }
    return new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }

  static async analyzeProfile(prompt: string): Promise<AiGeminiResponse> {
    const ai = this.getClient();

    const systemInstruction = `
You are an expert tech recruiter AI.
You must return the analysis strictly as a JSON object matching this schema:
{
  "strengths": ["string"],
  "weaknesses": ["string"],
  "recommended_role": "string",
  "recommended_team": ["string"],
  "recommended_hackathons": ["string"],
  "learning_roadmap": ["string"],
  "explanation": "string"
}
Do not include markdown code blocks, just raw JSON.
`;

    return withRetry(async () => {
      try {
        Logger.debug("Calling Gemini API");
        const response = await ai.models.generateContent({
          model: "gemini-2.5-flash",
          contents: prompt,
          config: {
            systemInstruction,
            responseMimeType: "application/json",
            temperature: 0.2, // Low temperature for more deterministic/professional output
          },
        });

        const text = response.text;
        if (!text) {
          throw new GeminiApiError("Empty response from Gemini");
        }

        const rawJson = JSON.parse(text);
        const parsed = AiGeminiResponseSchema.safeParse(rawJson);

        if (!parsed.success) {
          Logger.error("Failed to parse Gemini output", parsed.error);
          throw new ValidationError("Invalid AI response schema");
        }

        return parsed.data;
      } catch (error: any) {
        if (error instanceof ValidationError) throw error;

        Logger.error("Gemini API call failed", error);

        // Pass status code if available for retry logic
        const statusCode = error.status || error.code || 500;
        throw new GeminiApiError("Failed to communicate with Gemini API", statusCode, { error: error.message });
      }
    }, "Gemini Analysis");
  }
}

*/

import { GoogleGenAI } from "@google/genai";

export const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY!,
});