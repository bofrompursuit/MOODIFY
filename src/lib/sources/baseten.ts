import { hasBasetenKey } from "../env";
import { MoodTile } from "../types";

/**
 * Baseten model endpoints are per-deployment (FLUX/SD truss), so the exact
 * URL lives in BASETEN_MODEL_URL (e.g. https://model-xxxx.api.baseten.co/production/predict).
 * Response parsing accepts either a base64 payload (common for image trusses)
 * or a hosted URL, since that varies by which model template was deployed.
 */
// A cold model instance can take minutes to load; bound the wait so a cold
// start contributes nothing rather than stalling the whole board past the
// route's maxDuration. Once warm this model responds in ~30-35s, so this
// needs real headroom above that — not just enough for a fast API call.
// Callers should treat a null return as "skip it."
const BASETEN_TIMEOUT_MS = 45_000;

export async function generateBaseten(prompt: string): Promise<MoodTile | null> {
  if (!hasBasetenKey()) return null;

  try {
    const res = await fetch(process.env.BASETEN_MODEL_URL!, {
      method: "POST",
      headers: {
        Authorization: `Api-Key ${process.env.BASETEN_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt, width: 1024, height: 1280 }),
      cache: "no-store",
      signal: AbortSignal.timeout(BASETEN_TIMEOUT_MS),
    });
    if (!res.ok) {
      console.warn(`[baseten] ${res.status} ${res.statusText}: ${await res.text()}`);
      return null;
    }

    const data = await res.json();
    const b64: string | undefined = data?.data ?? data?.output?.[0] ?? data?.images?.[0];
    const hostedUrl: string | undefined = data?.url ?? data?.output_url;

    // This deployment returns JPEG bytes in `data` (confirmed against the
    // live endpoint), not PNG — mislabeling the data URI's MIME type is
    // usually harmless (browsers sniff the real format) but worth getting
    // right rather than relying on that leniency.
    const imageUrl = hostedUrl ?? (b64 ? `data:image/jpeg;base64,${b64}` : undefined);
    if (!imageUrl) {
      console.warn("[baseten] response had no recognizable image field:", Object.keys(data ?? {}));
      return null;
    }

    return {
      // Random suffix avoids id collisions when several are generated in
      // parallel (Date.now() alone isn't unique enough for that).
      id: `baseten-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      source: "baseten",
      kind: "image",
      imageUrl,
      query: prompt,
      width: 1024,
      height: 1280,
    };
  } catch (err) {
    console.warn("[baseten] request failed:", err instanceof Error ? err.message : err);
    return null;
  }
}
