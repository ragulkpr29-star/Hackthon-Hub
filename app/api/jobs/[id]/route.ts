/*
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

*/


import { NextRequest, NextResponse } from "next/server";
import { JobRepository } from "@/lib/repositories/job.repository";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    console.log("========== JOB API ==========");
    console.log("Job ID:", id);

    const job = await JobRepository.getJob(id);

    console.log("Job Result:");
    console.log(job);

    return NextResponse.json({
      success: true,
      job,
    });

  } catch (error: any) {

    console.error("========== JOB API ERROR ==========");
    console.error(error);
    console.error(error.message);
    console.error(error.stack);

    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}