export interface GithubProfile {
    login: string;
    name: string;
    bio: string | null;
    followers: number;
    following: number;
    public_repos: number;
    avatar_url: string;
}

export interface GithubRepository {
    name: string;
    description: string | null;
    language: string | null;
    stargazers_count: number;
    forks_count: number;
    topics: string[];
    updated_at: string;
}