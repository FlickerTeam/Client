import * as z from 'zod';

import { UserSchema } from './users';

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
  timestamp: z.iso.datetime().nullish(),
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
  expiry: z.iso.datetime().nullish(),
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
  me: z.boolean(),
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
  author: UserSchema.partial(),
  content: z.string(),
  timestamp: z.iso.datetime(),
  edited_timestamp: z.iso.datetime().nullish(),
  tts: z.boolean(),
  mention_everyone: z.boolean().nullish(),
  mentions: z.array(UserSchema.partial()),
  mention_roles: z.array(z.string()),
  mention_channels: z.array(z.any()).nullish(),
  attachments: z.array(AttachmentSchema),
  embeds: z.array(EmbedSchema),
  reactions: z.array(ReactionSchema).nullish(),
  nonce: z.union([z.coerce.number().int(), z.string()]).nullable().nullish(),
  pinned: z.boolean(),
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
  get referenced_message(): z.ZodOptional<z.ZodNullable<typeof MessageSchema>> {
    return MessageSchema.nullish();
  },
  interaction_metadata: z.any().nullish(),
  components: z.array(z.any()).nullish(),
  sticker_items: z.array(z.any()).nullish(),
  poll: PollSchema.nullish(),
});

export const MessageListSchema = z.array(MessageSchema);

export type Message = z.infer<typeof MessageSchema>;
export type MessageList = z.infer<typeof MessageListSchema>;
export type Attachment = z.infer<typeof AttachmentSchema>;
export type Embed = z.infer<typeof EmbedSchema>;
export type Reaction = z.infer<typeof ReactionSchema>;
export type Poll = z.infer<typeof PollSchema>;
