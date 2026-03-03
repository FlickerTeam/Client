import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { resolve } from 'node:path';

import emojiCodePoints from '@unicode/unicode-17.0.0/Binary_Property/Emoji/code-points.js';
import unicodeNames from '@unicode/unicode-17.0.0/Names/index.js';

const require = createRequire(import.meta.url);

const SHORTCODE_SOURCE_PRIORITY = {
  discord: 5,
  emojibase: 4,
  unicode_names: 3,
  other_datasets: 2,
  synonyms: 1,
};

const DISCORD_SHORTCODE_FILES = ['discord', 'joypixels'];
const EMOJIBASE_SHORTCODE_FILES = ['emojibase', 'emojibase-native', 'emojibase-legacy'];
const OTHER_SHORTCODE_FILES = ['cldr', 'cldr-native', 'github', 'slack', 'iamcal'];
const EMOJIBASE_DATA_PATH = 'emojibase-data/en/data.json';

const BUILTIN_CATEGORY_DEFS = [
  { id: 'people', label: 'People', icon: 'mood' },
  { id: 'nature', label: 'Nature', icon: 'pets' },
  { id: 'food', label: 'Food', icon: 'restaurant' },
  { id: 'activity', label: 'Activity', icon: 'sports_esports' },
  { id: 'travel', label: 'Travel', icon: 'directions_car' },
  { id: 'objects', label: 'Objects', icon: 'lightbulb' },
  { id: 'symbols', label: 'Symbols', icon: 'heart_plus' },
  { id: 'flags', label: 'Flags', icon: 'flag' },
];

const CATEGORY_ORDER = new Map(
  BUILTIN_CATEGORY_DEFS.map((category, index) => [category.id, index]),
);

const emojibaseEntries = JSON.parse(readFileSync(require.resolve(EMOJIBASE_DATA_PATH), 'utf8'));

function normalizeShortcode(value) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_+\-\s]/g, '')
    .replace(/[-\s]+/g, '_')
    .replace(/_+/g, '_');
}

function normalizeUnicodeName(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '_');
}

const shortcodeMap = new Map();
const emojiCodePointSet = new Set(emojiCodePoints);

function addShortcode(shortcode, unicode, priority) {
  if (!shortcode || !unicode) return;
  const normalized = normalizeShortcode(shortcode);
  if (!normalized) return;

  const existing = shortcodeMap.get(normalized);
  if (!existing || priority > existing.priority) {
    shortcodeMap.set(normalized, { unicode, priority });
  }
}

function decodeEmojibaseKeyToUnicode(key) {
  const parsed = key
    .split('-')
    .map((part) => Number.parseInt(part, 16))
    .filter(Number.isFinite);
  if (!parsed.length) return '';
  return String.fromCodePoint(...parsed);
}

function loadEmojibaseShortcodes(sources, priority) {
  for (const source of sources) {
    const modulePath = `emojibase-data/en/shortcodes/${source}.json`;
    let filePath = '';
    try {
      filePath = require.resolve(modulePath);
    } catch (error) {
      if (
        error &&
        typeof error === 'object' &&
        'code' in error &&
        error.code === 'MODULE_NOT_FOUND'
      ) {
        continue;
      }
      throw error;
    }

    const content = JSON.parse(readFileSync(filePath, 'utf8'));
    for (const [hexcode, rawAliases] of Object.entries(content)) {
      const unicode = decodeEmojibaseKeyToUnicode(hexcode);
      if (!unicode) continue;
      const aliases = Array.isArray(rawAliases) ? rawAliases : [rawAliases];
      for (const alias of aliases) {
        addShortcode(alias, unicode, priority);
      }
    }
  }
}

function loadEmojibaseAlternateNames(priority) {
  for (const entry of emojibaseEntries) {
    if (!entry?.emoji) continue;

    if (typeof entry.label === 'string') {
      addShortcode(entry.label, entry.emoji, priority);
    }

    if (Array.isArray(entry.tags)) {
      for (const tag of entry.tags) {
        addShortcode(tag, entry.emoji, priority);
      }
    }

    if (typeof entry.emoticon === 'string') {
      addShortcode(entry.emoticon, entry.emoji, priority);
    } else if (Array.isArray(entry.emoticon)) {
      for (const emoticon of entry.emoticon) {
        addShortcode(emoticon, entry.emoji, priority);
      }
    }
  }
}

function mapGroupToCategory(group) {
  if (group === 0 || group === 1 || group === 2) return 'people';
  if (group === 3) return 'nature';
  if (group === 4) return 'food';
  if (group === 5) return 'travel';
  if (group === 6) return 'activity';
  if (group === 7) return 'objects';
  if (group === 8) return 'symbols';
  if (group === 9) return 'flags';
  return 'symbols';
}

function scoreShortcode(shortcode) {
  let score = 0;
  if (!/[a-z]/.test(shortcode)) score += 100;
  if (shortcode.includes('_tone')) score += 50;
  if (/^[0-9_+-]+$/.test(shortcode)) score += 25;
  score += shortcode.length;
  return score;
}

function pickPreferredShortcode(aliases) {
  return [...aliases].sort((a, b) => {
    const priorityDiff = b.priority - a.priority;
    if (priorityDiff !== 0) return priorityDiff;

    const scoreDiff = scoreShortcode(a.name) - scoreShortcode(b.name);
    if (scoreDiff !== 0) return scoreDiff;
    return a.name.localeCompare(b.name);
  })[0].name;
}

loadEmojibaseShortcodes(DISCORD_SHORTCODE_FILES, SHORTCODE_SOURCE_PRIORITY.discord);
loadEmojibaseShortcodes(EMOJIBASE_SHORTCODE_FILES, SHORTCODE_SOURCE_PRIORITY.emojibase);

for (const codePoint of emojiCodePoints) {
  const name = unicodeNames.get(codePoint);
  if (!name) continue;

  const shortcode = normalizeUnicodeName(name);
  addShortcode(shortcode, String.fromCodePoint(codePoint), SHORTCODE_SOURCE_PRIORITY.unicode_names);
}

for (const [codePoint, name] of unicodeNames.entries()) {
  if (!emojiCodePointSet.has(codePoint)) continue;
  addShortcode(name, String.fromCodePoint(codePoint), SHORTCODE_SOURCE_PRIORITY.unicode_names);
}

loadEmojibaseShortcodes(OTHER_SHORTCODE_FILES, SHORTCODE_SOURCE_PRIORITY.other_datasets);
loadEmojibaseAlternateNames(SHORTCODE_SOURCE_PRIORITY.other_datasets);

const sortedEntries = [...shortcodeMap.entries()]
  .map(([shortcode, entry]) => [shortcode, entry.unicode])
  .sort(([a], [b]) => a.localeCompare(b));
const objectLiteral = JSON.stringify(Object.fromEntries(sortedEntries), null, 2);

const emojiMapOutput = `/* Auto-generated by scripts/generateEmojiMap.mjs */\nexport const EMOJI_SHORTCODE_MAP: Record<string, string> = ${objectLiteral};\n`;

const emojiToAliases = new Map();
for (const [shortcode, entry] of shortcodeMap.entries()) {
  const aliases = emojiToAliases.get(entry.unicode) ?? [];
  aliases.push({ name: shortcode, priority: entry.priority });
  emojiToAliases.set(entry.unicode, aliases);
}

const emojibaseOrderMap = new Map();
const emojibaseCategoryMap = new Map();
for (let index = 0; index < emojibaseEntries.length; index += 1) {
  const entry = emojibaseEntries[index];
  if (!entry?.emoji) continue;
  emojibaseOrderMap.set(entry.emoji, typeof entry.order === 'number' ? entry.order : index);
  emojibaseCategoryMap.set(entry.emoji, mapGroupToCategory(entry.group));
}

const categorizedBuiltins = [...emojiToAliases.entries()]
  .map(([unicode, aliases]) => ({
    name: pickPreferredShortcode(aliases),
    unicode,
    category: emojibaseCategoryMap.get(unicode) ?? 'symbols',
    order: emojibaseOrderMap.get(unicode) ?? Number.MAX_SAFE_INTEGER,
  }))
  .sort((a, b) => {
    const categoryDiff =
      (CATEGORY_ORDER.get(a.category) ?? 999) - (CATEGORY_ORDER.get(b.category) ?? 999);
    if (categoryDiff !== 0) return categoryDiff;
    if (a.order !== b.order) return a.order - b.order;
    return a.name.localeCompare(b.name);
  });

const builtinCategories = BUILTIN_CATEGORY_DEFS.map((category) => ({
  ...category,
  emojis: categorizedBuiltins
    .filter((emoji) => emoji.category === category.id)
    .map(({ name, unicode }) => ({ name, unicode })),
})).filter((category) => category.emojis.length > 0);

const categoriesLiteral = JSON.stringify(builtinCategories, null, 2);

const emojiCategoriesOutput = `/* Auto-generated by scripts/generateEmojiMap.mjs */\nexport interface BuiltinCategoryEmoji {\n  name: string;\n  unicode: string;\n}\n\nexport interface BuiltinEmojiCategory {\n  id: 'people' | 'nature' | 'food' | 'activity' | 'travel' | 'objects' | 'symbols' | 'flags';\n  label: string;\n  icon: string;\n  emojis: BuiltinCategoryEmoji[];\n}\n\nexport const BUILTIN_EMOJI_CATEGORIES: BuiltinEmojiCategory[] = ${categoriesLiteral};\n`;

const emojiMapTarget = resolve('src/generated/emojiMap.ts');
const emojiCategoriesTarget = resolve('src/generated/emojiCategories.ts');
writeFileSync(emojiMapTarget, emojiMapOutput, 'utf8');
writeFileSync(emojiCategoriesTarget, emojiCategoriesOutput, 'utf8');

console.log(
  `Generated ${sortedEntries.length} shortcodes (${emojiToAliases.size} unique emojis) to ${emojiMapTarget} and ${emojiCategoriesTarget}`,
);
