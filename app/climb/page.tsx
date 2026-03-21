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
      const res = await fetch("/api/climb", {
        method: "POST",
        body: JSON.stringify({ text }),
      });

      // if (!res.ok) {
      //   const err = await res.text();
      //   console.error(err);
      //   return;
      // }


      const blob = await res.blob();

      const end = performance.now();
      setLatency(Math.round(end - start));

      const url = URL.createObjectURL(blob);

      if (audioRef.current) {
        audioRef.current.src = url;
        audioRef.current.play();
      }
    } catch (err) {
      console.error(err);
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