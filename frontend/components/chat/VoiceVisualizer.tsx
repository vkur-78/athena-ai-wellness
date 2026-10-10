"use client";

import { useEffect, useState } from "react";

interface VoiceVisualizerProps {
  active: boolean;
  type?: "listening" | "speaking";
}

export default function VoiceVisualizer({ active, type = "listening" }: VoiceVisualizerProps) {
  const [bars, setBars] = useState<number[]>([40, 65, 30, 80, 50, 90, 45, 70, 35]);

  useEffect(() => {
    if (!active) return;
    const interval = setInterval(() => {
      setBars((prev) =>
        prev.map(() => Math.floor(Math.random() * 65) + 25)
      );
    }, 120);

    return () => clearInterval(interval);
  }, [active]);

  if (!active) return null;

  const isListening = type === "listening";

  return (
    <div className="flex items-center gap-1.5 py-1.5 px-3.5 rounded-full sanctuary-glass border border-[#7C5CFF]/30 text-[#F8F7FF] shadow-[0_0_16px_rgba(124,92,255,0.25)] backdrop-blur-md animate-in fade-in zoom-in-95 duration-200">
      <div className="flex items-center gap-1 h-5">
        {bars.map((height, i) => (
          <span
            key={i}
            style={{ height: `${height}%` }}
            className={`w-1 rounded-full transition-all duration-150 ${
              isListening
                ? "bg-gradient-to-t from-amber-500 to-rose-400"
                : "bg-gradient-to-t from-[#7C5CFF] to-[#BFAEFF]"
            }`}
          />
        ))}
      </div>
      <span className="text-[11px] font-medium text-[#BFAEFF] ml-1">
        {isListening ? "Listening to your thoughts..." : "Athena speaking..."}
      </span>
    </div>
  );
}
