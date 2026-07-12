import * as z from 'zod';

import { UserSchema } from './users';

export interface EmbedField {
  name: string;
  value: string;
  inline?: boolean;
}

export interface EmbedData {
  title?: string;
  description?: string;
  url?: string;
  color?: number;
  timestamp?: string;
  footer?: { text: string; icon_url?: string };
  image?: { url: string; height: number; width: number };
  thumbnail?: { url: string; height: number; width: number };
  author?: { name: string; url?: string; icon_url?: string };
  fields?: EmbedField[];
}

export enum MessageType {
  DEFAULT = 0,
  ADD_TO_GROUP = 1,
  REMOVE_FROM_GROUP = 2,
  CALL = 3,
  CHANNEL_NAME_CHANGE = 4,
  CHANNEL_ICON_CHANGE = 5,
  PIN = 6,
  GUILD_MEMBER_JOIN = 7,
  GUILD_SUBSCRIPTION = 8,
  GUILD_SUBSCRIPTION_TIER_1 = 9,
  GUILD_SUBSCRIPTION_TIER_2 = 10,
  GUILD_SUBSCRIPTION_TIER_3 = 11,
}

export const AttachmentSchema = z.object({
  id: z.string(),
  filename: z.string(),
  title: z.string().nullish(),
  description: z.string().nullish(),
  content_type: z.string().nullish(),
  size: z.coerce.number().int(),
  url: z.url(),
  proxy_url: z.url(),
  height: z.coerce.number().int().nullish(),
  width: z.coerce.number().int().nullish(),
  ephemeral: z.boolean().nullish(),
  duration_secs: z.coerce.number().int().nullish(),
  waveform: z.string().nullish(),
  flags: z.coerce.number().int().nullish(),
});

export const EmbedSchema = z.object({
  title: z.string().max(256).nullish(),
  type: z.string().nullish(),
  description: z.string().max(4096).nullish(),
  url: z.url().nullish(),
  timestamp: z.iso.datetime({ offset: true }).nullish(),
  color: z.coerce.number().int().nullish(),
  footer: z
    .object({
      text: z.string(),
      icon_url: z.string().nullish(),
      proxy_icon_url: z.string().nullish(),
    })
    .nullish(),
  image: z
    .object({
      url: z.string(),
      proxy_url: z.string().nullish(),
      height: z.coerce.number().int().nullish(),
      width: z.coerce.number().int().nullish(),
    })
    .nullish(),
  thumbnail: z
    .object({
      url: z.string(),
      proxy_url: z.string().nullish(),
      height: z.coerce.number().int().nullish(),
      width: z.coerce.number().int().nullish(),
    })
    .nullish(),
  video: z
    .object({
      url: z.string().nullish(),
      height: z.coerce.number().int().nullish(),
      width: z.coerce.number().int().nullish(),
    })
    .nullish(),
  provider: z.object({ name: z.string().nullish(), url: z.string().nullish() }).nullish(),
  author: z
    .object({
      name: z.string(),
      url: z.string().nullish(),
      icon_url: z.string().nullish(),
      proxy_icon_url: z.string().nullish(),
    })
    .nullish(),
  fields: z
    .array(
      z.object({
        name: z.string().max(256),
        value: z.string().max(1024),
        inline: z.boolean().nullish(),
      }),
    )
    .max(25)
    .nullish(),
});

export const PollSchema = z.object({
  question: z.object({ text: z.string() }),
  answers: z.array(
    z.object({
      answer_id: z.coerce.number().int(),
      poll_media: z.object({
        text: z.string().nullish(),
        emoji: z.object({ id: z.string().nullish(), name: z.string().nullish() }).nullish(),
      }),
    }),
  ),
  expiry: z.iso.datetime({ offset: true }).nullish(),
  allow_multiselect: z.boolean(),
  layout_type: z.coerce.number().int(),
  results: z
    .object({
      is_finalized: z.boolean(),
      answer_counts: z.array(
        z.object({
          id: z.coerce.number().int(),
          count: z.coerce.number().int(),
          me_voted: z.boolean(),
        }),
      ),
    })
    .nullish(),
});

export const ReactionSchema = z.object({
  count: z.coerce.number().int(),
  count_details: z
    .object({
      normal: z.coerce.number().int(),
      burst: z.coerce.number().int(),
    })
    .nullish(),
  me: z.boolean().default(false),
  me_burst: z.boolean().nullish(),
  emoji: z.object({
    id: z.string().nullish(),
    name: z.string().nullish(),
  }),
  burst_colors: z.array(z.string()).nullish(),
});

export const MessageSchema = z.object({
  id: z.string(),
  channel_id: z.string(),
  guild_id: z.string().nullish(),
  author: UserSchema.partial(),
  content: z.string().nullable().optional(),
  timestamp: z.iso.datetime({ offset: true }),
  edited_timestamp: z.iso.datetime({ offset: true }).nullish(),
  tts: z.boolean(),
  mention_everyone: z.boolean().nullish(),
  mentions: z.array(UserSchema.partial()).default([]),
  mention_roles: z.array(z.union([z.string(), z.any()])).nullish(),
  mention_channels: z.array(z.any()).nullish(),
  attachments: z.array(AttachmentSchema).default([]),
  embeds: z.array(EmbedSchema).default([]),
  reactions: z.array(ReactionSchema).nullish(),
  nonce: z.coerce.string().nullable().nullish(),
  pinned: z.boolean().nullish(),
  webhook_id: z.string().nullish(),
  type: z.coerce.number().int(),
  activity: z
    .object({
      type: z.coerce.number().int(),
      party_id: z.string().nullish(),
    })
    .nullish(),
  application_id: z.string().nullish(),
  flags: z.coerce.number().int().nullish(),
  message_reference: z
    .object({
      message_id: z.string().nullish(),
      channel_id: z.string().nullish(),
      guild_id: z.string().nullish(),
      fail_if_not_exists: z.boolean().nullish(),
    })
    .nullish(),
  interaction_metadata: z.any().nullish(),
  components: z.array(z.any()).nullish(),
  sticker_items: z.array(z.any()).nullish(),
  poll: PollSchema.nullish(),
  state: z.number().optional().default(1), //for local msgs on flicker
});

export const MessageListSchema = z.array(MessageSchema);

export type Message = z.infer<typeof MessageSchema>;
export type MessageList = z.infer<typeof MessageListSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Embed = z.infer<typeof EmbedSchema>;
export type Reaction = z.infer<typeof ReactionSchema>;
export type Poll = z.infer<typeof PollSchema>;
