import { NextRequest } from "next/server";
import { CambClient } from "@camb-ai/sdk";

export const runtime = "nodejs";

const client = new CambClient({
  apiKey: process.env.CAMB_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    if (!body?.text || typeof body.text !== "string") {
      return new Response(
        JSON.stringify({ error: "Invalid text input" }),
        { status: 400 }
      );
    }

    const response = await client.textToSpeech.tts({
      text: body.text,
      voice_id: 147320,
      language: "en-us",
    //   speech_model: "mars-pro",
      output_configuration: {
        format: "wav",
      },
    });

    // ✅ FIX: use arrayBuffer (NOT getReader)
    const buffer = Buffer.from(await response.arrayBuffer());

    return new Response(buffer, {
      headers: {
        "Content-Type": "audio/wav",
      },
    });

  } catch (err: any) {
    console.error("CAMB ERROR:", err);

    return new Response(
      JSON.stringify({ error: "TTS failed", details: err.message }),
      { status: 500 }
    );
  }
}