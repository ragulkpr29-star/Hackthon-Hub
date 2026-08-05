import { NextRequest, NextResponse } from "next/server";
import { getGithubProfile, getGithubRepos } from "@/lib/github";
import { askOpenRouter } from "@/lib/ai/openrouter";

export async function POST(req: NextRequest) {
  try {
    const { githubUrl } = await req.json();

    const username = githubUrl
      .replace("https://github.com/", "")
      .replace("/", "");

    // Fetch GitHub Data
    const profile = await getGithubProfile(username);
    const repos = await getGithubRepos(username);

    // Prepare data for AI
    const githubData = {
      profile: {
        name: profile.name,
        bio: profile.bio,
        location: profile.location,
        company: profile.company,
        followers: profile.followers,
        following: profile.following,
        publicRepos: profile.public_repos,
      },

      repositories: repos.map((repo: any) => ({
        name: repo.name,
        description: repo.description,
        language: repo.language,
        topics: repo.topics,
        stars: repo.stargazers_count,
        forks: repo.forks_count,
      })),
    };

    // AI Analysis using OpenRouter
    const aiResponse = await askOpenRouter(`
Analyze this GitHub developer profile.

${JSON.stringify(githubData)}

Give the following in professional format:

1. Professional Summary
2. Technical Skills
3. Experience Level (Beginner / Intermediate / Advanced)
4. Strengths
5. Weaknesses
6. Suggested Hackathon Role

Keep the answer short and professional.
`);

    console.log("========== AI RESPONSE ==========");
    console.log(aiResponse.choices[0].message.content);
    console.log("=================================");

    return NextResponse.json({
      success: true,
      githubData,
      aiSummary: aiResponse.choices[0].message.content,
    });

  } catch (err: any) {
    console.error(err);

    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}