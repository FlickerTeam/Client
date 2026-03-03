import * as z from 'zod';

import { ChannelReadStateSchema, ChannelSchema } from './channel';
import { GuildSchema, MemberSchema, VoiceStateSchema } from './guilds';
import { MessageSchema } from './messages';
import { PresenceSchema, SessionSchema } from './presences';
import { RelationshipSchema } from './relationship';
import { UserSchema } from './users';
import { UserSettingsSchema } from './userSettings';

export const GuildMemberListGroupSchema = z.object({
  id: z.string(),
  count: z.coerce.number().int(),
});

const GuildMemberListOperationItemSchema = z.object({
  group: GuildMemberListGroupSchema.nullish(),
  member: MemberSchema.nullish(),
});

const GuildMemberListOperationSchema = z.discriminatedUnion('op', [
  z.object({
    op: z.literal('SYNC'),
    range: z.tuple([z.coerce.number().int(), z.coerce.number().int()]),
    items: z.array(GuildMemberListOperationItemSchema),
  }),
  z.object({
    op: z.literal('INSERT'),
    index: z.coerce.number().int(),
    item: GuildMemberListOperationItemSchema,
  }),
  z.object({
    op: z.literal('UPDATE'),
    index: z.coerce.number().int(),
    item: GuildMemberListOperationItemSchema,
  }),
  z.object({ op: z.literal('DELETE'), index: z.coerce.number().int() }),
  z.object({
    op: z.literal('INVALIDATE'),
    range: z.tuple([z.coerce.number().int(), z.coerce.number().int()]),
  }),
]);

export const GuildMemberListUpdateSchema = z.object({
  guild_id: z.string(),
  id: z.string(),
  ops: z.array(GuildMemberListOperationSchema),
  groups: z.array(GuildMemberListGroupSchema),
  member_count: z.coerce.number().int().nullish(),
  // Spacebar exclusive,
  online_count: z.coerce.number().int().nullish(),
});

export const HelloSchema = z.object({
  _trace: z.array(z.string()).nullish(),
  heartbeat_interval: z.coerce.number().int(),
});

const PrivateChannelSchema = ChannelSchema.extend({
  name: z.string().nullable().optional(),
  position: z.preprocess((val) => {
    const n = Number(val);
    return isNaN(n) ? 0 : n;
  }, z.number().default(0)),
});

const ReadStateSchema = z.preprocess(
  (val) => {
    if (Array.isArray(val)) {
      return {
        entries: val,
        partial: false,
        version: 0,
      };
    }

    if (!val) {
      return {
        entries: [],
        partial: false,
        version: 0,
      };
    }

    return val;
  },
  z.object({
    entries: z.array(ChannelReadStateSchema).default([]),
    partial: z.boolean().default(false),
    version: z.number().default(0),
  }),
);

// TODO: Implement all ReadyEventSchema
export const ReadyEventSchema = z.looseObject({
  user: UserSchema,
  user_settings: UserSettingsSchema,
  guilds: z.array(GuildSchema),
  relationships: z.array(RelationshipSchema),
  sessions: z.array(SessionSchema).nullish(),
  session_id: z.string(),
  resume_gateway_url: z.string().nullish(),
  private_channels: z.array(PrivateChannelSchema).default([]),
  presences: z.array(PresenceSchema).optional().default([]),
  voice_states: z.array(VoiceStateSchema).optional().default([]),
  read_state: ReadStateSchema,
});

export const MessageCreateSchema = MessageSchema.extend({
  channel_type: z.preprocess((val) => {
    const coerced = Number(val);
    return isNaN(coerced) ? undefined : coerced;
  }, z.int().nullish()),
  guild_id: z.string().nullish(),
  member: MemberSchema.partial().nullish(),
  mentions: z.array(UserSchema.partial()).nullish(),
  metadata: z.map(z.string(), z.string()).nullish(),
  moderation_metadata: z.map(z.string(), z.string()).nullish(),
});

export const MessageUpdateSchema = MessageSchema.extend({
  channel_type: z.preprocess((val) => {
    const coerced = Number(val);
    return isNaN(coerced) ? undefined : coerced;
  }, z.int().nullish()),
  guild_id: z.string().nullish(),
  member: MemberSchema.partial().nullish(),
  mentions: z.array(UserSchema.partial()).nullish(),
  metadata: z.map(z.string(), z.string()).nullish(),
  moderation_metadata: z.map(z.string(), z.string()).nullish(),
  tts: z.preprocess(() => false, z.boolean()), // https://docs.discord.food/topics/gateway-events#message-update -- Check warning
});

export const MessageDeleteSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  guild_id: z.string().nullish(),
});

export const UserUpdateSchema = UserSchema.partial().extend({
  phone: z.string().nullish().optional(),
  nsfw_allowed: z.boolean().optional(),
  premium: z.boolean().nullish(),
  premium_since: z.string().nullish(),
  premium_usage_flags: z.coerce.number().int().nullish().optional(),
  purchased_flags: z.coerce.number().int().nullish().optional(),
});

export const TypingStartSchema = z.object({
  channel_id: z.string(),
  guild_id: z.string().nullish(),
  user_id: z.string(),
  timestamp: z.preprocess((val) => {
    const coerced = Number(val);
    return isNaN(coerced) ? undefined : coerced;
  }, z.int().nullish()),
  member: MemberSchema.nullish(),
});

export const GatewayPayloadSchema = z.object({
  op: z.coerce.number().int(),
  s: z.coerce.number().int().nullish(),
  t: z.string().nullish(),
  d: z.unknown(),
});

export const PresenceUpdateSchema = PresenceSchema;

export type MessageCreate = z.infer<typeof MessageCreateSchema>;
export type MessageUpdate = z.infer<typeof MessageUpdateSchema>;
export type MessageDelete = z.infer<typeof MessageDeleteSchema>;
export type GatewayPayload = z.infer<typeof GatewayPayloadSchema>;
export type GuildMemberList = z.infer<typeof GuildMemberListUpdateSchema>;
export type GuildMemberListUpdate = z.infer<typeof GuildMemberListUpdateSchema>;
export type GuildMemberListOperation = z.infer<typeof GuildMemberListOperationSchema>;
export type GuildMemberListOperationItem = z.infer<typeof GuildMemberListOperationItemSchema>;
export type GuildMemberListGroup = z.infer<typeof GuildMemberListGroupSchema>;
export type PresenceUpdate = z.infer<typeof PresenceUpdateSchema>;
export type UserUpdate = z.infer<typeof UserUpdateSchema>;
