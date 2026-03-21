import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { text } = body;

    console.log("[TTS] Incoming request:", { textLength: text?.length });

    if (!text) {
      console.error("[TTS] Missing text");
      return new Response("Text required", { status: 400 });
    }

    const apiKey = process.env.ELEVENLABS_API_KEY;
    const voiceId = process.env.YOUR_VOICE_ID;

    if (!apiKey || !voiceId) {
      console.error("[TTS] Missing env vars", {
        hasApiKey: !!apiKey,
        hasVoiceId: !!voiceId,
      });
      return new Response("Server config error", { status: 500 });
    }

    console.log("[TTS] Calling ElevenLabs API...");

    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey,
          "Content-Type": "application/json",
          Accept: "audio/mpeg",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_multilingual_v2",
        }),
      }
    );

    console.log("[TTS] ElevenLabs status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("[TTS] ElevenLabs error:", errorText);

      return new Response("TTS provider failed", { status: 500 });
    }

    const contentType = response.headers.get("content-type");
    console.log("[TTS] Response content-type:", contentType);

    const audioBuffer = await response.arrayBuffer();

    console.log("[TTS] Audio buffer size:", audioBuffer.byteLength);

    if (!audioBuffer || audioBuffer.byteLength === 0) {
      console.error("[TTS] Empty audio buffer");
      return new Response("Empty audio", { status: 500 });
    }

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Content-Length": audioBuffer.byteLength.toString(),
      },
    });
  } catch (err: any) {
    console.error("[TTS] Fatal error:", err.message);
    return new Response("TTS failed", { status: 500 });
  }
}