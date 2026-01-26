import * as z from 'zod';

import { GuildSchema, MemberSchema } from './guilds';
import { MessageSchema } from './messages';
import { RelationshipSchema } from './relationship';
import { UserSchema } from './users';
import { UserSettingsSchema } from './userSettings';

const GuildMemberListGroupSchema = z.object({
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
});

export const HelloSchema = z.object({
  _trace: z.array(z.string()).nullish(),
  heartbeat_interval: z.coerce.number().int(),
});

// TODO: Implement all ReadyEventSchema
export const ReadyEventSchema = z.looseObject({
  user: UserSchema,
  user_settings: UserSettingsSchema,
  guilds: z.array(GuildSchema),
  relationships: z.array(RelationshipSchema),
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

export const TypingStartSchema = z.object({
  channel_id: z.string(),
  guild_id: z.string().nullish(),
  user_id: z.string(),
  timestamp: z.int(),
  member: MemberSchema.nullish(),
});

export const GatewayPayloadSchema = z.object({
  op: z.coerce.number().int(),
  s: z.coerce.number().int().nullish(),
  t: z.string().nullish(),
  d: z.unknown(),
});

export type GatewayPayload = z.infer<typeof GatewayPayloadSchema>;
export type GuildMemberList = z.infer<typeof GuildMemberListUpdateSchema>;
export type GuildMemberListUpdate = z.infer<typeof GuildMemberListUpdateSchema>;
export type GuildMemberListOperation = z.infer<typeof GuildMemberListOperationSchema>;
export type GuildMemberListOperationItem = z.infer<typeof GuildMemberListOperationItemSchema>;
