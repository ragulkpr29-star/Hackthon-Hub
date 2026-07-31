import { NextRequest, NextResponse } from "next/server";
import { JobRepository } from "@/lib/repositories/job.repository";
import { Logger } from "@/lib/core/logger";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    
    if (!id) {
      return NextResponse.json({ error: "Missing job ID" }, { status: 400 });
    }

    const job = await JobRepository.getJob(id);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    return NextResponse.json({ job });
  } catch (error: any) {
    Logger.error("Failed to get job status", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
