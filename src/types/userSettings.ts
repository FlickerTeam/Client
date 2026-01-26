import * as z from 'zod';

import { StatusEnumSchema } from './presences';

export const CustomStatusSchema = z.object({
  text: z.string().max(128).nullish(),
  emoji_id: z.string().nullish(),
  emoji_name: z.string().nullish(),
  expires_at: z.iso.datetime().nullish(),
});

export const FriendSourceFlagsSchema = z.object({
  all: z.boolean().nullish(),
  mutual_friends: z.boolean().nullish(),
  mutual_guilds: z.boolean().nullish(),
});

export const GuildFolderSchema = z.object({
  id: z.coerce.number().int().nullish(),
  name: z.string().nullish(),
  guild_ids: z.array(z.string()),
  color: z.coerce.number().int().nullish(),
});

export const UserSettingsSchema = z.object({
  theme: z.enum(['dark', 'light', 'darker', 'midnight']),
  locale: z.string(),
  message_display_compact: z.boolean(),
  developer_mode: z.boolean(),
  explicit_content_filter: z.coerce.number().int().min(0).max(2).nullish(),
  convert_emoticons: z.boolean(),
  animate_emoji: z.boolean().nullish(),
  animate_stickers: z.coerce.number().int().min(0).max(2).nullish(),
  gif_auto_play: z.boolean().nullish(),
  custom_status: CustomStatusSchema.nullish(),
  friend_source_flags: FriendSourceFlagsSchema.nullish(),
  friend_discovery_flags: z.coerce.number().int().nullish(),
  show_current_game: z.boolean(),
  restricted_guilds: z.array(z.string()),
  default_guilds_restricted: z.boolean().nullish(),
  guild_folders: z.array(GuildFolderSchema),
  afk_timeout: z.coerce.number().int().nullish(),
  timezone_offset: z.coerce.number().int(),
  allow_accessibility_detection: z.boolean().nullish(),
  inline_attachment_media: z.boolean(),
  inline_embed_media: z.boolean(),
  status: StatusEnumSchema,
});

export type UserSettings = z.infer<typeof UserSettingsSchema>;
