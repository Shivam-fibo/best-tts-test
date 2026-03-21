"use client";

import { useState, useRef } from "react";

const MAX_CHARS = 500;

export default function Home() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const mediaSourceRef = useRef<MediaSource | null>(null);
  const sourceBufferRef = useRef<SourceBuffer | null>(null);

  const isOverLimit = text.length > MAX_CHARS;

  const handleSpeak = async () => {
    if (!text.trim() || isOverLimit) return;

    setLoading(true);
    setLatency(null);

    const start = performance.now();

    try {
      const res = await fetch("/api/climb", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });

      if (!res.ok || !res.body) {
        console.error("TTS request failed:", await res.text());
        setLoading(false);
        return;
      }

      const mimeType = "audio/mpeg";
      const audio = audioRef.current!;

      if (!window.MediaSource || !MediaSource.isTypeSupported(mimeType)) {
        const blob = await res.blob();
        audio.src = URL.createObjectURL(blob);
        setLatency(Math.round(performance.now() - start));
        audio.play();
        setLoading(false);
        return;
      }

      const mediaSource = new MediaSource();
      mediaSourceRef.current = mediaSource;
      audio.src = URL.createObjectURL(mediaSource);

      await new Promise<void>((resolve) => {
        mediaSource.addEventListener("sourceopen", () => resolve(), { once: true });
      });

      const sourceBuffer = mediaSource.addSourceBuffer(mimeType);
      sourceBufferRef.current = sourceBuffer;

      const appendQueue: ArrayBuffer[] = [];
      let isAppending = false;
      let streamDone = false;

      const tryAppendNext = () => {
        if (isAppending || appendQueue.length === 0) return;
        isAppending = true;
        sourceBuffer.appendBuffer(appendQueue.shift()!);
      };

      sourceBuffer.addEventListener("updateend", () => {
        isAppending = false;
        if (streamDone && appendQueue.length === 0) {
          if (mediaSource.readyState === "open") mediaSource.endOfStream();
          return;
        }
        tryAppendNext();
      });

      const reader = res.body.getReader();
      let firstChunk = true;

      while (true) {
        const { done, value } = await reader.read();

        if (done) {
          streamDone = true;
          if (!isAppending && appendQueue.length === 0) {
            if (mediaSource.readyState === "open") mediaSource.endOfStream();
          }
          break;
        }

        const chunk = value.buffer.slice(
          value.byteOffset,
          value.byteOffset + value.byteLength
        ) as ArrayBuffer;

        appendQueue.push(chunk);

        if (firstChunk) {
          firstChunk = false;
          setLatency(Math.round(performance.now() - start));
          setLoading(false);
          tryAppendNext();
          audio.play().catch(console.error);
        } else {
          tryAppendNext();
        }
      }

    } catch (err) {
      console.error("TTS playback error:", err);
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Simple TTS</h2>

      <input
        style={{ padding: 10, width: 300 }}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Enter text..."
        onKeyDown={(e) => e.key === "Enter" && handleSpeak()}
      />

      {/* Only shows up when over limit */}
      {isOverLimit && (
        <div style={{ color: "red", fontSize: 13, marginTop: 6 }}>
          {text.length}/{MAX_CHARS} — exceeds 500 character limit
        </div>
      )}

      <button
        onClick={handleSpeak}
        disabled={loading || isOverLimit}
        style={{ marginLeft: 10, padding: 10 }}
      >
        {loading ? "Speaking..." : "Speak"}
      </button>

      <div style={{ marginTop: 20 }}>
        <strong>Latency:</strong>{" "}
        {latency ? `${latency} ms` : "—"}
      </div>

      <audio ref={audioRef} />
    </div>
  );
}