"use client";

import { useEffect, useState } from "react";

interface Status {
  anthropic: boolean;
  unsplash: boolean;
  pexels: boolean;
  nimble: boolean;
  baseten: boolean;
  salesforce: boolean;
}

const LABELS: Record<keyof Status, string> = {
  anthropic: "Claude",
  unsplash: "Unsplash",
  pexels: "Pexels",
  nimble: "Nimble",
  baseten: "Baseten",
  salesforce: "Salesforce",
};

export function IntegrationStatus() {
  const [status, setStatus] = useState<Status | null>(null);

  useEffect(() => {
    fetch("/api/status")
      .then((r) => r.json())
      .then(setStatus)
      .catch(() => setStatus(null));
  }, []);

  if (!status) return null;

  return (
    <div className="flex flex-wrap gap-2 justify-center text-[11px]">
      {(Object.keys(LABELS) as (keyof Status)[]).map((key) => (
        <span
          key={key}
          className={`px-2.5 py-1 rounded-full border ${
            status[key]
              ? "border-emerald-500/40 text-emerald-300 bg-emerald-500/10"
              : "border-white/10 text-white/35"
          }`}
        >
          {LABELS[key]} {status[key] ? "live" : "not configured"}
        </span>
      ))}
    </div>
  );
}
