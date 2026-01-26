import * as z from 'zod';

import { MemberSchema } from './guilds';
import { UserSchema } from './users';

export const ChannelType = {
  GUILD_TEXT: 0,
  DM: 1,
  GUILD_VOICE: 2,
  GROUP_DM: 3,
  GUILD_CATEGORY: 4,
  GUILD_NEWS: 5,
  NEWS_THREAD: 10,
  PUBLIC_THREAD: 11,
  PRIVATE_THREAD: 12,
  GUILD_STAGE_VOICE: 13,
  GUILD_DIRECTORY: 14,
  GUILD_FORUM: 15,
  GUILD_MEDIA: 16,
} as const;

export const PermissionOverwriteSchema = z.object({
  id: z.string(),
  type: z.preprocess((val) => {
    const coerced = Number(val);
    return isNaN(coerced) ? undefined : coerced;
  }, z.int().nullish()),
  allow: z.coerce.string(),
  deny: z.coerce.string(),
});

export const ThreadMetadataSchema = z.object({
  archived: z.boolean(),
  auto_archive_duration: z.coerce.number().int(),
  archive_timestamp: z.iso.datetime({ offset: true }),
  locked: z.boolean(),
  invitable: z.boolean().nullish(),
  create_timestamp: z.iso.datetime({ offset: true }).nullish(),
});

export const ForumTagSchema = z.object({
  id: z.string(),
  name: z.string().max(50),
  moderated: z.boolean(),
  emoji_id: z.string().nullable(),
  emoji_name: z.string().nullable(),
});

export const DefaultReactionSchema = z.object({
  emoji_id: z.string().nullable(),
  emoji_name: z.string().nullable(),
});

export const SafetyWarningSchema = z.object({
  id: z.string(),
  type: z.coerce.number().int(),
  expiry: z.iso.datetime({ offset: true }),
  dismiss_timestamp: z.iso.datetime({ offset: true }).nullable(),
});

export const ChannelSchema = z.object({
  id: z.string(),
  type: z.enum(ChannelType),
  guild_id: z.string().nullish(),
  position: z.coerce.number().int().nullish(),
  permission_overwrites: z.array(PermissionOverwriteSchema).nullish(),
  name: z.string().min(1).max(100).nullish(),
  topic: z.string().max(4096).nullish(),
  nsfw: z.boolean().nullish(),
  last_message_id: z.string().nullish(),
  last_pin_timestamp: z.iso.datetime({ offset: true }).nullish(),
  bitrate: z.coerce.number().int().nullish(),
  user_limit: z.coerce.number().int().nullish(),
  rate_limit_per_user: z.coerce.number().int().max(21600).nullish(),
  recipients: z.array(UserSchema.partial()).nullish(),
  recipient_flags: z.coerce.number().int().nullish(),
  icon: z.string().nullish(),
  managed: z.boolean().nullish(),
  application_id: z.string().nullish(),
  owner_id: z.string().nullish(),
  parent_id: z.string().nullish(),
  rtc_region: z.string().nullish(),
  video_quality_mode: z.coerce.number().int().nullish(),
  message_count: z.coerce.number().int().nullish(),
  member_count: z.coerce.number().int().nullish(),
  thread_metadata: ThreadMetadataSchema.nullish(),
  member: z.lazy(() => MemberSchema).nullish(),
  default_auto_archive_duration: z.coerce.number().int().nullish(),
  permissions: z.string().nullish(),
  flags: z.coerce.number().int().nullish(),
  available_tags: z.array(ForumTagSchema).nullish(),
  applied_tags: z.array(z.string()).nullish(),
  default_reaction_emoji: DefaultReactionSchema.nullish(),
  default_forum_layout: z.coerce.number().int().nullish(),
  default_sort_order: z.coerce.number().int().nullish(),
  default_tag_setting: z.string().nullish(),
  is_message_request: z.boolean().nullish(),
  is_message_request_timestamp: z.iso.datetime({ offset: true }).nullish(),
  is_spam: z.boolean().nullish(),
  theme_color: z.coerce.number().int().nullish(),
  status: z.string().max(500).nullish(),
  safety_warnings: z.array(SafetyWarningSchema).nullish(),
});

export type Channel = z.infer<typeof ChannelSchema>;
