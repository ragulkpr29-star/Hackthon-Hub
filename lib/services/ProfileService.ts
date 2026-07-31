import { ProfileRepository, type SkillScoreRow } from '../repositories/ProfileRepository';
import { StorageService } from '../storage/StorageService';
import type { ProfileFormData } from '../schemas/profile.schema';
import type { SkillCategory } from '../types';
import type {
  ResumeAnalysisApiResponse,
  ResumeAnalysisResult,
} from '../types/resume-analysis';

export class ProfileService {
  private repository = new ProfileRepository();
  private storage = new StorageService();

  async getProfile(userId: string) {
    return this.repository.getProfile(userId);
  }

  async completeOnboarding(
    userId: string,
    data: ProfileFormData,
    avatarFile?: File,
    resumeFile?: File
  ) {
    // ── 1. Upload avatar (optional) ─────────────────────────────────────────
    let avatar_url: string | undefined;
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const filename = `${userId}-${Date.now()}.${ext}`;
      const url = await this.storage.uploadFile('avatars', filename, avatarFile);
      if (url) avatar_url = url;
    }

    // ── 2. Upload resume to Supabase Storage ────────────────────────────────
    let resume_url: string | undefined;
    if (resumeFile) {
      const ext = resumeFile.name.split('.').pop();
      const filename = `${userId}-${Date.now()}.${ext}`;
      const url = await this.storage.uploadFile('resumes', filename, resumeFile);
      if (url) resume_url = url;
    }

    // ── 3. Send resume to FastAPI for analysis ──────────────────────────────
    let analysisResult: ResumeAnalysisResult | null = null;

    if (resumeFile) {
      try {
        analysisResult = await this._analyzeResume(resumeFile);
      } catch (err) {
        // Non-fatal: log and continue so onboarding always completes
        console.warn('[ProfileService] Resume analysis failed (non-fatal):', err);
      }
    }

    // ── 4. Merge form data + analysis results + file URLs ───────────────────
    const updateData: Record<string, unknown> = {
      ...data,
      profile_completed: true,
      updated_at: new Date().toISOString(),
    };

    if (avatar_url) updateData.avatar_url = avatar_url;
    if (resume_url) updateData.resume_url = resume_url;

    const getNames = (items: any[]) => items.map(i => typeof i === 'string' ? i : i.name).filter(Boolean);

    if (analysisResult) {
      // Merge extracted skills into the arrays the user already filled in,
      // deduplicating values (case-insensitive).
      updateData.programming_languages = this._merge(
        data.programming_languages ?? [],
        getNames(analysisResult.programming_languages)
      );
      updateData.frameworks = this._merge(
        data.frameworks ?? [],
        getNames(analysisResult.frameworks)
      );
      updateData.tools = this._merge(
        data.tools ?? [],
        getNames([
          ...analysisResult.tools,
          ...analysisResult.libraries,
          ...analysisResult.databases,
          ...analysisResult.devops,
          ...analysisResult.cloud,
        ])
      );
      updateData.technical_interests = this._merge(
        data.technical_interests ?? [],
        getNames(analysisResult.ai_ml)
      );
    }

    // ── 5. Persist profile update ────────────────────────────────────────────
    const success = await this.repository.updateProfile(userId, updateData as any);

    // ── 6. Upsert AI skill scores (best-effort) ──────────────────────────────
    if (success && analysisResult) {
      try {
        await this._upsertSkillScores(userId, analysisResult);
      } catch (err) {
        console.warn('[ProfileService] Skill-score upsert failed (non-fatal):', err);
      }
    }

    // ── 7. Refresh profile and return ────────────────────────────────────────
    if (success) {
      await this.repository.getProfile(userId);
    }

    return success;
  }

  // ── Private helpers ─────────────────────────────────────────────────────────

  /**
   * POST the resume PDF to the Next.js proxy route which forwards it to the
   * FastAPI microservice and returns the structured JSON.
   */
  private async _analyzeResume(file: File): Promise<ResumeAnalysisResult | null> {
    const form = new FormData();
    form.append("resume", file);

    console.log("========== SENDING TO FASTAPI ==========");

    const response = await fetch("/api/v1/analyze-resume", {
      method: "POST",
      body: form,
    });

    console.log("HTTP Status:", response.status);

    const json = await response.json();

    console.log("========== FASTAPI RESPONSE ==========");
    console.log(JSON.stringify(json, null, 2));

    if (!json.success) {
      console.error("Resume analysis failed");
      return null;
    }

    console.log("========== ANALYSIS ==========");
    console.log(json.analysis);

    return json.analysis;
  }

  /**
   * Build skill_score rows from the analysis and upsert them.
   * Scores are approximated from the number of items in each category.
   */
  private async _upsertSkillScores(
    userId: string,
    analysis: ResumeAnalysisResult
  ): Promise<void> {
    const now = new Date().toISOString();

    const scoreFor = (items: any[], max = 20): number =>
      Math.min(100, Math.round((items.length / max) * 100));

    const getNames = (items: any[]) => items.map(i => typeof i === 'string' ? i : i.name).filter(Boolean);

    const rows: SkillScoreRow[] = [
      {
        user_id: userId,
        category: 'programming' as SkillCategory,
        score: scoreFor(analysis.programming_languages, 10),
        evidence: { detected: getNames(analysis.programming_languages) },
        explanation: `Detected ${analysis.programming_languages.length} programming language(s) from resume.`,
        improvement_tips: [],
      },
      {
        user_id: userId,
        category: 'frontend' as SkillCategory,
        score: scoreFor(
          getNames(analysis.frameworks).filter((f: string) =>
            /react|vue|angular|svelte|next|nuxt|gatsby|html|css|tailwind/i.test(f)
          ),
          8
        ),
        evidence: { frameworks: getNames(analysis.frameworks) },
        explanation: `Detected ${analysis.frameworks.length} framework(s) from resume.`,
        improvement_tips: [],
      },
      {
        user_id: userId,
        category: 'backend' as SkillCategory,
        score: scoreFor(
          [
            ...getNames(analysis.databases),
            ...getNames(analysis.frameworks).filter((f: string) =>
              /express|django|fastapi|flask|spring|rails|laravel|node/i.test(f)
            ),
          ],
          10
        ),
        evidence: { databases: getNames(analysis.databases) },
        explanation: `Detected ${analysis.databases.length} database(s) and backend tech from resume.`,
        improvement_tips: [],
      },
      {
        user_id: userId,
        category: 'ai_ml' as SkillCategory,
        score: scoreFor(analysis.ai_ml, 8),
        evidence: { detected: getNames(analysis.ai_ml) },
        explanation: `Detected ${analysis.ai_ml.length} AI/ML technology(ies) from resume.`,
        improvement_tips: [],
      },
      {
        user_id: userId,
        category: 'cloud' as SkillCategory,
        score: scoreFor([...analysis.cloud, ...analysis.devops], 8),
        evidence: { cloud: getNames(analysis.cloud), devops: getNames(analysis.devops) },
        explanation: `Detected ${analysis.cloud.length} cloud platform(s) and ${analysis.devops.length} DevOps tool(s) from resume.`,
        improvement_tips: [],
      },
    ].filter((row) => row.score > 0); // Only persist rows with non-zero scores

    await this.repository.upsertSkillScores(rows);
  }

  /**
   * Merge two string arrays, deduplicating by lowercased value.
   * Items from `base` are preserved as-is; items from `extra` are appended
   * only if they don't already exist (case-insensitive).
   */
  private _merge(base: string[], extra: string[]): string[] {
    const seen = new Set(base.map((s) => s.toLowerCase()));
    const result = [...base];
    for (const item of extra) {
      if (item && !seen.has(item.toLowerCase())) {
        seen.add(item.toLowerCase());
        result.push(item);
      }
    }
    return result;
  }
}
