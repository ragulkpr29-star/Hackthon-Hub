import { GitHubSummary } from "@/lib/types/github";

export class AiPromptBuilder {
  static buildPrompt(summary: GitHubSummary): string {
    const profile = summary.profile;
    const metrics = summary.metrics;
    
    // Create a concise list of top projects
    const topProjects = summary.projects
      .sort((a, b) => b.stargazers_count - a.stargazers_count)
      .slice(0, 10)
      .map(p => `- ${p.name}: ${p.description || "No description"} (Language: ${p.language}, Stars: ${p.stargazers_count})`)
      .join("\n");

    const languagesStr = Object.entries(summary.languages)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([lang, bytes]) => `${lang} (${Math.round(bytes / 1024)} KB)`)
      .join(", ");

    return `
You are an expert tech recruiter and senior engineering manager.
Analyze the following developer's GitHub profile and provide structured insights.

Developer Profile:
- Name: ${profile.name || profile.login}
- Bio: ${profile.bio || "None"}
- Location: ${profile.location || "Unknown"}
- Followers: ${profile.followers}
- Public Repos: ${profile.public_repos}

Metrics:
- Total Stars: ${metrics.total_stars}
- Total Forks: ${metrics.total_forks}
- Top Languages: ${languagesStr}
- Detected Frameworks: ${metrics.frameworks.join(", ") || "None"}

Top Projects:
${topProjects}

README Content:
${summary.readme ? summary.readme.substring(0, 1500) + "..." : "No README available"}

Based on this data, provide:
1. 3-5 key strengths of this developer.
2. 2-3 areas for improvement (weaknesses).
3. The most suitable role for them (e.g., "Senior Frontend Engineer", "Full-Stack Developer", "Data Scientist").
4. What kind of teammates would complement them best in a hackathon.
5. What types of hackathons they should participate in.
6. A short learning roadmap (3-4 points) to level up their skills.
7. A brief explanation of your reasoning.

Respond ONLY with valid JSON using the exact schema provided in system instructions.
`;
  }
}
