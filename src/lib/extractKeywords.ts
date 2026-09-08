import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { hasAnthropicKey } from "./env";
import { ExtractedBrief } from "./types";

const ExtractedBriefSchema = z.object({
  stock_keywords: z.array(z.string()).min(3).max(8),
  baseten_prompt: z.string(),
  nimble_search_query: z.string(),
});

const STOPWORDS = new Set([
  "a", "an", "the", "and", "or", "with", "for", "of", "in", "on", "to",
  "is", "are", "very", "some", "that", "this",
]);

function heuristicExtract(brief: string): ExtractedBrief {
  const words = brief
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOPWORDS.has(w));

  // Build 2-word phrases as keywords, falling back to single words.
  const phrases: string[] = [];
  for (let i = 0; i < words.length - 1 && phrases.length < 6; i += 2) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  if (phrases.length < 3) phrases.push(...words.slice(0, 6));

  const keywords = Array.from(new Set(phrases)).slice(0, 6);

  return {
    stockKeywords: keywords.length ? keywords : [brief.trim() || "mood board"],
    basetenPrompt: `Cinematic editorial photograph, ${brief}, 8k, professional lighting`,
    nimbleSearchQuery: `site:pinterest.com ${brief} aesthetic moodboard`,
  };
}

export async function extractBrief(brief: string): Promise<ExtractedBrief> {
  if (!hasAnthropicKey()) {
    return heuristicExtract(brief);
  }

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 512,
    messages: [
      {
        role: "user",
        content: `You extract structured visual search data from a creative brief for a mood board generator.

Creative brief: "${brief}"

Respond with ONLY a JSON object (no markdown fences, no commentary) matching this shape:
{
  "stock_keywords": ["5-6 short, targeted stock-photo search phrases"],
  "baseten_prompt": "one detailed cinematic image-generation prompt capturing the brief",
  "nimble_search_query": "one web search query, using site: filters where useful, to discover real-world imagery beyond stock platforms"
}`,
      },
    ],
  });

  const textBlock = message.content.find((b) => b.type === "text");
  if (!textBlock || textBlock.type !== "text") {
    return heuristicExtract(brief);
  }

  try {
    const jsonMatch = textBlock.text.match(/\{[\s\S]*\}/);
    const parsed = JSON.parse(jsonMatch ? jsonMatch[0] : textBlock.text);
    const validated = ExtractedBriefSchema.parse(parsed);
    return {
      stockKeywords: validated.stock_keywords,
      basetenPrompt: validated.baseten_prompt,
      nimbleSearchQuery: validated.nimble_search_query,
    };
  } catch {
    return heuristicExtract(brief);
  }
}
