import twemoji, { type TwemojiOptions } from '@twemoji/api';
import { webAssets } from 'shared';

import { EMOJI_SHORTCODE_MAP } from '@/generated/emojiMap';

function normalizeShortcode(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9_+\-\s]/g, '')
    .replace(/[-\s]+/g, '_')
    .replace(/_+/g, '_');
}

const SHORTCODE_TO_UNICODE = new Map<string, string>(
  Object.entries(EMOJI_SHORTCODE_MAP).map(([shortcode, unicode]) => [
    normalizeShortcode(shortcode),
    unicode,
  ]),
);

function normalizeUnicodeEmoji(value: string): string {
  return value.normalize('NFC').replace(/\uFE0F/g, '');
}

const UNICODE_TO_SHORTCODE = new Map<string, string>();
const UNICODE_TO_SHORTCODES = new Map<string, string[]>();
Object.entries(EMOJI_SHORTCODE_MAP).forEach(([shortcode, unicode]) => {
  const normalizedUnicode = normalizeUnicodeEmoji(unicode);
  if (!UNICODE_TO_SHORTCODE.has(normalizedUnicode)) {
    UNICODE_TO_SHORTCODE.set(normalizedUnicode, shortcode);
  }
  const existing = UNICODE_TO_SHORTCODES.get(normalizedUnicode);
  if (existing) {
    existing.push(shortcode);
  } else {
    UNICODE_TO_SHORTCODES.set(normalizedUnicode, [shortcode]);
  }
});

export function resolveEmojiFromShortcode(shortcode: string): string | undefined {
  if (!shortcode) return undefined;
  return SHORTCODE_TO_UNICODE.get(normalizeShortcode(shortcode));
}

export function resolveShortcodeFromUnicode(unicode: string): string | undefined {
  if (!unicode) return undefined;
  return UNICODE_TO_SHORTCODE.get(normalizeUnicodeEmoji(unicode));
}

export function resolveShortcodesFromUnicode(unicode: string): string[] {
  if (!unicode) return [];
  return UNICODE_TO_SHORTCODES.get(normalizeUnicodeEmoji(unicode)) ?? [];
}

const CUSTOM_TWEMOJI_ASSET_MAP: Record<string, string> = {
  '1f52b': webAssets.oldGunTwemoji,
  '1f97a': webAssets.oldPleadingFaceTwemoji,
  '1f3f3-200d-1f308': webAssets.progressivePrideTwemoji,
};

function normalizeIconCode(icon: string): string {
  return icon.toLowerCase().replace(/-fe0f/g, '');
}

export function parseTwemojiWithOverrides(
  value: string | null | undefined,
  options?: Omit<TwemojiOptions, 'callback'>,
): string {
  return twemoji.parse(value ?? '', {
    ...options,
    callback: (icon, parseOptions) => {
      const normalizedIconCode = normalizeIconCode(icon);
      const customAssetUrl = CUSTOM_TWEMOJI_ASSET_MAP[normalizedIconCode];

      if (customAssetUrl) {
        return customAssetUrl;
      }

      const defaultOptions = parseOptions as {
        base: string;
        size: string;
        folder?: string;
        ext: string;
      };
      const folder = defaultOptions.folder ? `${defaultOptions.folder}/` : '';

      return `${defaultOptions.base}${defaultOptions.size}/${folder}${icon}${defaultOptions.ext}`;
    },
  });
}
