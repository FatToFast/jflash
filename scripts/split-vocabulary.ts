/**
 * Split vocabulary.json into words.json and sentences.json
 * Also creates empty mastered folder structure
 */

import * as fs from "fs";
import * as path from "path";

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

const DATA_DIR = path.join(__dirname, "../frontend/public/data");
const VOCABULARY_FILE = path.join(DATA_DIR, "vocabulary.json");
const WORDS_FILE = path.join(DATA_DIR, "words.json");
const SENTENCES_FILE = path.join(DATA_DIR, "sentences.json");
const MASTERED_DIR = path.join(DATA_DIR, "mastered");

const JLPT_LEVELS = ["N5", "N4", "N3", "N2", "N1", "unknown"];

function main() {
  console.log("📚 Splitting vocabulary.json...\n");

  // Read vocabulary.json
  if (!fs.existsSync(VOCABULARY_FILE)) {
    console.error("❌ vocabulary.json not found!");
    process.exit(1);
  }

  const vocabulary: VocabItem[] = JSON.parse(
    fs.readFileSync(VOCABULARY_FILE, "utf-8")
  );
  console.log(`📖 Loaded ${vocabulary.length} items from vocabulary.json`);

  // Split by pos
  const words = vocabulary.filter((item) => item.pos !== "文");
  const sentences = vocabulary.filter((item) => item.pos === "文");

  console.log(`\n📊 Split results:`);
  console.log(`   - Words: ${words.length}`);
  console.log(`   - Sentences: ${sentences.length}`);

  // Write words.json
  fs.writeFileSync(WORDS_FILE, JSON.stringify(words, null, 2), "utf-8");
  console.log(`\n✅ Created words.json (${words.length} items)`);

  // Write sentences.json
  fs.writeFileSync(SENTENCES_FILE, JSON.stringify(sentences, null, 2), "utf-8");
  console.log(`✅ Created sentences.json (${sentences.length} items)`);

  // Create mastered folder
  if (!fs.existsSync(MASTERED_DIR)) {
    fs.mkdirSync(MASTERED_DIR, { recursive: true });
    console.log(`\n📁 Created mastered/ folder`);
  }

  // Create empty JLPT level files
  for (const level of JLPT_LEVELS) {
    const levelFile = path.join(MASTERED_DIR, `${level}.json`);
    if (!fs.existsSync(levelFile)) {
      fs.writeFileSync(levelFile, "[]", "utf-8");
      console.log(`   ✅ Created mastered/${level}.json`);
    } else {
      console.log(`   ⏭️  mastered/${level}.json already exists`);
    }
  }

  console.log(`\n🎉 Done! You can now delete vocabulary.json`);
  console.log(`   rm frontend/public/data/vocabulary.json`);
}

main();
