"use client";

import { useState } from "react";
import { BriefInput } from "@/components/BriefInput";
import { MoodBoardGrid } from "@/components/MoodBoardGrid";
import { ExportButton } from "@/components/ExportButton";
import { IntegrationStatus } from "@/components/IntegrationStatus";
import { ExtractedBrief, MoodTile } from "@/lib/types";

export default function Home() {
  const [tiles, setTiles] = useState<MoodTile[]>([]);
  const [extracted, setExtracted] = useState<ExtractedBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [boardKey, setBoardKey] = useState(0);
  const [generated, setGenerated] = useState(false);

  const handleGenerate = async (brief: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/mood-board", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ brief }),
      });
      if (!res.ok) throw new Error("Failed to generate mood board.");
      const data = await res.json();
      setTiles(data.tiles);
      setExtracted(data.extracted);
      setBoardKey((k) => k + 1);
      setGenerated(true);
    } catch {
      setError("Something went wrong generating your board. Try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-6 items-center">
        <div className="text-center">
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight bg-gradient-to-r from-accent to-accent-2 bg-clip-text text-transparent">
            MOODIFY
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            Describe a vibe. Get a curated, editable mood board.
          </p>
        </div>

        <IntegrationStatus />

        <BriefInput onGenerate={handleGenerate} loading={loading} />

        {error && <p className="text-sm text-red-400">{error}</p>}
      </div>

      {extracted && (
        <div className="max-w-2xl mx-auto flex flex-wrap gap-2 justify-center">
          {extracted.stockKeywords.map((kw) => (
            <span
              key={kw}
              className="text-[11px] px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-white/60"
            >
              {kw}
            </span>
          ))}
        </div>
      )}

      {tiles.length > 0 && (
        <div className="flex flex-col gap-4 items-center">
          <div className="w-full max-w-6xl mx-auto flex justify-end px-4">
            <ExportButton />
          </div>
          <MoodBoardGrid key={boardKey} tiles={tiles} />
        </div>
      )}

      {generated && !loading && tiles.length === 0 && !error && (
        <p className="text-center text-sm text-white/40">
          No results came back for this brief. Try a different description,
          or configure more image sources (see the pills above).
        </p>
      )}
    </main>
  );
}
