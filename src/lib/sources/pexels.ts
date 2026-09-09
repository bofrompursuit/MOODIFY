import { hasPexelsKey } from "../env";
import { MoodTile } from "../types";

export async function fetchPexels(query: string, count = 4): Promise<MoodTile[]> {
  if (!hasPexelsKey()) return [];

  const url = new URL("https://api.pexels.com/v1/search");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(count));
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("page", String(1 + Math.floor(Math.random() * 5)));

  const res = await fetch(url, {
    headers: { Authorization: process.env.PEXELS_API_KEY! },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.photos ?? []).map((photo: {
    id: number;
    src: { large: string };
    url: string;
    photographer: string;
    width: number;
    height: number;
  }) => ({
    id: `pexels-${photo.id}`,
    source: "pexels" as const,
    kind: "image" as const,
    imageUrl: photo.src.large,
    sourceUrl: photo.url,
    credit: photo.photographer,
    query,
    width: photo.width,
    height: photo.height,
  }));
}
