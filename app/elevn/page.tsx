"use client";

import { useState, useRef } from "react";

export default function Home() {
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
    const res = await fetch("/api/elevn", {
      method: "POST",
      headers: {
        "Content-Type": "application/json", // REQUIRED
      },
      body: JSON.stringify({ text }),
    });

    console.log("Response status:", res.status);
    console.log("Response content-type:", res.headers.get("content-type"));

    if (!res.ok) {
      const errText = await res.text();
      console.error("API Error:", errText);
      throw new Error("API failed");
    }

    const blob = await res.blob();

    console.log("Blob type:", blob.type);
    console.log("Blob size:", blob.size);

    if (!blob || blob.size === 0) {
      throw new Error("Invalid audio blob");
    }

    const url = URL.createObjectURL(blob);

    if (audioRef.current) {
      audioRef.current.src = url;

      try {
        await audioRef.current.play();
      } catch (playErr) {
        console.error("Audio play failed:", playErr);
      }
    }

    const end = performance.now();
    setLatency(Math.round(end - start));
  } catch (err) {
    console.error("TTS Error:", err);
  } finally {
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
      />

      <button
        onClick={handleSpeak}
        disabled={loading}
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