import { env } from "@/lib/core/env";
import { GithubApiError, GithubRateLimitError } from "@/lib/core/errors";
import { withRetry } from "@/lib/core/retry";
import { Logger } from "@/lib/core/logger";

const GITHUB_API_URL = "https://api.github.com";

interface FetchOptions extends RequestInit {
  endpoint: string;
}

export class GithubApi {
  private static async fetchWithToken({ endpoint, ...options }: FetchOptions): Promise<any> {
    const url = `${GITHUB_API_URL}${endpoint}`;
    
    const headers = new Headers(options.headers || {});
    headers.set("Accept", "application/vnd.github.v3+json");
    if (env.GITHUB_TOKEN) {
      headers.set("Authorization", `Bearer ${env.GITHUB_TOKEN}`);
    }

    const start = Date.now();
    const response = await fetch(url, { ...options, headers });
    const duration = Date.now() - start;

    Logger.debug(`GitHub API Call: ${options.method || "GET"} ${endpoint}`, { duration, status: response.status });

    if (!response.ok) {
      if (response.status === 429 || response.status === 403) {
        const resetTime = response.headers.get("X-RateLimit-Reset");
        throw new GithubRateLimitError(resetTime || undefined);
      }
      
      const errorText = await response.text().catch(() => "Unknown error");
      throw new GithubApiError(`GitHub API error: ${response.statusText}`, response.status, {
        endpoint,
        response: errorText,
      });
    }

    // Some endpoints (like raw text) don't return JSON
    const contentType = response.headers.get("content-type");
    if (contentType && contentType.includes("application/json")) {
      return response.json();
    }
    
    return response.text();
  }

  static async get(endpoint: string) {
    return withRetry(
      () => this.fetchWithToken({ endpoint, method: "GET" }),
      `GitHub GET ${endpoint}`
    );
  }
}
