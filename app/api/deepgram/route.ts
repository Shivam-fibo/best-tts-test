import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    // ✅ Validation (important for production)
    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response("Invalid text", { status: 400 });
    }

    if (text.length > 500) {
      return new Response("Text too long", { status: 400 });
    }

    const apiKey = process.env.DEEPGRAM_API_KEY;

    if (!apiKey) {
      return new Response("Missing DEEPGRAM_API_KEY", { status: 500 });
    }

    // ⚡ Deepgram streaming TTS
    const response = await fetch(
      "https://api.deepgram.com/v1/speak?model=aura-asteria-en&encoding=mp3",
      {
        method: "POST",
        headers: {
          Authorization: `Token ${apiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text: text.trim(),
        }),
      }
    );

    if (!response.ok || !response.body) {
      const err = await response.text();
      return new Response(err, { status: 500 });
    }

    // ✅ Direct streaming pass-through (NO buffering)
    return new Response(response.body, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    });

  } catch (err: any) {
    console.error("Deepgram TTS error:", err);
    return new Response(
      JSON.stringify({ error: "Deepgram failed", details: err.message }),
      { status: 500 }
    );
  }
}