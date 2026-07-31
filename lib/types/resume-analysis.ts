/**
 * TypeScript mirror of the Pydantic schemas defined in the FastAPI
 * resume-analysis microservice (app/schemas.py).
 *
 * Keep these in sync with the Python models whenever the service contract changes.
 */

export interface ResumeAnalysisResult {
  programming_languages: string[];
  frameworks: string[];
  libraries: string[];
  databases: string[];
  cloud: string[];
  devops: string[];
  ai_ml: string[];
  tools: string[];
  soft_skills: string[];
  education: string[];
  certifications: string[];
  projects: string[];
  experience: Array<{ job_title?: string | null; company?: string | null }>;
  companies: string[];
  job_titles: string[];
}

/** Successful response from POST /api/v1/analyze-resume */
export interface ResumeAnalysisResponse {
  success: true;
  raw_text: string;
  analysis: ResumeAnalysisResult;
}

/** Error response from POST /api/v1/analyze-resume */
export interface ResumeAnalysisErrorResponse {
  success: false;
  message: string;
}

export type ResumeAnalysisApiResponse =
  | ResumeAnalysisResponse
  | ResumeAnalysisErrorResponse;
