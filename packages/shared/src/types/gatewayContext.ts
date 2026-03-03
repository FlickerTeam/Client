import type { Channel, ChannelReadState } from './channel';
import type { GuildMemberListGroup, GuildMemberListOperationItem } from './gateway';
import type { Guild, Member, VoiceState } from './guilds';
import type { Presence, Session } from './presences';
import type { Relationship } from './relationship';
import type { User } from './users';
import type { UserSettings } from './userSettings';

export interface GuildMemberListState {
  id: string;
  items: GuildMemberListOperationItem[];
  groups: GuildMemberListGroup[];
  member_count: number;
  online_count?: number;
  partial?: boolean;
}

export interface GatewayContextSchema {
  isReady: boolean | null;
  guilds: Guild[] | [];
  user: User | null;
  relationships: Relationship[] | [];
  user_settings: UserSettings | null;
  sessions: Session[];
  presences: Record<string, Presence>;
  voiceStates: Record<string, VoiceState>;
  privateChannels: Channel[] | [];
  readStates: ChannelReadState[] | [];
  requestMembers: (guildId: string, channelId: string, ranges?: number[][]) => void;
  getMember: (
    guild_id: string | null | undefined,
    user_id: string | null | undefined,
  ) => Member | null;
  getMemberColor: (member: Member, guild?: Guild | null) => string | undefined;
  getPresence: (userId: string | undefined) => Presence | null;
  typingUsers: Record<string, Record<string, number>>;
  memberLists?: Record<string, GuildMemberListState>;
  updateReadState: (channelId: string, messageId: string) => void;
  memberListsRef?: React.RefObject<Record<string, GuildMemberListState> | undefined>;
  sendOp?: (op: number, d: unknown) => void;
}
