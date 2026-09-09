import { hasUnsplashKey } from "../env";
import { MoodTile } from "../types";

export async function fetchUnsplash(query: string, count = 4): Promise<MoodTile[]> {
  if (!hasUnsplashKey()) return [];

  const url = new URL("https://api.unsplash.com/search/photos");
  url.searchParams.set("query", query);
  url.searchParams.set("per_page", String(count));
  url.searchParams.set("orientation", "portrait");
  url.searchParams.set("page", String(1 + Math.floor(Math.random() * 5)));

  const res = await fetch(url, {
    headers: { Authorization: `Client-ID ${process.env.UNSPLASH_ACCESS_KEY}` },
    cache: "no-store",
  });
  if (!res.ok) return [];

  const data = await res.json();
  return (data.results ?? []).map((photo: {
    id: string;
    urls: { regular: string };
    links: { html: string };
    user: { name: string };
    width: number;
    height: number;
  }) => ({
    id: `unsplash-${photo.id}`,
    source: "unsplash" as const,
    kind: "image" as const,
    imageUrl: photo.urls.regular,
    sourceUrl: photo.links.html,
    credit: photo.user?.name,
    query,
    width: photo.width,
    height: photo.height,
  }));
}
