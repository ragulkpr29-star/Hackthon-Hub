const GITHUB_API = "https://api.github.com";

const headers = {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
    Accept: "application/vnd.github+json",
};

export async function getGithubProfile(username: string) {
    const res = await fetch(`${GITHUB_API}/users/${username}`, {
        headers,
        cache: "no-store",
    });

    if (!res.ok) {
        throw new Error("GitHub profile not found");
    }

    return res.json();
}

export async function getGithubRepos(username: string) {
    const res = await fetch(
        `${GITHUB_API}/users/${username}/repos?sort=updated&per_page=100`,
        {
            headers,
            cache: "no-store",
        }
    );

    if (!res.ok) {
        throw new Error("Repositories not found");
    }

    return res.json();
}