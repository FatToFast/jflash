/**
 * Sync JSON files to Supabase
 *
 * Usage (GitHub Actions or local):
 *   SUPABASE_URL=... SUPABASE_SERVICE_KEY=... npm run sync:supabase
 *
 * Reads:
 *   - frontend/public/data/words.json
 *   - frontend/public/data/sentences.json
 *   - frontend/public/data/mastered/*.json
 *
 * Uploads to Supabase vocabulary table with status field
 */

import * as fs from "fs";
import * as path from "path";

// Load .env if exists
const envPath = path.join(__dirname, "../.env");
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith("#")) {
      const [key, ...valueParts] = trimmed.split("=");
      const value = valueParts.join("=");
      if (key && value && !process.env[key]) {
        process.env[key] = value;
      }
    }
  }
}

interface VocabItem {
  id: number;
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  jlpt_level: string | null;
  example_sentence: string | null;
  example_meaning: string | null;
  notes?: string;
}

interface SupabaseVocab {
  id: number;
  kanji: string;
  reading: string | null;
  meaning: string | null;
  pos: string | null;
  jlpt_level: string | null;
  example_sentence: string | null;
  example_meaning: string | null;
  notes: string | null;
  status: "active" | "mastered";
}

/**
 * Normalize a vocab item to ensure all fields are present
 */
function normalizeRecord(item: VocabItem, status: "active" | "mastered"): SupabaseVocab {
  return {
    id: item.id,
    kanji: item.kanji,
    reading: item.reading ?? null,
    meaning: item.meaning ?? null,
    pos: item.pos ?? null,
    jlpt_level: item.jlpt_level ?? null,
    example_sentence: item.example_sentence ?? null,
    example_meaning: item.example_meaning ?? null,
    notes: item.notes ?? null,
    status,
  };
}

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // Service role key for write access

const DATA_DIR = path.join(__dirname, "../frontend/public/data");
const WORDS_FILE = path.join(DATA_DIR, "words.json");
const SENTENCES_FILE = path.join(DATA_DIR, "sentences.json");
const MASTERED_DIR = path.join(DATA_DIR, "mastered");

function loadJson<T>(filepath: string): T {
  if (!fs.existsSync(filepath)) {
    return [] as unknown as T;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

async function upsertToSupabase(records: SupabaseVocab[]): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("Missing SUPABASE_URL or SUPABASE_SERVICE_KEY");
    return false;
  }

  if (records.length === 0) {
    console.log("No records to sync");
    return true;
  }

  // Supabase has a limit on batch size, so we chunk the data
  const BATCH_SIZE = 500;
  const batches: SupabaseVocab[][] = [];

  for (let i = 0; i < records.length; i += BATCH_SIZE) {
    batches.push(records.slice(i, i + BATCH_SIZE));
  }

  console.log(`Uploading ${records.length} records in ${batches.length} batches...`);

  for (let i = 0; i < batches.length; i++) {
    const batch = batches[i];
    console.log(`  Batch ${i + 1}/${batches.length}: ${batch.length} records`);

    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/vocabulary`,
      {
        method: "POST",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
          Prefer: "resolution=merge-duplicates", // Upsert based on primary key
        },
        body: JSON.stringify(batch),
      }
    );

    if (!response.ok) {
      const error = await response.text();
      console.error(`Batch ${i + 1} failed:`, response.status, error);
      return false;
    }
  }

  return true;
}

async function deleteRemovedRecords(validIds: number[]): Promise<boolean> {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    return false;
  }

  // Get all IDs from Supabase
  const response = await fetch(
    `${SUPABASE_URL}/rest/v1/vocabulary?select=id`,
    {
      headers: {
        apikey: SUPABASE_SERVICE_KEY,
        Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
      },
    }
  );

  if (!response.ok) {
    console.error("Failed to fetch existing IDs");
    return false;
  }

  const existing: { id: number }[] = await response.json();
  const existingIds = new Set(existing.map((e) => e.id));
  const validIdSet = new Set(validIds);

  // Find IDs to delete (exist in Supabase but not in JSON)
  const toDelete = [...existingIds].filter((id) => !validIdSet.has(id));

  if (toDelete.length === 0) {
    console.log("No records to delete");
    return true;
  }

  console.log(`Deleting ${toDelete.length} removed records...`);

  // Delete in batches
  const BATCH_SIZE = 100;
  for (let i = 0; i < toDelete.length; i += BATCH_SIZE) {
    const batch = toDelete.slice(i, i + BATCH_SIZE);
    const idsParam = batch.join(",");

    const deleteResponse = await fetch(
      `${SUPABASE_URL}/rest/v1/vocabulary?id=in.(${idsParam})`,
      {
        method: "DELETE",
        headers: {
          apikey: SUPABASE_SERVICE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_KEY}`,
        },
      }
    );

    if (!deleteResponse.ok) {
      console.error("Delete failed:", await deleteResponse.text());
      return false;
    }
  }

  return true;
}

async function main() {
  console.log("🔄 Syncing vocabulary to Supabase...\n");

  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
    console.error("❌ Missing environment variables:");
    console.error("   SUPABASE_URL");
    console.error("   SUPABASE_SERVICE_KEY (service role key)");
    process.exit(1);
  }

  // Load all JSON files
  const words: VocabItem[] = loadJson(WORDS_FILE);
  const sentences: VocabItem[] = loadJson(SENTENCES_FILE);

  console.log(`📂 Loaded:`);
  console.log(`   words.json: ${words.length} items`);
  console.log(`   sentences.json: ${sentences.length} items`);

  // Load mastered files
  const levels = ["N5", "N4", "N3", "N2", "N1", "unknown"];
  const mastered: VocabItem[] = [];

  for (const level of levels) {
    const filepath = path.join(MASTERED_DIR, `${level}.json`);
    const items: VocabItem[] = loadJson(filepath);
    if (items.length > 0) {
      console.log(`   mastered/${level}.json: ${items.length} items`);
      mastered.push(...items);
    }
  }

  // Prepare records with status (normalized to ensure consistent keys)
  const allRecords: SupabaseVocab[] = [
    ...words.map((w) => normalizeRecord(w, "active")),
    ...sentences.map((s) => normalizeRecord(s, "active")),
    ...mastered.map((m) => normalizeRecord(m, "mastered")),
  ];

  console.log(`\n📊 Total: ${allRecords.length} items`);

  // Upload to Supabase
  const uploadSuccess = await upsertToSupabase(allRecords);
  if (!uploadSuccess) {
    console.error("\n❌ Upload failed!");
    process.exit(1);
  }

  // Delete removed records
  const validIds = allRecords.map((r) => r.id);
  const deleteSuccess = await deleteRemovedRecords(validIds);
  if (!deleteSuccess) {
    console.error("\n⚠️ Delete cleanup failed (non-critical)");
  }

  console.log("\n✅ Sync complete!");
}

main().catch((err) => {
  console.error("❌ Error:", err);
  process.exit(1);
});
