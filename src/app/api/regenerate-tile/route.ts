import { NextRequest, NextResponse } from "next/server";
import { regenerateTile } from "@/lib/aggregate";
import { ImageSource } from "@/lib/types";

const VALID_SOURCES: ImageSource[] = ["unsplash", "pexels", "nimble", "baseten"];

export async function POST(req: NextRequest) {
  const { source, query } = await req.json();

  if (!VALID_SOURCES.includes(source) || !query || typeof query !== "string") {
    return NextResponse.json({ error: "source and query are required" }, { status: 400 });
  }

  const tile = await regenerateTile(source, query);

  if (!tile) {
    return NextResponse.json(
      { error: `No result from ${source}. Check that its API key is configured.` },
      { status: 502 }
    );
  }

  return NextResponse.json({ tile });
}
