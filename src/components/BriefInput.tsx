"use client";

import { useState } from "react";
import { PRESET_CHIPS } from "@/lib/presets";

interface BriefInputProps {
  onGenerate: (brief: string) => void;
  loading: boolean;
}

export function BriefInput({ onGenerate, loading }: BriefInputProps) {
  const [brief, setBrief] = useState("");

  const submit = () => {
    if (!brief.trim() || loading) return;
    onGenerate(brief.trim());
  };

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col gap-4">
      <div className="flex flex-wrap gap-2 justify-center">
        {PRESET_CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => setBrief(chip.brief)}
            className="text-xs px-3 py-1.5 rounded-full border border-white/15 text-white/70 hover:border-accent/60 hover:text-white transition-colors"
          >
            {chip.label}
          </button>
        ))}
      </div>

      <div className="relative">
        <textarea
          value={brief}
          onChange={(e) => setBrief(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit();
          }}
          rows={3}
          placeholder="Describe the vibe... e.g. moody minimalist wedding, autumn tones"
          className="w-full resize-none rounded-2xl bg-white/5 border border-white/10 px-5 py-4 text-base placeholder:text-white/30 focus:outline-none focus:border-accent/60 focus:bg-white/[0.07] transition-colors"
        />
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={loading || !brief.trim()}
        className="self-center px-8 py-3 rounded-full font-medium bg-gradient-to-r from-accent to-accent-2 text-white disabled:opacity-40 disabled:cursor-not-allowed hover:brightness-110 transition-all"
      >
        {loading ? "Curating your board…" : "Generate Mood Board"}
      </button>
    </div>
  );
}
