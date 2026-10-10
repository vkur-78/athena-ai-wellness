"use client";

import { Moon } from "lucide-react";

interface SliderControlProps {
  value: number;
  onChange: (val: number) => void;
  min?: number;
  max?: number;
  step?: number;
}

export default function SliderControl({
  value,
  onChange,
  min = 0,
  max = 12,
  step = 0.5,
}: SliderControlProps) {
  const getQualityText = (hours: number) => {
    if (hours <= 4) return "Severely Limited Sleep";
    if (hours <= 6) return "Short / Fatigued";
    if (hours <= 8.5) return "Balanced / Restorative";
    return "Extended Rest";
  };

  return (
    <div className="space-y-4 rounded-[20px] border border-zinc-800 bg-zinc-950/50 p-4 sm:p-5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-medium text-zinc-300">
          <Moon size={15} className="text-violet-400" />
          <span>Average Hours per Night</span>
        </div>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold font-mono text-violet-400">{value}</span>
          <span className="text-xs text-zinc-400">hours</span>
        </div>
      </div>

      <div className="relative py-2">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(parseFloat(e.target.value))}
          className="w-full h-2 rounded-lg bg-zinc-800 accent-violet-500 cursor-pointer transition-all"
        />
        <div className="flex justify-between text-[10px] text-zinc-500 font-mono mt-1 px-1">
          <span>0h</span>
          <span>4h</span>
          <span>8h</span>
          <span>12h</span>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs pt-1 border-t border-zinc-800/60 text-zinc-400">
        <span>Rhythm assessment:</span>
        <span className="font-medium text-violet-300">{getQualityText(value)}</span>
      </div>
    </div>
  );
}
