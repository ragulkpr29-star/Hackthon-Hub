import { GitHubSummary } from "@/lib/types/github";
import { ResumeAnalysisResult } from "@/lib/types/resume-analysis";

export class AiPromptBuilder {
  static buildPrompt(
    githubSummary: GitHubSummary,
    linkedinSummary: any = null,
    resumeResult: ResumeAnalysisResult | null = null
  ): string {

    const summary = githubSummary;

    const profile = summary.profile;
    const metrics = summary.metrics;

    const topLanguages = Object.entries(summary.languages || {})
      .sort(([, a], [, b]) => Number(b) - Number(a))
      .slice(0, 10)
      .map(([lang]) => lang);

    const topProjects = (summary.projects || [])
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 8)
      .map((p) => ({
        name: p.name,
        description: p.description || "No description",
        language: p.language,
        stars: p.stargazers_count,
        forks: p.forks_count,
        topics: p.topics?.slice(0, 5) || [],
      }));

    const githubContext = {
      profile: {
        name: profile.name || profile.login,
        bio: profile.bio,
        company: profile.company,
        followers: profile.followers,
        publicRepos: profile.public_repos,
      },

      metrics: {
        totalStars: metrics.total_stars,
        totalForks: metrics.total_forks,
        mostUsedLanguage: metrics.most_used_language,
        recentActivityScore: metrics.recent_activity_score,
        detectedFrameworks: metrics.frameworks,
        topTopics: Object.keys(metrics.topics || {}),
      },

      topLanguages,

      topProjects,

      readmeSnippet:
        summary.readme?.substring(0, 1000) || "",
    };

    const linkedinContext = linkedinSummary
      ? {
        name: linkedinSummary.name,

        headline: linkedinSummary.headline,

        summary: linkedinSummary.summary,

        location: linkedinSummary.location,

        followers: linkedinSummary.followers,

        connections: linkedinSummary.connections,

        company: linkedinSummary.company,

        skills: linkedinSummary.skills,

        experience: linkedinSummary.experience,

        education: linkedinSummary.education,

        certifications: linkedinSummary.certifications,

        projects: linkedinSummary.projects,
      }
      : null;

    const resumeContext = resumeResult
      ? {
        programmingLanguages: resumeResult.programming_languages,
        frameworks: resumeResult.frameworks,
        libraries: resumeResult.libraries,
        databases: resumeResult.databases,
        cloud: resumeResult.cloud,
        devops: resumeResult.devops,
        ai_ml: resumeResult.ai_ml,
        tools: resumeResult.tools,
        softSkills: resumeResult.soft_skills,
        certifications: resumeResult.certifications,
      }
      : null;

    const developerData = {
      github: githubContext,
      linkedin: linkedinContext,
      resume: resumeContext,
    };

    return `
You are an expert software engineering recruiter and senior technical interviewer.

Analyze the following developer using ALL available information.

Priority:
1. GitHub
2. LinkedIn
3. Resume

Developer Data:

${JSON.stringify(developerData, null, 2)}

Return ONLY valid JSON.

{
  "professionalSummary": "",
  "experienceLevel": "Beginner|Intermediate|Advanced|Expert",

  "technicalSkills": [],

  "programmingLanguages": [],

  "frameworks": [],

  "tools": [],

  "strengths": [],

  "weaknesses": [],

  "recommendedHackathonRole": "",

  "projectComplexity": "Low|Medium|High|Very High",

  "frontendScore": 0,
  "backendScore": 0,
  "databaseScore": 0,
  "cloudScore": 0,
  "aiScore": 0,
  "mobileScore": 0,
  "problemSolvingScore": 0,
  "leadershipScore": 0,
  "overallSkillScore": 0,
  "confidence": 0
}

Rules:

Use ALL available information.

GitHub is the primary source for technical ability.

LinkedIn should be used to determine:

- Education
- Current company
- Professional summary
- Experience
- Leadership
- Networking
- Career level
- Location
- Projects
- Professional activities

Resume should be used only to supplement missing information.

Never ignore LinkedIn information if it is available.

If LinkedIn contains education or experience, include it in the professional summary.

If GitHub and LinkedIn both mention similar technologies, increase confidence.

Do not invent skills that are not present.

Return ONLY valid JSON.
`;
  }
}