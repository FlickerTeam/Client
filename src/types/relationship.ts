import * as z from 'zod';

import { StatusEnumSchema } from './presences';
import { UserSchema } from './users';

export const RelationshipSchema = z.object({
  id: z.string(),
  type: z.coerce.number().int(),
  user: UserSchema,
  nickname: z.string().nullish(),
  since: z.iso.datetime().nullish(),
  status: StatusEnumSchema.nullish(), // Not found on docs.discord.food is it there in old Discord?
});

export type Relationship = z.infer<typeof RelationshipSchema>;
