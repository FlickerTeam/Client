import * as z from 'zod';

import { UserSchema } from './users';

export const StatusEnumSchema = z.enum([
  'online',
  'idle',
  'dnd',
  'offline',
  'invisible',
  'unknown',
]);

export const PlatformEnum = z.enum([
  'desktop',
  'mobile',
  'web',
  'embedded',
  'vr',
  'xbox',
  'samsung',
  'ios',
  'android',
  'ps4',
  'ps5',
  'meta_quest',
  'unknown',
]);

export const ActivityTypeEnum = z.enum({
  PLAYING: 0,
  STREAMING: 1,
  LISTENING: 2,
  WATCHING: 3,
  CUSTOM: 4,
  COMPETING: 5,
  HANG: 6,
});

export const ActivityEmojiSchema = z.object({
  name: z.string(),
  id: z.string().nullish(),
  animated: z.boolean().nullish(),
});

export const ActivityAssetsSchema = z.object({
  large_image: z.string().nullish(),
  large_text: z.string().nullish(),
  large_url: z.string().nullish(),
  small_image: z.string().nullish(),
  small_text: z.string().nullish(),
  small_url: z.string().nullish(),
  invite_cover_image: z.string().nullish(),
});

// https://docs.discord.food/resources/presence#activity-metadata-object -- Check warning for why there is z.json() and .and()
/*
  Activity metadata can consist of arbitrary data, and is not sanitized by the API. Treat data within this object carefully.

  The below structure is only a convention that is used by official clients. It is not enforced by the API.
*/
export const ActivityMetadataSchema = z.json().and(
  z.object({
    button_urls: z.array(z.string()).max(2).nullish(),
    artist_ids: z.array(z.string()).nullish(),
    album_id: z.string().nullish(),
    context_uri: z.string().nullish(),
    type: z.string().nullish(),
  }),
);

export const ActivitySchema = z.object({
  id: z.string(),
  name: z.string(),
  type: ActivityTypeEnum,
  created_at: z.coerce.number().int(),
  url: z.string().nullish(),
  session_id: z.string().nullish(),
  platform: PlatformEnum.nullish(),
  application_id: z.string().nullish(),
  state: z.string().nullish(),
  details: z.string().nullish(),
  emoji: ActivityEmojiSchema.nullish(),
  assets: ActivityAssetsSchema.nullish(),
  timestamps: z
    .object({
      start: z.coerce.number().int().nullish(),
      end: z.coerce.number().int().nullish(),
    })
    .nullish(),
  party: z
    .object({
      id: z.string().nullish(),
      size: z.tuple([z.coerce.number().int(), z.coerce.number().int()]).nullish(),
    })
    .nullish(),
  flags: z.coerce.number().int().nullish(),
  sync_id: z.string().nullish(),
  metadata: ActivityMetadataSchema.nullish(),
});

export const ClientStatusSchema = z.object({
  desktop: StatusEnumSchema.nullish(),
  mobile: StatusEnumSchema.nullish(),
  web: StatusEnumSchema.nullish(),
  embedded: StatusEnumSchema.nullish(),
  vr: StatusEnumSchema.nullish(),
});

export const PresenceSchema = z.object({
  user: UserSchema.partial(),
  status: StatusEnumSchema,
  activities: z.array(ActivitySchema),
  client_status: ClientStatusSchema.nullish(),
  guild_id: z.string().nullish(),
  hidden_activities: z.array(ActivitySchema).nullish(),
  has_played_game: z.boolean().nullish(),
});

export const SessionSchema = z.object({
  session_id: z.string(),
  status: StatusEnumSchema,
  activities: z.array(ActivitySchema),
  client_info: z.object({
    client: PlatformEnum,
    os: z.string(),
    version: z.coerce.number().int(),
  }),
  hidden_activities: z.array(ActivitySchema).nullish(),
  active: z.boolean().nullish(),
});

export type Activity = z.infer<typeof ActivitySchema>;
export type Presence = z.infer<typeof PresenceSchema>;
export type StatusEnum = z.infer<typeof StatusEnumSchema>;
