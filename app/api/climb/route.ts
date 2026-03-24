// app/api/tts/route.ts
import { NextRequest } from "next/server";
import { CambClient } from "@camb-ai/sdk";

export const runtime = "nodejs";

const client = new CambClient({
  apiKey: process.env.CAMB_API_KEY!,
});

export async function POST(req: NextRequest) {
  const body = await req.json();

  if (!body?.text || typeof body.text !== "string" || body.text.trim().length === 0) {
    return new Response(JSON.stringify({ error: "Invalid text input" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await client.textToSpeech.tts({
      text: body.text.trim(),
      voice_id: 147320,
      language: "en-us",
      output_configuration: {
        format: "mp3",
      },
    });

    // CAMB SDK returns BinaryResponse — no .body stream available
    // We get the full ArrayBuffer then wrap it in a ReadableStream
    // so the client still receives it as a streaming chunked response
    const arrayBuffer = await response.arrayBuffer();
    console.log("array buffer  lenght", arrayBuffer.byteLength);
    const chunkSize = 16 * 1024; // 16KB chunks
    let offset = 0;

    const readable = new ReadableStream({
      pull(controller) {
        if (offset >= arrayBuffer.byteLength) {
          controller.close();
          return;
        }

        const end = Math.min(offset + chunkSize, arrayBuffer.byteLength);
        // Slice gives ArrayBuffer — no SharedArrayBuffer ambiguity
        controller.enqueue(new Uint8Array(arrayBuffer.slice(offset, end)));
        offset = end;
      },
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "audio/mpeg",
        "Transfer-Encoding": "chunked",
        "Cache-Control": "no-store",
      },
    });

  } catch (err: any) {
    console.error("CAMB TTS error:", err);
    return new Response(
      JSON.stringify({ error: "TTS failed", details: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}