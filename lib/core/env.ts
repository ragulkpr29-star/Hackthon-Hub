/* old code
import { z } from "zod";

const envSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("Must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "Supabase Anon Key is required"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "Supabase Service Role Key is required").optional(), // Optional for client-side, required for server-side
  GITHUB_TOKEN: z.string().min(1, "GitHub Token is required").optional(), // Optional for client-side
  GEMINI_API_KEY: z.string().min(1, "Gemini API Key is required").optional(), // Optional for client-side

});

const getEnvVars = () => {
  try {
    return envSchema.parse({
      NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
      NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      GITHUB_TOKEN: process.env.GITHUB_TOKEN,
      GEMINI_API_KEY: process.env.GEMINI_API_KEY,
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const issues = error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
      console.error(`Invalid environment variables: ${issues}`);
      throw new Error(`Invalid environment variables: ${issues}`);
    }
    throw error;
  }
};

export const env = getEnvVars();

*/
import { z } from "zod";

const envSchema = z.object({
  // ============================
  // Public Environment Variables
  // ============================
  NEXT_PUBLIC_SUPABASE_URL: z
    .string()
    .url("Invalid Supabase URL"),

  NEXT_PUBLIC_SUPABASE_ANON_KEY: z
    .string()
    .min(1, "Supabase Anon Key is required"),

  // ============================
  // Server Environment Variables
  // ============================
  SUPABASE_SERVICE_ROLE_KEY: z.string().optional(),

  GITHUB_TOKEN: z.string().optional(),

  GEMINI_API_KEY: z.string().optional(),

  GOOGLE_VISION_API_KEY: z.string().optional(),

  OPENROUTER_API_KEY: z.string().optional(),

  OPENROUTER_MODEL: z.string().default("deepseek/deepseek-chat"),

  RESUME_ANALYSIS_URL: z.string().optional(),
});

const parsed = envSchema.safeParse({
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,

  SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,

  GITHUB_TOKEN: process.env.GITHUB_TOKEN,

  GEMINI_API_KEY: process.env.GEMINI_API_KEY,

  GOOGLE_VISION_API_KEY: process.env.GOOGLE_VISION_API_KEY,

  OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,

  OPENROUTER_MODEL: process.env.OPENROUTER_MODEL,

  RESUME_ANALYSIS_URL: process.env.RESUME_ANALYSIS_URL,
});

if (!parsed.success) {
  console.error(
    "❌ Invalid environment variables:\n",
    parsed.error.flatten().fieldErrors
  );

  throw new Error("Invalid environment variables.");
}

export const env = parsed.data;