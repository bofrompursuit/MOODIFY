import { fetchUnsplash } from "./sources/unsplash";
import { fetchPexels } from "./sources/pexels";
import { fetchNimble, fetchNimbleClippings } from "./sources/nimble";
import { ExtractedBrief, ImageSource, MoodTile } from "./types";

const MIN_BOARD_SIZE = 6;

export async function buildMoodBoard(extracted: ExtractedBrief): Promise<MoodTile[]> {
  const keywordBatches = await Promise.all(
    extracted.stockKeywords.map(async (keyword) => {
      const [unsplash, pexels] = await Promise.all([
        fetchUnsplash(keyword, 2),
        fetchPexels(keyword, 2),
      ]);
      return [...unsplash, ...pexels];
    })
  );

  const nimbleImages = await fetchNimble(extracted.nimbleSearchQuery, 4);

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
  // need keys; Nimble's image search engine may be disabled on the plan).
  // Nimble's plain web search reliably works, so back the board with real
  // article/quote clippings rather than shipping an empty grid.
  if (tiles.length < MIN_BOARD_SIZE) {
    const clippings = await fetchNimbleClippings(
      extracted.nimbleSearchQuery,
      MIN_BOARD_SIZE - tiles.length
    );
    tiles = [...tiles, ...clippings];
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
      const [imageTile] = await fetchNimble(query, 1);
      if (imageTile) return imageTile;
      const [clipping] = await fetchNimbleClippings(query, 1);
      return clipping ?? null;
    }
    case "baseten": {
      const { generateBaseten } = await import("./sources/baseten");
      return generateBaseten(query);
    }
  }
}
