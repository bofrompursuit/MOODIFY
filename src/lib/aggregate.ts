import { fetchUnsplash } from "./sources/unsplash";
import { fetchPexels } from "./sources/pexels";
import { fetchNimble, fetchNimbleClippings } from "./sources/nimble";
import { ExtractedBrief, ImageSource, MoodTile } from "./types";

const MIN_BOARD_SIZE = 6;

export async function buildMoodBoard(extracted: ExtractedBrief): Promise<MoodTile[]> {
  // Everything below fires in parallel — stock APIs are near-instant (or a
  // no-op without keys), and Nimble does two independent live scrapes.
  // Running them concurrently instead of sequentially is the single biggest
  // lever on total latency (was image-search-then-clippings, back to back).
  const [keywordBatches, nimbleImages, nimbleClippings] = await Promise.all([
    Promise.all(
      extracted.stockKeywords.map(async (keyword) => {
        const [unsplash, pexels] = await Promise.all([
          fetchUnsplash(keyword, 2),
          fetchPexels(keyword, 2),
        ]);
        return [...unsplash, ...pexels];
      })
    ),
    fetchNimble(extracted.nimbleSearchQuery, 4),
    fetchNimbleClippings(extracted.nimbleSearchQuery, MIN_BOARD_SIZE),
  ]);

  let tiles = [...keywordBatches.flat(), ...nimbleImages];

  // De-dupe by image URL (all tiles here are "image" kind, so this is defined).
  const seen = new Set<string>();
  tiles = tiles.filter((tile) => {
    const url = tile.imageUrl!;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  // No configured image source is guaranteed to return anything (stock APIs
  // need keys; Nimble's image search engine can be flaky). Top up with the
  // clippings fetched above (already in hand, no extra round trip) so the
  // board still has real, on-brief content instead of shipping empty.
  if (tiles.length < MIN_BOARD_SIZE) {
    tiles = [...tiles, ...nimbleClippings.slice(0, MIN_BOARD_SIZE - tiles.length)];
  }

  // Rare last resort: the site:-restricted nimbleSearchQuery can itself
  // occasionally return zero organic results on both engines at once. Retry
  // once with a broader, unrestricted query built from the raw keywords —
  // near-guaranteed to return *something* — rather than shipping an empty
  // board over one narrow query having no matches.
  if (tiles.length === 0) {
    const broadQuery = extracted.stockKeywords.slice(0, 3).join(" ");
    tiles = await fetchNimbleClippings(broadQuery, MIN_BOARD_SIZE);
  }

  return tiles.slice(0, 16);
}

export async function regenerateTile(
  source: ImageSource,
  query: string
): Promise<MoodTile | null> {
  switch (source) {
    case "unsplash": {
      const [tile] = await fetchUnsplash(query, 1);
      return tile ?? null;
    }
    case "pexels": {
      const [tile] = await fetchPexels(query, 1);
      return tile ?? null;
    }
    case "nimble": {
      const [[imageTile], [clipping]] = await Promise.all([
        fetchNimble(query, 1),
        fetchNimbleClippings(query, 1),
      ]);
      return imageTile ?? clipping ?? null;
    }
    case "baseten": {
      const { generateBaseten } = await import("./sources/baseten");
      return generateBaseten(query);
    }
  }
}
