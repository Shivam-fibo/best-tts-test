"use client";

import { useState, useRef } from "react";

export default function DeepgramPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setLatency(null);

    const start = performance.now();

    try {
      const res = await fetch("/api/deepgram", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok || !res.body) {
        throw new Error(await res.text());
      }

      const mimeType = "audio/mpeg";
      const audio = audioRef.current!;

      if (!window.MediaSource || !MediaSource.isTypeSupported(mimeType)) {
        // fallback
        const blob = await res.blob();
        audio.src = URL.createObjectURL(blob);
        audio.play();
        setLatency(Math.round(performance.now() - start));
        setLoading(false);
        return;
      }

      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      audio.src = URL.createObjectURL(mediaSource);

      await new Promise<void>((resolve) => {
        mediaSource.addEventListener("sourceopen", () => resolve(), {
          once: true,
        });
      });

      const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
      sourceBufferRef.current = sourceBuffer;

      const reader = res.body.getReader();

      let firstChunk = true;
      let isAppending = false;
      const queue: ArrayBuffer[] = [];
      let done = false;

      const appendNext = () => {
        if (isAppending || queue.length === 0) return;
        isAppending = true;
        sourceBuffer.appendBuffer(queue.shift()!);
      };

      sourceBuffer.addEventListener("updateend", () => {
        isAppending = false;

        if (done && queue.length === 0) {
          if (mediaSource.readyState === "open") {
            mediaSource.endOfStream();
          }
          return;
        }

        appendNext();
      });

      while (true) {
        const { done: streamDone, value } = await reader.read();

        if (streamDone) {
          done = true;
          if (!isAppending && queue.length === 0) {
            if (mediaSource.readyState === "open") {
              mediaSource.endOfStream();
            }
          }
          break;
        }

        const chunk = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength
        );

        queue.push(chunk);

        if (firstChunk) {
          firstChunk = false;
          setLatency(Math.round(performance.now() - start));
          setLoading(false);
          appendNext();
          audio.play().catch(console.error);
        } else {
          appendNext();
        }
      }

    } catch (err) {
      console.error("Deepgram error:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Deepgram Streaming TTS</h2>

      <input
        style={{ padding: 10, width: 300 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
      />

      <button
        onClick={handleSpeak}
        disabled={loading}
        style={{ marginLeft: 10, padding: 10 }}
      >
        {loading ? "Speaking..." : "Speak"}
      </button>

      <div style={{ marginTop: 20 }}>
        <strong>Latency:</strong> {latency ? `${latency} ms` : "—"}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}