import { NextRequest, NextResponse } from "next/server";
import { extractBrief } from "@/lib/extractKeywords";
import { buildMoodBoard } from "@/lib/aggregate";
import { syncMoodBoardToSalesforce } from "@/lib/salesforce";

// Nimble's live scrapes can take 15-30s; Vercel's default function timeout
// is well under that, so without this the request gets killed mid-flight
// and the client just sees nothing happen.
export const maxDuration = 60;

export async function POST(req: NextRequest) {
  const { brief } = await req.json();

  if (!brief || typeof brief !== "string" || !brief.trim()) {
    return NextResponse.json({ error: "brief is required" }, { status: 400 });
  }

  const extracted = await extractBrief(brief.trim());
  const tiles = await buildMoodBoard(extracted);

  syncMoodBoardToSalesforce({
    brief: brief.trim(),
    extracted,
    tileCount: tiles.length,
    createdAt: new Date().toISOString(),
  }).catch((err) => console.error("[salesforce] sync failed:", err));

  return NextResponse.json({ extracted, tiles });
}
