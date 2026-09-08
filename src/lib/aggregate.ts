import { fetchUnsplash } from "./sources/unsplash";
import { fetchPexels } from "./sources/pexels";
import { fetchNimble } from "./sources/nimble";
import { ExtractedBrief, ImageSource, MoodTile } from "./types";

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

  const nimbleTiles = await fetchNimble(extracted.nimbleSearchQuery, 4);

  const tiles = [...keywordBatches.flat(), ...nimbleTiles];

  // De-dupe by image URL and cap the board to a sane grid size.
  const seen = new Set<string>();
  return tiles.filter((tile) => {
    if (seen.has(tile.imageUrl)) return false;
    seen.add(tile.imageUrl);
    return true;
  }).slice(0, 16);
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
      const [tile] = await fetchNimble(query, 1);
      return tile ?? null;
    }
    case "baseten": {
      const { generateBaseten } = await import("./sources/baseten");
      return generateBaseten(query);
    }
  }
}
