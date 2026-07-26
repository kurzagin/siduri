import { NextRequest, NextResponse } from "next/server";
import { generateSiduriResponse, LLMProviderId } from "@/lib/ai/providers";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { messages, provider = "gemini", model, apiKey } = body;

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: "Invalid request format: 'messages' array required." },
        { status: 400 }
      );
    }

    const responseText = await generateSiduriResponse(
      provider as LLMProviderId,
      model,
      messages,
      apiKey
    );

    return NextResponse.json({
      role: "assistant",
      content: responseText,
      provider,
      model,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : "Internal Siduri AI error";
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
