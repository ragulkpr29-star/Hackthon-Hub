import { NextResponse } from "next/server";
import { askOpenRouter } from "@/lib/ai/openrouter";

export async function GET() {
    try {
        const result = await askOpenRouter("Say Hello");

        return NextResponse.json({
            success: true,
            result,
        });

    } catch (error: any) {
        return NextResponse.json(
            {
                success: false,
                error: error.message,
            },
            { status: 500 }
        );
    }
}