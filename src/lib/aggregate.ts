import { fetchUnsplash } from "./sources/unsplash";
import { fetchPexels } from "./sources/pexels";
import { fetchNimble, fetchNimbleClippings } from "./sources/nimble";
import { generateBaseten } from "./sources/baseten";
import { ExtractedBrief, ImageSource, MoodTile } from "./types";

const TARGET_BOARD_SIZE = 24;
const MIN_CLIPPINGS = 12;
// Nimble's image-search engine is currently unreliable on this account
// (frequently returns zero results — see nimble.ts), so one Baseten
// generation is folded into every board as a dependable photo source
// alongside it, not just something available on manual regenerate.
// Deliberately just one: this deployment appears to run a single GPU
// replica, so concurrent generations queue behind each other on the same
// GPU rather than running in parallel — 3 at once each took 45s+ and still
// timed out, where 1 alone completes in ~30-35s once warm.
const BASETEN_BOARD_VARIANTS = 1;

/** Alternate two lists so a mix of photos and text cutouts lands in every
 *  part of the board, instead of all the images first and all the text
 *  after (which is what a straight concat would produce). */
function interleave<T>(a: T[], b: T[]): T[] {
  const result: T[] = [];
  const max = Math.max(a.length, b.length);
  for (let i = 0; i < max; i++) {
    if (i < a.length) result.push(a[i]);
    if (i < b.length) result.push(b[i]);
  }
  return result;
}

export async function buildMoodBoard(extracted: ExtractedBrief): Promise<MoodTile[]> {
  // Everything below fires in parallel — stock APIs are near-instant (or a
  // no-op without keys), and Nimble does two independent live scrapes.
  // Running them concurrently instead of sequentially is the single biggest
  // lever on total latency (was image-search-then-clippings, back to back).
  // Requesting more results per call is essentially free — it's still one
  // HTTP round trip either way — so ask generously to fill out a real,
  // busy corkboard rather than a sparse handful of tiles.
  const basetenPromptVariants = [
    extracted.basetenPrompt,
    `${extracted.basetenPrompt}, alternate composition and framing`,
    `${extracted.basetenPrompt}, close-up detail shot`,
  ].slice(0, BASETEN_BOARD_VARIANTS);

  const [keywordBatches, nimbleImages, nimbleClippings, basetenImages] = await Promise.all([
    Promise.all(
      extracted.stockKeywords.map(async (keyword) => {
        const [unsplash, pexels] = await Promise.all([
          fetchUnsplash(keyword, 3),
          fetchPexels(keyword, 3),
        ]);
        return [...unsplash, ...pexels];
      })
    ),
    fetchNimble(extracted.nimbleSearchQuery, 10),
    fetchNimbleClippings(extracted.nimbleSearchQuery, MIN_CLIPPINGS),
    Promise.all(basetenPromptVariants.map((p) => generateBaseten(p))),
  ]);

  const images = [
    ...keywordBatches.flat(),
    ...nimbleImages,
    ...basetenImages.filter((t): t is MoodTile => t !== null),
  ];

  // De-dupe images by URL.
  const seen = new Set<string>();
  const dedupedImages = images.filter((tile) => {
    const url = tile.imageUrl!;
    if (seen.has(url)) return false;
    seen.add(url);
    return true;
  });

  // A real corkboard is photos AND text cutouts together, not photos with
  // text only as filler — interleave so every part of the board gets both.
  let tiles = interleave(dedupedImages, nimbleClippings);

  // Rare last resort: the site:-restricted nimbleSearchQuery can itself
  // occasionally return zero organic results on both engines at once. Retry
  // once with a broader, unrestricted query built from the raw keywords —
  // near-guaranteed to return *something* — rather than shipping an empty
  // board over one narrow query having no matches.
  if (tiles.length === 0) {
    const broadQuery = extracted.stockKeywords.slice(0, 3).join(" ");
    tiles = await fetchNimbleClippings(broadQuery, MIN_CLIPPINGS);
  }

  return tiles.slice(0, TARGET_BOARD_SIZE);
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
      return generateBaseten(query);
    }
  }
}
