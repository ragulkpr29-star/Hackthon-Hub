import { GithubMetrics, GithubRepository } from "@/lib/types/github";

const FRAMEWORK_KEYWORDS: Record<string, string[]> = {
  "React": ["react", "nextjs", "next.js", "jsx", "tsx"],
  "Vue": ["vue", "nuxtjs", "nuxt.js"],
  "Angular": ["angular"],
  "Svelte": ["svelte"],
  "Node.js": ["express", "nestjs", "node"],
  "Django": ["django"],
  "Flask": ["flask"],
  "Spring": ["spring boot", "spring"],
  "Laravel": ["laravel"],
  "Ruby on Rails": ["rails"],
  "TensorFlow": ["tensorflow", "keras"],
  "PyTorch": ["pytorch"],
  "Docker": ["docker", "dockerfile", "docker-compose"],
  "Kubernetes": ["kubernetes", "k8s"],
};

export class GithubMetricsCalculator {
  static calculate(
    repositories: GithubRepository[],
    languages: Record<string, number>
  ): GithubMetrics {
    let totalStars = 0;
    let totalForks = 0;
    const topicsMap: Record<string, number> = {};
    const frameworksSet = new Set<string>();
    
    // Sort languages to find most used
    let mostUsedLanguage: string | null = null;
    let maxBytes = 0;
    for (const [lang, bytes] of Object.entries(languages)) {
      if (bytes > maxBytes) {
        maxBytes = bytes;
        mostUsedLanguage = lang;
      }
    }

    // Process repositories
    repositories.forEach((repo) => {
      totalStars += repo.stargazers_count;
      totalForks += repo.forks_count;

      // Count topics
      repo.topics.forEach((topic) => {
        topicsMap[topic] = (topicsMap[topic] || 0) + 1;
        
        // Check for frameworks in topics
        for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
          if (keywords.includes(topic.toLowerCase())) {
            frameworksSet.add(framework);
          }
        }
      });

      // Check for frameworks in name or description
      const searchString = `${repo.name} ${repo.description || ""}`.toLowerCase();
      for (const [framework, keywords] of Object.entries(FRAMEWORK_KEYWORDS)) {
        if (keywords.some((kw) => searchString.includes(kw))) {
          frameworksSet.add(framework);
        }
      }
    });

    const totalRepos = repositories.length;
    
    // Recent activity score (simple heuristic based on updated_at of top repos)
    let recentActivityScore = 0;
    const now = new Date().getTime();
    repositories.slice(0, 5).forEach((repo) => {
      const updated = new Date(repo.updated_at).getTime();
      const daysSinceUpdate = (now - updated) / (1000 * 3600 * 24);
      if (daysSinceUpdate < 30) recentActivityScore += 20;
      else if (daysSinceUpdate < 90) recentActivityScore += 10;
      else if (daysSinceUpdate < 365) recentActivityScore += 5;
    });

    return {
      total_repositories: totalRepos,
      total_stars: totalStars,
      total_forks: totalForks,
      average_stars: totalRepos > 0 ? parseFloat((totalStars / totalRepos).toFixed(2)) : 0,
      average_forks: totalRepos > 0 ? parseFloat((totalForks / totalRepos).toFixed(2)) : 0,
      most_used_language: mostUsedLanguage,
      languages,
      frameworks: Array.from(frameworksSet),
      topics: topicsMap,
      recent_activity_score: Math.min(100, recentActivityScore),
    };
  }
}
