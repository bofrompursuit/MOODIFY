"use client";

import { useState } from "react";
import { Download } from "lucide-react";

export function ExportButton() {
  const [exporting, setExporting] = useState(false);

  const handleExport = async () => {
    const node = document.getElementById("mood-board-export");
    if (!node) return;

    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(node, { pixelRatio: 2, cacheBust: true });
      const link = document.createElement("a");
      link.download = `moodify-board-${Date.now()}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={exporting}
      className="flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 text-sm text-white/80 hover:border-accent/60 hover:text-white transition-colors disabled:opacity-50"
    >
      <Download size={16} />
      {exporting ? "Exporting…" : "Export PNG"}
    </button>
  );
}
