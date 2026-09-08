export type ImageSource = "unsplash" | "pexels" | "nimble" | "baseten";

export interface MoodTile {
  id: string;
  source: ImageSource;
  imageUrl: string;
  /** Original page/attribution URL, if the source provides one. */
  sourceUrl?: string;
  /** Photographer / creator credit, if available. */
  credit?: string;
  /** The search term or prompt that produced this tile, kept for regeneration. */
  query: string;
  width: number;
  height: number;
}

export interface ExtractedBrief {
  stockKeywords: string[];
  basetenPrompt: string;
  nimbleSearchQuery: string;
}

export interface PresetChip {
  label: string;
  brief: string;
}

export interface MoodBoardRecord {
  brief: string;
  extracted: ExtractedBrief;
  tileCount: number;
  createdAt: string;
}
