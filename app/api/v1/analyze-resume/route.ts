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

    try {
      const json = JSON.parse(text);

      if (!response.ok) {
        return NextResponse.json(json, {
          status: response.status,
        });
      }

      return NextResponse.json(json);
    } catch {
      return NextResponse.json(
        {
          success: false,
          message: 'Resume analysis service returned invalid JSON.',
        },
        { status: 500 }
      );
    }
  } catch (err: any) {
    if (err?.name === 'TimeoutError' || err?.name === 'AbortError') {
      return NextResponse.json(
        { success: false, message: 'Resume analysis service timed out (60 s limit).' },
        { status: 504 }
      );
    }

    // fetch() throws TypeError on network errors (ECONNREFUSED, DNS failure, etc.)
    const isNetworkError =
      err instanceof TypeError || err?.cause?.code === 'ECONNREFUSED';

    if (isNetworkError) {
      return NextResponse.json(
        {
          success: false,
          message:
            `Resume analysis service is not reachable at ${FASTAPI_BASE_URL}. ` +
            'Start it with: npm run dev:ml',
        },
        { status: 503 }
      );
    }

    return NextResponse.json(
      {
        success: false,
        message: 'An unexpected error occurred while contacting the resume analysis service.',
      },
      { status: 503 }
    );
  }
}
