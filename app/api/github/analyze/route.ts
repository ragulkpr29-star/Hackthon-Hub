import { NextRequest, NextResponse } from "next/server";
import { getGithubProfile, getGithubRepos } from "@/lib/github";

export async function POST(req: NextRequest) {
  try {
    const { githubUrl } = await req.json();

    const username = githubUrl
      .replace("https://github.com/", "")
      .replace("/", "");

    const profile = await getGithubProfile(username);
    const repos = await getGithubRepos(username);

    return NextResponse.json({
      success: true,
      profile,
      repos,
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message,
      },
      { status: 500 }
    );
  }
}