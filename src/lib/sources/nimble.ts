import { hasNimbleKey } from "../env";
import { MoodTile } from "../types";

/**
 * Nimble's SERP/web-search API is account-scoped and its exact response
 * shape can vary by plan. Auth + endpoint are read from env so this can be
 * pointed at whatever pipeline the account dashboard provisions
 * (see NIMBLE_API_URL). If NIMBLE_ACCOUNT_ID is also set, auth uses Basic
 * account:key; otherwise NIMBLE_API_KEY is sent as a bearer token, which is
 * the single-token pattern most Nimble dashboards issue.
 *
 * Confirmed against the live API: a successful parse comes back as
 * `{ parsing: { entities: { <EntityType>: [...] } } }` (PascalCase entity
 * type keys, e.g. "OrganicResult"). The `google_images` search_engine is a
 * recognized value but returned 500s in testing on this account/plan
 * ("can't download the query response") rather than "isn't supported" —
 * likely needs to be enabled on the Nimble dashboard. Parsing below is
 * defensive across a few plausible entity-key names so this starts working
 * the moment that engine responds, and otherwise just yields no tiles
 * instead of throwing.
 */
const IMAGE_ENTITY_KEYS = ["ImageResult", "Image", "InlineImage", "ImagesResult"];

export async function fetchNimble(query: string, count = 4): Promise<MoodTile[]> {
  if (!hasNimbleKey()) return [];

  const endpoint = process.env.NIMBLE_API_URL ?? "https://api.webit.live/api/v1/realtime/serp";
  const authHeader = process.env.NIMBLE_ACCOUNT_ID
    ? `Basic ${Buffer.from(`${process.env.NIMBLE_ACCOUNT_ID}:${process.env.NIMBLE_API_KEY}`).toString("base64")}`
    : `Bearer ${process.env.NIMBLE_API_KEY}`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        Authorization: authHeader,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parse: true,
        search_engine: "google_images",
        query,
      }),
      cache: "no-store",
    });
    if (!res.ok) {
      console.warn(`[nimble] ${res.status} ${res.statusText}: ${await res.text()}`);
      return [];
    }

    const data = await res.json();
    const entities = data?.parsing?.entities ?? {};
    const results: Array<Record<string, unknown>> =
      IMAGE_ENTITY_KEYS.map((key) => entities[key]).find(Array.isArray) ?? [];

    return results.slice(0, count).map((item, i) => {
      const imageUrl = String(item.image ?? item.image_url ?? item.thumbnail ?? item.src ?? "");
      const sourceUrl = String(item.source ?? item.link ?? item.url ?? "");
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
