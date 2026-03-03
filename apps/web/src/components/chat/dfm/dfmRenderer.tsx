//Discord-Flavored Markdown parser & renderer

import './dfm.css';

import parse from 'html-react-parser';
import type { JSX, ReactNode } from 'react';

import CodeBlock from '@/components/common/codeBlock';
import {
  parseTwemojiWithOverrides,
  resolveEmojiFromShortcode,
  resolveShortcodeFromUnicode,
} from '@/utils/emoji';

import {
  ChannelMention,
  EmojiMention,
  EveryoneMention,
  HereMention,
  InviteMention,
  MemberMention,
  OffsiteMedia,
  RoleMention,
} from './dfmComponents';

type DelimiterRenderer = (
  renderInner: () => JSX.Element,
  innerText: string,
  openingDelimiter: string,
  guild_id: string | undefined,
) => JSX.Element | undefined;

type KeywordRenderer = () => JSX.Element | undefined;

interface Delimiter {
  start: string[];
  end: string[];
  startOfLine?: boolean;
  ignoreEscape?: boolean;
  render: DelimiterRenderer;
}

interface Keyword {
  pre?: string[];
  start: string[];
  startOfLine?: boolean;
  render: KeywordRenderer;
}

type Terminal = Delimiter | Keyword;

interface HtmlTagNode {
  type: string;
  name?: string;
  attribs?: Record<string, string>;
}

const BOUNDARY = '\0';

const DELIMITERS: {
  URL: Delimiter;
  CODEBLOCK: Delimiter;
  CODE1: Delimiter;
  CODE2: Delimiter;
  QUOTE_BLOCK: Delimiter;
  QUOTE_INLINE: Delimiter;
  SUBTEXT: Delimiter;
  HEADER1: Delimiter;
  HEADER2: Delimiter;
  HEADER3: Delimiter;
  BOLDITALICS: Delimiter;
  BOLD: Delimiter;
  ITALICS1: Delimiter;
  ITALICS2: Delimiter;
  STRIKETHROUGH: Delimiter;
  CHANNEL_MENTION: Delimiter;
  ROLE_MENTION: Delimiter;
  MEMBER_MENTION: Delimiter;
  GUILD_EMOJI: Delimiter;
  EMOJI: Delimiter;
} = {
  URL: {
    start: ['https://', 'http://'],
    end: [BOUNDARY, '\n', '"', "'", '`', ')', '(', ']', '[', '}', '{', '<', '>', ',', ';', ' '],
    render: (_render, innerText, openingDelimiter) => {
      innerText = openingDelimiter + innerText;

      const isDirectGif = innerText.toLowerCase().endsWith('.gif');
      const isTenor =
        innerText.includes('tenor.com/view/') ?? innerText.includes('media.tenor.com/');
      const isKlipy = innerText.includes('klipy.com');

      if (isDirectGif || isTenor || isKlipy) {
        return <OffsiteMedia src={innerText} />;
      }

      const inviteRegex = /\/invite\/([a-zA-Z0-9]+)/.exec(innerText);
      const group = inviteRegex?.[1];
      return (
        <>
          <a title={innerText} href={innerText} target='_blank' rel='noreferrer'>
            {innerText}
          </a>
          {group && <InviteMention code={group} />}
        </>
      );
    },
  },
  CODEBLOCK: {
    start: ['```'],
    end: ['```'],
    render: (_render, innerText) => {
      let syntax = '';
      // remove syntax + first new line
      const newlineIndex = innerText.indexOf('\n');

      if (newlineIndex !== -1) {
        const syntaxPart = innerText.slice(0, newlineIndex + 1);
        syntax = syntaxPart.slice(0, -1);
        innerText = innerText.slice(newlineIndex + 1);
      }

      return <CodeBlock language={syntax}>{innerText}</CodeBlock>;
    },
  },
  CODE1: {
    start: ['``'],
    end: ['``'],
    ignoreEscape: true,
    render: (_render, innerText) => {
      return <code className='inline'>{innerText}</code>;
    },
  },
  CODE2: {
    start: ['`'],
    end: ['`'],
    ignoreEscape: true,
    render: (_render, innerText) => {
      return <code className='inline'>{innerText}</code>;
    },
  },
  QUOTE_BLOCK: {
    start: ['>>> '],
    end: [BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return (
        <div className='blockquote-container'>
          <div className='blockquote-divider' />
          <blockquote>{renderInner()}</blockquote>
        </div>
      );
    },
  },
  QUOTE_INLINE: {
    start: ['> '],
    end: ['\n', BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return (
        <div className='blockquote-container'>
          <div className='blockquote-divider' />
          <blockquote>{renderInner()}</blockquote>
        </div>
      );
    },
  },
  SUBTEXT: {
    start: ['-# '],
    end: ['\n', BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return <small>{renderInner()}</small>;
    },
  },
  HEADER1: {
    start: ['# '],
    end: ['\n', BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return <h1>{renderInner()}</h1>;
    },
  },
  HEADER2: {
    start: ['## '],
    end: ['\n', BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return <h2>{renderInner()}</h2>;
    },
  },
  HEADER3: {
    start: ['### '],
    end: ['\n', BOUNDARY],
    startOfLine: true,
    render: (renderInner) => {
      return <h3>{renderInner()}</h3>;
    },
  },
  BOLDITALICS: {
    start: ['***'],
    end: ['***'],
    render: (renderInner) => {
      return (
        <em>
          <strong>{renderInner()}</strong>
        </em>
      );
    },
  },
  BOLD: {
    start: ['**'],
    end: ['**'],
    render: (renderInner) => {
      return <strong>{renderInner()}</strong>;
    },
  },
  ITALICS1: {
    start: ['*'],
    end: ['*'],
    render: (renderInner) => {
      return <em>{renderInner()}</em>;
    },
  },
  ITALICS2: {
    start: ['_'],
    end: ['_'],
    render: (renderInner) => {
      return <em>{renderInner()}</em>;
    },
  },
  STRIKETHROUGH: {
    start: ['~~'],
    end: ['~~'],
    render: (renderInner) => {
      return <s>{renderInner()}</s>;
    },
  },
  CHANNEL_MENTION: {
    start: ['<#'],
    end: ['>'],
    render: (_renderInner, innerText, _openingDelimiter, guild_id) => {
      const channelId = innerText.replace(/^:/, '');
      return <ChannelMention guild_id={guild_id} channel_id={channelId} />;
    },
  },
  ROLE_MENTION: {
    start: ['<@&'],
    end: ['>'],
    render: (_renderInner, innerText, _openingDelimiter, guild_id) => {
      return <RoleMention guild_id={guild_id} role_id={innerText} />;
    },
  },
  MEMBER_MENTION: {
    start: ['<@!', '<@'],
    end: ['>'],
    render: (_renderInner, innerText, _openingDelimiter, guild_id) => {
      return <MemberMention guild_id={guild_id} user_id={innerText} />;
    },
  },
  GUILD_EMOJI: {
    start: ['<a:', '<:'],
    end: ['>'],
    render: (_renderInner, innerText) => {
      const [name, id] = innerText.split(':');
      if (name && id) return <EmojiMention name={name} emoji_id={id} />;
      else return undefined;
    },
  },
  EMOJI: {
    start: [':'],
    end: [':'],
    render: (_renderInner, innerText) => {
      if (innerText) {
        const unicode = resolveEmojiFromShortcode(innerText);
        if (!unicode) return <>{`:${innerText}:`}</>;
        return <EmojiMention name={innerText} unicode={unicode} />;
      } else return undefined;
    },
  },
};

const KEYWORDS: {
  EVERYONE: Keyword;
  HERE: Keyword;
  NEWLINE: Keyword;
} = {
  EVERYONE: {
    start: ['@everyone'],
    render: () => <EveryoneMention />,
  },
  HERE: {
    start: ['@here'],
    render: () => <HereMention />,
  },
  NEWLINE: {
    start: ['\n'],
    render: () => <br></br>,
  },
};

const PARSING_ORDER: Terminal[] = [
  DELIMITERS.URL,
  DELIMITERS.CODEBLOCK,
  DELIMITERS.CODE1,
  DELIMITERS.CODE2,
  DELIMITERS.QUOTE_BLOCK,
  DELIMITERS.QUOTE_INLINE,
  DELIMITERS.SUBTEXT,
  DELIMITERS.HEADER3,
  DELIMITERS.HEADER2,
  DELIMITERS.HEADER1,
  DELIMITERS.BOLDITALICS,
  DELIMITERS.BOLD,
  DELIMITERS.ITALICS1,
  DELIMITERS.ITALICS2,
  DELIMITERS.STRIKETHROUGH,
  KEYWORDS.EVERYONE,
  KEYWORDS.HERE,
  DELIMITERS.CHANNEL_MENTION,
  DELIMITERS.ROLE_MENTION,
  DELIMITERS.MEMBER_MENTION,
  DELIMITERS.GUILD_EMOJI,
  DELIMITERS.EMOJI,
  KEYWORDS.NEWLINE,
];

function find<T>(
  source: string,
  start: number,
  end: number,
  ignoreEscape: boolean,
  test: (index: number) => T,
): { index: number; value: T | null } {
  let i = start;
  while (true) {
    if (i >= end) {
      return {
        index: i,
        value: null,
      };
    }

    if (!ignoreEscape && source[i] == '\\') {
      //escape char
      i += 2;
      continue;
    }

    const stopValue = test(i);
    if (stopValue)
      return {
        index: i,
        value: stopValue,
      };

    i++;
  }
}

export default function renderDfm(
  source: string | null | undefined,
  guild_id: string | undefined,
): JSX.Element {
  if (!source) {
    return <></>;
  } else {
    source = source.replace(/\r\n?/g, '\n').replaceAll(BOUNDARY, '');
    return renderDfmInner(source + BOUNDARY, 0, source.length, guild_id);
  }
}

function renderPlainTextWithEmojiPopout(plainText: string): ReactNode {
  const twemojiHtml = parseTwemojiWithOverrides(plainText, { className: 'emoji' });

  return parse(twemojiHtml, {
    replace: (domNode) => {
      const tagNode = domNode as HtmlTagNode;
      if (tagNode.type !== 'tag' || tagNode.name !== 'img') return;

      const unicode = tagNode.attribs?.alt?.trim();
      if (!unicode) return;

      return (
        <EmojiMention name={resolveShortcodeFromUnicode(unicode) ?? unicode} unicode={unicode} />
      );
    },
  });
}

function renderDfmInner(
  source: string,
  start: number,
  end: number,
  guild_id: string | undefined,
): JSX.Element {
  if (!source) return <></>;

  const result: ReactNode[] = [];
  let index = start;
  while (index < end) {
    const startAcc = find(source, index, end, false, (index2: number) => {
      for (const terminal of PARSING_ORDER) {
        if (
          terminal.startOfLine &&
          !(index2 == 0 || source.endsWith('\n', index2) || source.endsWith('\0', index2))
        )
          continue;

        for (const terminator of terminal.start) {
          if (source.startsWith(terminator, index2)) {
            return { terminal, terminator };
          }
        }
      }
      return null;
    });

    //push plain text (with rendering twemoji)
    if (startAcc.index > index) {
      const plainText = source.substring(index, startAcc.index).replace(BOUNDARY, '');
      result.push(renderPlainTextWithEmojiPopout(plainText));
    }

    if (startAcc.value == null) break; //end

    const openingTerminal = startAcc.value.terminal;
    const openingDelimiter = startAcc.value.terminator;

    //take text up to the first delimiter, and skip it
    index = startAcc.index + openingDelimiter.length;

    if ('end' in openingTerminal) {
      //find closing delimiter
      const closingDelimiters = openingTerminal.end;
      const endAcc = find(source, index, end, openingTerminal.ignoreEscape ?? false, (index2) => {
        for (const terminator of closingDelimiters)
          if (terminator && source.startsWith(terminator, index2)) return terminator;
        return null;
      });

      const closingDelimiter = endAcc.value ?? BOUNDARY;
      if (!closingDelimiters.includes(closingDelimiter)) {
        //not closed. skip the orphan delimiter
        result.push(openingDelimiter);
        continue;
      }

      //take text up to the corresponding end delimiter
      const innerText = source.substring(index, endAcc.index);

      //render
      const rendered = openingTerminal.render(
        () => renderDfmInner(source, index, endAcc.index, guild_id),
        innerText,
        openingDelimiter,
        guild_id,
      );
      if (rendered) result.push(rendered);

      index = endAcc.index + closingDelimiter.length;
    } else {
      //render
      const rendered = openingTerminal.render();
      if (rendered) result.push(rendered);
    }
  }

  return <>{result}</>;
}
