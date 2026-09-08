import { hasSalesforceCreds } from "./env";
import { MoodBoardRecord } from "./types";

/**
 * Logs the brief/keywords/board to a Mood_Board__c record when Salesforce
 * creds are configured. Without creds, this just logs locally so the rest
 * of the flow (generation, export) still works end to end in dev.
 */
export async function syncMoodBoardToSalesforce(
  record: MoodBoardRecord,
  boardUrl?: string
): Promise<{ synced: boolean; id?: string }> {
  if (!hasSalesforceCreds()) {
    console.info("[salesforce] not configured, skipping sync:", record.brief);
    return { synced: false };
  }

  const jsforce = await import("jsforce");
  const conn = new jsforce.Connection({ loginUrl: process.env.SALESFORCE_LOGIN_URL });

  await conn.login(
    process.env.SALESFORCE_USERNAME!,
    `${process.env.SALESFORCE_PASSWORD}${process.env.SALESFORCE_TOKEN}`
  );

  const result = await conn.sobject("Mood_Board__c").create({
    Brief__c: record.brief,
    Stock_Keywords__c: record.extracted.stockKeywords.join(", "),
    Baseten_Prompt__c: record.extracted.basetenPrompt,
    Nimble_Search_Query__c: record.extracted.nimbleSearchQuery,
    Tile_Count__c: record.tileCount,
    Board_Url__c: boardUrl,
  });

  return { synced: true, id: result.id };
}
