import * as z from 'zod';

import { ChannelSchema } from './channel';
import { PresenceSchema } from './presences';
import { UserSchema } from './users';

export const VoiceStateSchema = z.looseObject({
  guild_id: z.string().optional(),
  channel_id: z.string().nullable(),
  user_id: z.string(),
  session_id: z.string(),
  deaf: z.boolean(),
  mute: z.boolean(),
  self_deaf: z.boolean(),
  self_mute: z.boolean(),
  self_stream: z.boolean().optional(),
  self_video: z.boolean().optional(),
  suppress: z.boolean(),
});

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.coerce.number().int(),
  position: z.coerce.number().int(),
  permissions: z.union([z.string(), z.coerce.number().int()]),
});

export const EmojiSchema = z.object({
  id: z.string(),
  animated: z.boolean().default(false),
  guild_id: z.string().nullish(),
  managed: z.boolean().default(false),
  groups: z.object({}).optional().nullish(),
  name: z.string(),
  require_colons: z.boolean().default(true),
  roles: z.array(RoleSchema).default([]),
  user_id: z.string().optional().nullish(),
});

export const MemberSchema = z.object({
  id: z.string(),
  user: UserSchema,
  avatar: z.string().nullish(),
  roles: z.array(z.coerce.string()),
  presence: PresenceSchema.nullish(),
  joined_at: z.iso.datetime({ offset: true }),
  nick: z.string().nullish(),
});

export const GuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullish(),
  banner: z.string().nullish(),
  owner_id: z.string(),
  roles: z.array(RoleSchema),
  emojis: z.array(EmojiSchema).nullish().default([]),
  channels: z.array(z.lazy(() => ChannelSchema)),
  presences: z.lazy(() => z.array(PresenceSchema)).optional(),
  voice_states: z.array(VoiceStateSchema).default([]),
});

export type Guild = z.infer<typeof GuildSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Emoji = z.infer<typeof EmojiSchema>;
export type Role = z.infer<typeof RoleSchema>;
export type VoiceState = z.infer<typeof VoiceStateSchema>; //okay technically this is not guild only
