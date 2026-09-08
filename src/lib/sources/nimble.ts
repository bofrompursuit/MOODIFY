import { hasNimbleKey } from "../env";
import { MoodTile } from "../types";

/**
 * Nimble's SERP/web-search API is account-scoped and its exact response
 * shape can vary by plan. Auth + endpoint are read from env so this can be
 * pointed at whatever pipeline the account dashboard provisions
 * (see NIMBLE_API_URL). Parsing is defensive: any unexpected shape just
 * yields an empty result instead of throwing.
 */
export async function fetchNimble(query: string, count = 4): Promise<MoodTile[]> {
  if (!hasNimbleKey()) return [];

  const endpoint = process.env.NIMBLE_API_URL ?? "https://api.webit.live/api/v1/realtime/serp";
  const auth = Buffer.from(
    `${process.env.NIMBLE_ACCOUNT_ID}:${process.env.NIMBLE_API_KEY}`
  ).toString("base64");

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parse: true,
        search_engine: "google_image_search",
        query,
        format: "json",
      }),
      cache: "no-store",
    });
    if (!res.ok) return [];

    const data = await res.json();
    const results: Array<Record<string, unknown>> =
      data?.parsing_result?.images_results ??
      data?.images_results ??
      data?.parsing_result?.entities?.IMAGES ??
      [];

    return results.slice(0, count).map((item, i) => {
      const imageUrl = String(item.image ?? item.thumbnail ?? item.original ?? "");
      const sourceUrl = String(item.source ?? item.link ?? "");
      return {
        id: `nimble-${query}-${i}`,
        source: "nimble" as const,
        imageUrl,
        sourceUrl,
        credit: typeof item.source_name === "string" ? item.source_name : undefined,
        query,
        width: Number(item.width) || 800,
        height: Number(item.height) || 1000,
      };
    }).filter((tile) => tile.imageUrl);
  } catch {
    return [];
  }
}
