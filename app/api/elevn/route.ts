import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const { text } = await req.json();

  if (!text) {
    return new Response("Text required", { status: 400 });
  }

  const apiKey = process.env.ELEVENLABS_API_KEY;

  try {
    const response = await fetch(
      "https://api.elevenlabs.io/v1/text-to-speech/YOUR_VOICE_ID",
      {
        method: "POST",
        headers: {
          "xi-api-key": apiKey!,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          text,
          model_id: "eleven_monolingual_v1",
        }),
      }
    );

    const audioBuffer = await response.arrayBuffer();

    return new Response(audioBuffer, {
      headers: {
        "Content-Type": "audio/mpeg",
      },
    });
  } catch (err) {
    return new Response("TTS failed", { status: 500 });
  }
}