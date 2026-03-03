import type { Channel } from './channel';
import type { Command } from './command';
import type { Emoji, Member, Role } from './guilds';

export enum SuggestionsType {
  USER,
  EMOJI,
  ROLE,
  CHANNEL,
  COMMAND,
}

export interface SuggestionsTrigger {
  type: SuggestionsType;
  query: string;
  startIndex: number;
}

export interface Suggestion {
  name: string;
  suggestionType: SuggestionsType;
  isSpecial?: boolean;
  user?: Member | null;
  emoji?: Emoji | string | null;
  role?: Role | null;
  channel?: Channel | null;
  command?: Command | null;
  sourceGuildName?: string | undefined;
  description: string;
}
