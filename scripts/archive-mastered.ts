/**
 * Archive mastered items to JLPT level-based files
 *
 * Usage:
 * Option 1 - Supabase (recommended):
 *   SUPABASE_URL=... SUPABASE_KEY=... DEVICE_ID=... npm run archive
 *
 * Option 2 - Local file:
 *   1. Export from browser: localStorage.getItem('jflash_srs_state')
 *   2. Save to scripts/srs-state.json
 *   3. Run: npm run archive
 */

import * as fs from "fs";
import * as path from "path";

// Load .env file if exists
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

interface SRSState {
  vocab_id: number;
  interval: number;
  ease_factor: number;
  next_review: string;
  reps: number;
}

// Environment variables for Supabase
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_KEY;
const DEVICE_ID = process.env.DEVICE_ID;

/**
 * Fetch SRS states from Supabase
 */
async function fetchFromSupabase(): Promise<Record<number, SRSState> | null> {
  if (!SUPABASE_URL || !SUPABASE_KEY || !DEVICE_ID) {
    return null;
  }

  console.log(`🔄 Fetching SRS data from Supabase...`);
  console.log(`   Device ID: ${DEVICE_ID.substring(0, 8)}...`);

  try {
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/srs_records?device_id=eq.${DEVICE_ID}&select=*`,
      {
        headers: {
          apikey: SUPABASE_KEY,
          Authorization: `Bearer ${SUPABASE_KEY}`,
        },
      }
    );

    if (!response.ok) {
      console.error(`❌ Supabase fetch failed: ${response.status}`);
      return null;
    }

    const data = await response.json();
    const result: Record<number, SRSState> = {};

    for (const record of data) {
      result[record.vocab_id] = {
        vocab_id: record.vocab_id,
        interval: record.interval,
        ease_factor: record.ease_factor,
        next_review: record.next_review,
        reps: record.reps,
      };
    }

    console.log(`✅ Fetched ${Object.keys(result).length} SRS records\n`);
    return result;
  } catch (err) {
    console.error(`❌ Supabase error:`, err);
    return null;
  }
}

const DATA_DIR = path.join(__dirname, "../frontend/public/data");
const WORDS_FILE = path.join(DATA_DIR, "words.json");
const SENTENCES_FILE = path.join(DATA_DIR, "sentences.json");
const MASTERED_DIR = path.join(DATA_DIR, "mastered");
const SRS_STATE_FILE = path.join(__dirname, "srs-state.json");

// Mastered condition
const MASTERED_REPS = 5;
const MASTERED_INTERVAL = 30;

function isMastered(state: SRSState | undefined): boolean {
  if (!state) return false;
  return state.reps >= MASTERED_REPS && state.interval >= MASTERED_INTERVAL;
}

function getJlptLevel(item: VocabItem): string {
  if (!item.jlpt_level) return "unknown";
  const level = item.jlpt_level.toUpperCase();
  if (["N5", "N4", "N3", "N2", "N1"].includes(level)) {
    return level;
  }
  return "unknown";
}

function loadJson<T>(filepath: string): T {
  if (!fs.existsSync(filepath)) {
    return [] as unknown as T;
  }
  return JSON.parse(fs.readFileSync(filepath, "utf-8"));
}

function saveJson(filepath: string, data: unknown): void {
  fs.writeFileSync(filepath, JSON.stringify(data, null, 2), "utf-8");
}

async function main() {
  console.log("📦 Archiving mastered items...\n");

  // Try Supabase first, then fall back to local file
  let srsStates: Record<number, SRSState> = {};

  const supabaseData = await fetchFromSupabase();
  if (supabaseData) {
    srsStates = supabaseData;
  } else if (fs.existsSync(SRS_STATE_FILE)) {
    // Fall back to local file
    console.log("📂 Using local srs-state.json...");
    srsStates = JSON.parse(fs.readFileSync(SRS_STATE_FILE, "utf-8"));
    console.log(`📊 Loaded ${Object.keys(srsStates).length} SRS states\n`);
  } else {
    console.log("⚠️  No SRS data available!");
    console.log("\n   Option 1 - Supabase:");
    console.log("   SUPABASE_URL=... SUPABASE_KEY=... DEVICE_ID=... npm run archive");
    console.log("\n   Option 2 - Local file:");
    console.log("   Export: localStorage.getItem('jflash_srs_state')");
    console.log("   Save to: scripts/srs-state.json");
    console.log("\n   Running in dry-run mode (no archiving)...\n");
  }

  // Load current files
  const words: VocabItem[] = loadJson(WORDS_FILE);
  const sentences: VocabItem[] = loadJson(SENTENCES_FILE);

  // Load existing mastered files
  const masteredByLevel: Record<string, VocabItem[]> = {};
  const levels = ["N5", "N4", "N3", "N2", "N1", "unknown"];
  for (const level of levels) {
    const filepath = path.join(MASTERED_DIR, `${level}.json`);
    masteredByLevel[level] = loadJson(filepath);
  }

  // Combine all items for processing
  const allActive = [...words, ...sentences];
  const allMastered = Object.values(masteredByLevel).flat();
  const allItems = [...allActive, ...allMastered];

  // Remove duplicates by ID
  const uniqueItems = new Map<number, VocabItem>();
  for (const item of allItems) {
    uniqueItems.set(item.id, item);
  }

  // Categorize items
  const newWords: VocabItem[] = [];
  const newSentences: VocabItem[] = [];
  const newMasteredByLevel: Record<string, VocabItem[]> = {
    N5: [],
    N4: [],
    N3: [],
    N2: [],
    N1: [],
    unknown: [],
  };

  let masteredCount = 0;
  let activeCount = 0;

  for (const item of uniqueItems.values()) {
    const state = srsStates[item.id];

    if (isMastered(state)) {
      // Move to mastered
      const level = getJlptLevel(item);
      newMasteredByLevel[level].push(item);
      masteredCount++;
    } else {
      // Keep in active
      if (item.pos === "文") {
        newSentences.push(item);
      } else {
        newWords.push(item);
      }
      activeCount++;
    }
  }

  // Sort by ID
  newWords.sort((a, b) => a.id - b.id);
  newSentences.sort((a, b) => a.id - b.id);
  for (const level of levels) {
    newMasteredByLevel[level].sort((a, b) => a.id - b.id);
  }

  // Save files
  saveJson(WORDS_FILE, newWords);
  console.log(`✅ words.json: ${newWords.length} items`);

  saveJson(SENTENCES_FILE, newSentences);
  console.log(`✅ sentences.json: ${newSentences.length} items`);

  console.log(`\n📁 mastered/`);
  for (const level of levels) {
    const filepath = path.join(MASTERED_DIR, `${level}.json`);
    saveJson(filepath, newMasteredByLevel[level]);
    const count = newMasteredByLevel[level].length;
    if (count > 0) {
      console.log(`   ✅ ${level}.json: ${count} items`);
    } else {
      console.log(`   ⬜ ${level}.json: empty`);
    }
  }

  console.log(`\n📊 Summary:`);
  console.log(`   Active: ${activeCount} (words: ${newWords.length}, sentences: ${newSentences.length})`);
  console.log(`   Mastered: ${masteredCount}`);
  console.log(`\n🎉 Done!`);
}

main().catch(console.error);
