import { hasBasetenKey } from "../env";
import { MoodTile } from "../types";

/**
 * Baseten model endpoints are per-deployment (FLUX/SD truss), so the exact
 * URL lives in BASETEN_MODEL_URL (e.g. https://model-xxxx.api.baseten.co/production/predict).
 * Response parsing accepts either a base64 payload (common for image trusses)
 * or a hosted URL, since that varies by which model template was deployed.
 */
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
    });
    if (!res.ok) return null;

    const data = await res.json();
    const b64: string | undefined = data?.data ?? data?.output?.[0] ?? data?.images?.[0];
    const hostedUrl: string | undefined = data?.url ?? data?.output_url;

    const imageUrl = hostedUrl ?? (b64 ? `data:image/png;base64,${b64}` : undefined);
    if (!imageUrl) return null;

    return {
      id: `baseten-${Date.now()}`,
      source: "baseten",
      kind: "image",
      imageUrl,
      query: prompt,
      width: 1024,
      height: 1280,
    };
  } catch {
    return null;
  }
}
