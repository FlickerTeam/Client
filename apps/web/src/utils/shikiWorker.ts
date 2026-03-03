import type { LanguageInput, ThemeInput } from '@shikijs/types';
import { logger } from 'shared';
import { createHighlighterCore } from 'shiki/core';
import { createJavaScriptRegexEngine } from 'shiki/engine/javascript';
import { bundledLanguages, bundledLanguagesAlias } from 'shiki/langs';

let highlighter: Awaited<ReturnType<typeof createHighlighterCore>> | null = null;
const loaded = { langs: new Set<string>(), themes: new Set<string>() };

const DEFAULT_THEME_DARK = 'flicker-shiki-dark';

const flickerShikiDarkTheme: ThemeInput = {
  name: DEFAULT_THEME_DARK,
  type: 'dark',
  colors: {
    'editor.background': '#2b2d31',
    'editor.foreground': '#c0caf5',
  },
  tokenColors: [
    { scope: ['comment', 'punctuation.definition.comment'], settings: { foreground: '#565f89' } },
    { scope: ['string', 'meta.embedded.assembly'], settings: { foreground: '#2ccf70' } },
    {
      scope: ['constant.numeric', 'constant.language', 'constant.character', 'constant.other'],
      settings: { foreground: '#f0b232' },
    },
    { scope: ['variable', 'identifier'], settings: { foreground: '#a9b1d6' } },
    {
      scope: ['keyword', 'storage', 'storage.type', 'entity.name.tag'],
      settings: { foreground: '#bb9af7' },
    },
    {
      scope: ['entity.name.function', 'support.function', 'meta.function-call'],
      settings: { foreground: '#7aa2f7' },
    },
    {
      scope: ['entity.name.type', 'support.class', 'support.type', 'meta.type.annotation'],
      settings: { foreground: '#7ad4f7' },
    },
    {
      scope: ['entity.name.namespace', 'entity.other.attribute-name'],
      settings: { foreground: '#2bd9e9' },
    },
    { scope: ['punctuation', 'meta.brace', 'meta.delimiter'], settings: { foreground: '#666b81' } },
    { scope: ['invalid', 'invalid.illegal'], settings: { foreground: '#f23f43' } },
  ],
};

async function getHighlighter() {
  if (highlighter) return highlighter;

  highlighter = await createHighlighterCore({
    themes: [flickerShikiDarkTheme],
    langs: [],
    engine: createJavaScriptRegexEngine(),
  });
  loaded.themes.add(DEFAULT_THEME_DARK);
  return highlighter;
}

function normalizeLang(language?: string): string {
  const normalized = language?.trim().toLowerCase() ?? '';
  if (!normalized) return 'text';
  return normalized.split(/\s+/)[0] ?? 'text';
}

function escapeHtml(input: string): string {
  return input
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

self.onmessage = async (e: MessageEvent) => {
  const {
    id,
    text,
    language,
    theme: rawTheme = DEFAULT_THEME_DARK,
  } = e.data as {
    id: string;
    text: string;
    language?: string;
    theme?: string;
  };

  try {
    const hl = await getHighlighter();
    const normalizedLanguage = normalizeLang(language);
    const normalizedTheme = rawTheme.trim().toLowerCase();

    if (normalizedLanguage !== 'text' && !loaded.langs.has(normalizedLanguage)) {
      try {
        const importer =
          bundledLanguages[normalizedLanguage as keyof typeof bundledLanguages] ??
          bundledLanguagesAlias[normalizedLanguage as keyof typeof bundledLanguagesAlias];
        if (importer) {
          const mod = await importer();
          await hl.loadLanguage(((mod as { default?: unknown }).default ?? mod) as LanguageInput);
          loaded.langs.add(normalizedLanguage);
        } else {
          logger.warn(`Shiki`, `Language "${normalizedLanguage}" not found, falling back to text`);
        }
      } catch {
        logger.warn(`Shiki`, `Language "${normalizedLanguage}" not found, falling back to text`);
      }
    }

    const loadedLanguage = normalizedLanguage === 'text' || loaded.langs.has(normalizedLanguage);
    const selectedTheme = loaded.themes.has(normalizedTheme) ? normalizedTheme : DEFAULT_THEME_DARK;
    const html = hl.codeToHtml(text, {
      lang: loadedLanguage ? normalizedLanguage : 'text',
      theme: selectedTheme,
    });
    self.postMessage({ id, html });
  } catch {
    self.postMessage({ id, html: `<pre><code>${escapeHtml(text)}</code></pre>` });
  }
};
