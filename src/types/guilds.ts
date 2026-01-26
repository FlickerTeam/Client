import * as z from 'zod';

import { ChannelSchema } from './channel';
import { PresenceSchema } from './presences';
import { UserSchema } from './users';

export const RoleSchema = z.object({
  id: z.string(),
  name: z.string(),
  color: z.coerce.number(),
  position: z.coerce.number(),
  permissions: z.union([z.string(), z.coerce.number()]),
});

export const MemberSchema = z.object({
  id: z.string(),
  user: UserSchema,
  avatar: z.string().nullish(),
  roles: z.array(z.string()),
  presence: PresenceSchema.nullish(),
  joined_at: z.iso.datetime(),
});

export const GuildSchema = z.object({
  id: z.string(),
  name: z.string(),
  icon: z.string().nullish(),
  owner_id: z.string(),
  roles: z.array(RoleSchema),
  channels: z.array(z.lazy(() => ChannelSchema)),
});

export type Guild = z.infer<typeof GuildSchema>;
export type Member = z.infer<typeof MemberSchema>;
export type Role = z.infer<typeof RoleSchema>;
