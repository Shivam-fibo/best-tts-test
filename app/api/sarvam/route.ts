import { NextRequest } from "next/server";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    if (!text || typeof text !== "string" || !text.trim()) {
      return new Response("Invalid text", { status: 400 });
    }

    const apiKey = process.env.SARVAM_API_KEY;

    if (!apiKey) {
      return new Response("Missing SARVAM_API_KEY", { status: 500 });
    }

    const response = await fetch("https://api.sarvam.ai/text-to-speech", {
      method: "POST",
      headers: {
        "api-subscription-key": apiKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text: text.trim(),
        target_language_code: "en-IN",
      }),
    });

    if (!response.ok) {
      const err = await response.text();
      return new Response(err, { status: 500 });
    }

    const data = await response.json();

    // ⚠️ Sarvam returns base64 audio
    const base64Audio = data?.audios?.[0];

    if (!base64Audio) {
      return new Response("Invalid audio response", { status: 500 });
    }

    const audioBuffer = Buffer.from(base64Audio, "base64");

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/wav", // Sarvam returns wav
        "Cache-Control": "no-store",
      },
    });

  } catch (err: any) {
    console.error("Sarvam TTS error:", err);
    return new Response(
      JSON.stringify({ error: "Sarvam TTS failed", details: err.message }),
      { status: 500 }
    );
  }
}