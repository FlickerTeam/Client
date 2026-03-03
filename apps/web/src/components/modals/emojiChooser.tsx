import './emojiChooser.css';

import parse from 'html-react-parser';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { EmojiChooserEmoji } from 'shared';
import type { Guild } from 'shared';

import Scroller from '@/components/common/scroller';
import { useConfig } from '@/context/configContext';
import { BUILTIN_EMOJI_CATEGORIES } from '@/generated/emojiCategories';
import { parseTwemojiWithOverrides, resolveShortcodesFromUnicode } from '@/utils/emoji';

interface EmojiChooserProps {
  guilds: Guild[];
  onSelectEmoji: (emoji: EmojiChooserEmoji) => void;
  onClose: () => void;
  currentGuildId?: string;
}

interface UsedEmoji {
  id?: string;
  unicode?: string;
  name: string;
  animated?: boolean;
  require_colons?: boolean;
  count: number;
  lastUsed: number;
  isBuiltin?: boolean;
}

const FREQUENTLY_USED_LIMIT = 32;

const normalizeSearchTerm = (value: string): string =>
  value.toLowerCase().replace(/:/g, ' ').replace(/_/g, ' ').replace(/\s+/g, ' ').trim();

const matchesEmojiSearch = (
  emojiName: string,
  normalizedQuery: string,
  emojiUnicode?: string,
): boolean => {
  if (!normalizedQuery) return true;
  if (normalizeSearchTerm(emojiName).includes(normalizedQuery)) return true;
  if (!emojiUnicode) return false;

  return resolveShortcodesFromUnicode(emojiUnicode).some((alias) =>
    normalizeSearchTerm(alias).includes(normalizedQuery),
  );
};

const getFrequentlyUsedEmojis = (): UsedEmoji[] => {
  const raw = localStorage.getItem('frequentlyUsedEmojis');
  if (!raw) return [];
  try {
    return JSON.parse(raw) as UsedEmoji[];
  } catch (error) {
    console.error('Failed to parse frequentlyUsedEmojis', error);
    return [];
  }
};

const trackEmojiUsage = (emoji: EmojiChooserEmoji): void => {
  let used = getFrequentlyUsedEmojis();
  const now = Date.now();

  const existingIndex = used.findIndex(
    (existingEmoji) =>
      (emoji.id !== undefined && existingEmoji.id === emoji.id) ||
      ('unicode' in emoji &&
        emoji.unicode !== undefined &&
        existingEmoji.unicode === emoji.unicode),
  );

  if (existingIndex !== -1) {
    const existing = used[existingIndex];
    if (existing) {
      existing.count += 1;
      existing.lastUsed = now;
    }
  } else {
    used.push({ ...emoji, count: 1, lastUsed: now });
  }

  if (used.length > 100) {
    used = used.sort((a, b) => b.count - a.count).slice(0, 100);
  }

  localStorage.setItem('frequentlyUsedEmojis', JSON.stringify(used));
};

export const EmojiChooser = ({
  guilds,
  onSelectEmoji,
  onClose,
  currentGuildId,
}: EmojiChooserProps) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeGuildId, setActiveGuildId] = useState<string | null>(null);
  const { cdnUrl } = useConfig();
  const normalizedQuery = useMemo(() => normalizeSearchTerm(searchQuery), [searchQuery]);

  const [scrollerElement, setScrollerElement] = useState<HTMLElement | null>(null);
  const sectionRefs = useRef<Record<string, HTMLDivElement | null>>({});

  const frequentlyUsedEmojis = useMemo(() => {
    const parsed = getFrequentlyUsedEmojis();
    return parsed
      .sort((a, b) => b.count - a.count || b.lastUsed - a.lastUsed)
      .slice(0, FREQUENTLY_USED_LIMIT);
  }, []);

  const filteredFrequentlyUsed = useMemo(() => {
    if (!normalizedQuery) return frequentlyUsedEmojis;
    return frequentlyUsedEmojis.filter((e) =>
      matchesEmojiSearch(e.name, normalizedQuery, e.unicode),
    );
  }, [frequentlyUsedEmojis, normalizedQuery]);

  const sortedGuilds = useMemo(() => {
    const list = [...guilds];
    if (currentGuildId) {
      const index = list.findIndex((g) => g.id === currentGuildId);
      if (index !== -1) {
        const [current] = list.splice(index, 1);
        if (current) {
          list.unshift(current);
        }
      }
    }
    return list;
  }, [guilds, currentGuildId]);

  const guildsWithEmojis = useMemo(() => {
    return sortedGuilds
      .map((g) => {
        let emojis = g.emojis || [];

        if (normalizedQuery) {
          emojis = emojis.filter((e) => matchesEmojiSearch(e.name, normalizedQuery));
        }

        const sortedEmojis = [...emojis].sort((a, b) => {
          const countA = frequentlyUsedEmojis.find((e) => e.id === a.id)?.count || 0;
          const countB = frequentlyUsedEmojis.find((e) => e.id === b.id)?.count || 0;

          if (countA !== countB) return countB - countA;

          const idA = BigInt(a.id);
          const idB = BigInt(b.id);
          return idB > idA ? 1 : -1;
        });

        return {
          ...g,
          emojis: sortedEmojis,
        };
      })
      .filter((g) => g.emojis && g.emojis.length > 0);
  }, [sortedGuilds, normalizedQuery, frequentlyUsedEmojis]);

  const builtinSections = useMemo(() => {
    return BUILTIN_EMOJI_CATEGORIES.map((category) => ({
      ...category,
      sectionId: `__builtin_${category.id}__`,
      emojis: category.emojis
        .filter((emoji) => matchesEmojiSearch(emoji.name, normalizedQuery, emoji.unicode))
        .map((emoji) => ({ ...emoji, isBuiltin: true as const })),
    })).filter((section) => section.emojis.length > 0);
  }, [normalizedQuery]);

  const scrollToGuild = (guildId: string) => {
    setActiveGuildId(guildId);
    const target = sectionRefs.current[guildId];

    if (target && scrollerElement) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  useEffect(() => {
    if (!scrollerElement) return;

    const observerOptions = {
      root: scrollerElement,
      threshold: 0,
      rootMargin: '0px 0px -80% 0px',
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) {
          setActiveGuildId(entry.target.getAttribute('data-guild-id'));
        }
      });
    }, observerOptions);

    const handleScroll = () => {
      const isAtBottom =
        Math.ceil(scrollerElement.scrollTop + scrollerElement.clientHeight) >=
        scrollerElement.scrollHeight - 10;
      if (isAtBottom) {
        const lastBuiltinSection = builtinSections.at(-1);
        const lastGuildSection = guildsWithEmojis.at(-1);
        const lastSectionId = lastBuiltinSection?.sectionId ?? lastGuildSection?.id ?? null;

        if (lastSectionId) {
          setActiveGuildId(lastSectionId);
        }
      }
    };

    scrollerElement.addEventListener('scroll', handleScroll);

    const currentRefs = sectionRefs.current;

    Object.values(currentRefs).forEach((ref) => {
      if (ref) {
        observer.observe(ref);
      }
    });

    return () => {
      observer.disconnect();
      scrollerElement.removeEventListener('scroll', handleScroll);
    };
  }, [scrollerElement, builtinSections, guildsWithEmojis]);

  const handleSelect = (emoji: EmojiChooserEmoji) => {
    trackEmojiUsage(emoji);
    onSelectEmoji(emoji);
    onClose();
  };

  return (
    <div className='emoji-chooser-container' key={'EmojiChooser9000'}>
      <div className='emoji-chooser-header'>
        <div className='search-bar'>
          <input
            type='text'
            placeholder='Search emojis'
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
            }}
          />
          <span className='material-symbols-rounded search-icon'>search</span>
        </div>
      </div>

      <Scroller
        element='div'
        className='emoji-chooser-content scroller'
        ref={(os) => {
          if (os) {
            const instance = os.osInstance();
            if (instance) {
              const { scrollOffsetElement } = instance.elements();
              setScrollerElement(scrollOffsetElement);
            }
          }
        }}
      >
        {filteredFrequentlyUsed.length > 0 && (
          <div
            className='emoji-section'
            data-guild-id='frequently_used'
            ref={(el) => {
              sectionRefs.current.frequently_used = el;
            }}
          >
            <div className='section-header section-header-builtin'>
              <span className='material-symbols-rounded'>history</span>
              <span>FREQUENTLY USED</span>
            </div>
            <div className='emoji-grid'>
              {filteredFrequentlyUsed.map((emoji) => (
                <div
                  key={emoji.id || emoji.unicode}
                  className={`emoji-item ${emoji.isBuiltin ? 'emoji-item-builtin' : ''}`}
                  title={`:${emoji.name}:`}
                  onClick={() => {
                    handleSelect(emoji);
                  }}
                >
                  {emoji.isBuiltin && emoji.unicode ? (
                    <span className='emoji-builtin-preview'>
                      {parse(
                        parseTwemojiWithOverrides(emoji.unicode, {
                          className: 'emoji-builtin-img',
                        }),
                      )}
                    </span>
                  ) : emoji.id ? (
                    <img
                      src={`${cdnUrl ?? ''}/emojis/${emoji.id}.png`}
                      alt={emoji.name}
                      loading='lazy'
                    />
                  ) : null}
                </div>
              ))}
            </div>
          </div>
        )}

        {guildsWithEmojis.map((guild) => (
          <div
            key={guild.id}
            className='emoji-section'
            data-guild-id={guild.id}
            ref={(el) => {
              sectionRefs.current[guild.id] = el;
            }}
          >
            <div className='section-header'>
              {guild.icon ? (
                <img
                  src={`${cdnUrl ?? ''}/icons/${guild.id}/${guild.icon}.png`}
                  alt=''
                  className='section-guild-icon'
                />
              ) : (
                <div className='section-guild-icon-fallback'>{guild.name[0]}</div>
              )}
              {guild.name.toUpperCase()}
            </div>
            <div className='emoji-grid'>
              {guild.emojis?.map((emoji) => (
                <div
                  key={emoji.id}
                  className='emoji-item'
                  title={`:${emoji.name}:`}
                  onClick={() => {
                    handleSelect(emoji);
                  }}
                >
                  <img
                    src={`${cdnUrl ?? ''}/emojis/${emoji.id}.png`}
                    alt={emoji.name}
                    loading='lazy'
                  />
                </div>
              ))}
            </div>
          </div>
        ))}
        {builtinSections.map((section) => (
          <div
            key={section.sectionId}
            className='emoji-section'
            data-guild-id={section.sectionId}
            ref={(el) => {
              sectionRefs.current[section.sectionId] = el;
            }}
          >
            <div className='section-header section-header-builtin'>
              <span className='material-symbols-rounded'>{section.icon}</span>
              <span>{section.label.toUpperCase()}</span>
            </div>
            <div className='emoji-grid'>
              {section.emojis.map((emoji) => (
                <div
                  key={`${emoji.name}-${emoji.unicode}`}
                  className='emoji-item emoji-item-builtin'
                  title={`:${emoji.name}:`}
                  onClick={() => {
                    handleSelect(emoji);
                  }}
                >
                  <span className='emoji-builtin-preview'>
                    {parse(
                      parseTwemojiWithOverrides(emoji.unicode, {
                        className: 'emoji-builtin-img',
                      }),
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </Scroller>
      <div className='emoji-chooser-footer'>
        <Scroller element='div' className='footer-nav-scroll'>
          <div className='footer-nav-container'>
            {filteredFrequentlyUsed.length > 0 && (
              <span
                className={`material-symbols-rounded nav-icon ${activeGuildId === 'frequently_used' ? 'active' : ''}`}
                title='Frequently Used'
                onClick={() => {
                  scrollToGuild('frequently_used');
                }}
              >
                history
              </span>
            )}
            {guildsWithEmojis.map((guild) => (
              <div
                key={guild.id}
                className={`nav-guild-icon ${activeGuildId === guild.id ? 'active' : ''}`}
                title={guild.name}
                onClick={() => {
                  scrollToGuild(guild.id);
                }}
              >
                {guild.icon ? (
                  <img
                    src={`${cdnUrl ?? ''}/icons/${guild.id}/${guild.icon}.png`}
                    alt={`${guild.name} icon`}
                    loading='lazy'
                  />
                ) : (
                  <div className='icon-fallback'>{guild.name[0]}</div>
                )}
              </div>
            ))}
            {builtinSections.map((section) => (
              <span
                key={section.sectionId}
                className={`material-symbols-rounded nav-icon ${activeGuildId === section.sectionId ? 'active' : ''}`}
                title={section.label}
                onClick={() => {
                  scrollToGuild(section.sectionId);
                }}
              >
                {section.icon}
              </span>
            ))}
          </div>
        </Scroller>
      </div>
    </div>
  );
};
