"use client";

import { useState, useRef } from "react";

export default function SarvamPage() {
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState<number | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const handleSpeak = async () => {
    if (!text.trim()) return;

    setLoading(true);
    setLatency(null);

    const start = performance.now();

    try {
      const res = await fetch("/api/sarvam", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text }),
      });

      if (!res.ok) {
        throw new Error(await res.text());
      }

      const blob = await res.blob();

      if (!blob || blob.size === 0) {
        throw new Error("Invalid audio");
      }

      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        await audioRef.current.play();
      }

      setLatency(Math.round(performance.now() - start));

    } catch (err) {
      console.error("Sarvam error:", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>Sarvam TTS</h2>

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