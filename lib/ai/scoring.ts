import { GitHubSummary } from "@/lib/types/github";
import { DeterministicScores } from "@/lib/types/ai";

export class DeterministicScorer {
  static calculate(summary: GitHubSummary): DeterministicScores {
    const { metrics, frameworks, languages, projects } = summary;

    const scores = {
      frontend_score: 0,
      backend_score: 0,
      ai_score: 0,
      cloud_score: 0,
      game_dev_score: 0,
      cyber_score: 0,
      documentation_score: 0,
      problem_solving_score: 0,
      project_quality_score: 0,
    };

    const frameworksLower = frameworks.map((f) => f.toLowerCase());
    
    // Total repo normalization
    const normalizedRepos = Math.min(metrics.total_repositories / 20, 1) * 100;
    const normalizedStars = Math.min(metrics.total_stars / 50, 1) * 100;

    // Frontend
    if (languages["TypeScript"] || languages["JavaScript"] || languages["HTML"] || languages["CSS"]) {
      scores.frontend_score += 30;
    }
    if (frameworksLower.some((f) => ["react", "vue", "angular", "svelte"].includes(f))) {
      scores.frontend_score += 40;
    }
    scores.frontend_score += (languages["TypeScript"] || 0) > 10000 ? 30 : 0; // Bonus for heavy TS use

    // Backend
    if (languages["Go"] || languages["Rust"] || languages["Java"] || languages["C#"]) {
      scores.backend_score += 40;
    }
    if (frameworksLower.some((f) => ["node.js", "django", "spring", "flask", "laravel", "ruby on rails"].includes(f))) {
      scores.backend_score += 30;
    }
    if (Object.keys(metrics.topics).some((t) => ["api", "database", "backend"].includes(t.toLowerCase()))) {
      scores.backend_score += 30;
    }

    // AI / ML
    if (languages["Python"] || languages["Jupyter Notebook"]) {
      scores.ai_score += 40;
    }
    if (frameworksLower.some((f) => ["tensorflow", "pytorch", "keras"].includes(f))) {
      scores.ai_score += 60;
    }

    // Cloud / DevOps
    if (frameworksLower.some((f) => ["docker", "kubernetes"].includes(f))) {
      scores.cloud_score += 50;
    }
    if (Object.keys(metrics.topics).some((t) => ["aws", "azure", "gcp", "ci-cd"].includes(t.toLowerCase()))) {
      scores.cloud_score += 50;
    }

    // Documentation
    if (summary.readme && summary.readme.length > 500) {
      scores.documentation_score += 40;
    }
    const reposWithDesc = projects.filter((p) => p.description && p.description.length > 10).length;
    const descRatio = projects.length > 0 ? reposWithDesc / projects.length : 0;
    scores.documentation_score += descRatio * 60;

    // Project Quality
    scores.project_quality_score += normalizedStars * 0.4;
    scores.project_quality_score += descRatio * 40;
    scores.project_quality_score += metrics.recent_activity_score * 0.2;

    // Problem Solving (Heuristic: complex languages, algos)
    if (languages["C++"] || languages["Rust"] || languages["Go"]) {
      scores.problem_solving_score += 40;
    }
    if (Object.keys(metrics.topics).some((t) => ["algorithm", "leetcode", "competitive-programming"].includes(t.toLowerCase()))) {
      scores.problem_solving_score += 60;
    }

    // Cap all scores at 100
    for (const key of Object.keys(scores) as (keyof typeof scores)[]) {
      scores[key] = Math.min(100, Math.round(scores[key]));
    }

    // Overall Score (Weighted average of top 2 skills + project quality + docs)
    const skillScores = [
      scores.frontend_score,
      scores.backend_score,
      scores.ai_score,
      scores.cloud_score,
      scores.game_dev_score,
      scores.cyber_score,
    ].sort((a, b) => b - a);

    const overall = (skillScores[0] * 0.4) + (skillScores[1] * 0.2) + (scores.project_quality_score * 0.3) + (scores.documentation_score * 0.1);
    
    return {
      ...scores,
      overall_score: Math.min(100, Math.round(overall)),
    };
  }
}
