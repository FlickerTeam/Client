import * as z from 'zod';

export const UserSchema = z.object({
  id: z.string(),
  username: z.string(),
  discriminator: z.string(),
  avatar: z.string().nullish(),
  bot: z.boolean().nullish(),
  system: z.boolean().nullish(),
  mfa_enabled: z.boolean().nullish(),
  banner: z.string().nullish(),
  accent_color: z.coerce.number().int().nullish(),
  locale: z.string().nullish(),
  verified: z.boolean().nullish(),
  email: z.string().nullish(),
  flags: z.coerce.number().int().nullish(),
  premium_type: z.coerce.number().int().nullish(),
  public_flags: z.coerce.number().int().nullish(),
  global_name: z.string().nullish(),
  pronouns: z.string().nullish(),
  bio: z.string().nullish(),
});

export type User = z.infer<typeof UserSchema>;
