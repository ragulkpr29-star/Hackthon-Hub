import { NextRequest, NextResponse } from 'next/server';

/**
 * POST /api/v1/analyze-resume
 *
 * A thin server-side proxy that forwards the uploaded PDF to the
 * FastAPI resume-analysis microservice and returns its JSON response
 * directly to the caller.
 *
 * Running the call server-side (rather than from the browser) avoids
 * CORS issues and keeps the internal service URL out of client bundles.
 */

const FASTAPI_BASE_URL =
  process.env.RESUME_ANALYSIS_URL ?? 'http://localhost:8000';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const formData = await req.formData();
    const file = formData.get('resume');

    if (!file || !(file instanceof File)) {
      return NextResponse.json(
        { success: false, message: 'No PDF file provided under the "resume" field.' },
        { status: 400 }
      );
    }

    // Forward the same multipart payload to FastAPI
    const upstream = new FormData();
    upstream.append('resume', file, file.name);

    const response = await fetch(`${FASTAPI_BASE_URL}/analyze-resume`, {
      method: 'POST',
      body: upstream,
      // Give the ML models up to 60 s to respond
      signal: AbortSignal.timeout(60_000),
    });

    const text = await response.text();

    console.log("========== FASTAPI RESPONSE ==========");
    console.log(text);
    console.log("======================================");

    try {
      const json = JSON.parse(text);

      if (!response.ok) {
        return NextResponse.json(json, {
          status: response.status,
        });
      }

      return NextResponse.json(json);
    } catch (err) {
      console.error("FastAPI did not return JSON.");
      console.error(text);

      return NextResponse.json(
        {
          success: false,
          message: "FastAPI returned invalid JSON",
          raw: text,
        },
        {
          status: 500,
        }
      );
    }
  } catch (err: any) {
    console.error('[/api/v1/analyze-resume] Upstream call failed:', err);

    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Resume analysis service timed out.' },
        { status: 504 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'Failed to reach the resume analysis service. It may not be running.',
      },
      { status: 503 }
    );
  }
}
