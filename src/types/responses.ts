import * as z from 'zod';

export const WellKnownResponseSchema = z.object({
  api: z.url(),
});

export const DomainsResponseSchema = z.object({
  cdn: z.url(),
  assets: z.array(z.url()).nullish(),
  gateway: z.url(),
  defaultApiVersion: z.string(),
  apiEndpoint: z.url(),
});

export const InviteResponseSchema = z.object({
  code: z.string(),
  inviter: z.object({
    id: z.string(),
    username: z.string(),
    discriminator: z.string(),
    avatar: z.string().nullable(),
  }),
  expires_at: z.string(),
  guild: z.object({
    id: z.string(),
    name: z.string(),
    icon: z.string().nullable(),
    splash: z.string().nullable(),
    owner_id: z.string(),
    features: z.array(z.string()),
  }),
  channel: z.object({
    id: z.string(),
    guild_id: z.string(),
    name: z.string(),
    type: z.coerce.number().int(),
  }),
  uses: z.coerce.number().int(),
});

export const ErrorResponseSchema = z.object({
  code: z.union([z.string(), z.coerce.number().int()]).nullish(),
  message: z.string(),
});

const LoginSettingsSchema = z.object({
  locale: z.string(),
  theme: z.union([z.literal('dark'), z.literal('light')]),
});

export const LoginResponseSchema = z.object({
  user_id: z.string(),
  token: z.string().nullish(),
  user_settings: LoginSettingsSchema.nullish(),
  required_actions: z.array(z.string()).nullish(),
  ticket: z.string().nullish(),
  login_instance_id: z.string().nullish(),
  mfa: z.boolean().default(false),
  totp: z.boolean().nullish(),
  sms: z.boolean().nullish(),
  backup: z.boolean().nullish(),
  webauthn: z.string().nullable().nullish(),
});

export const RegisterResponseSchema = z.object({
  token: z.string(),
  show_verification_form: z.boolean().nullish(),
});

export type WellKnownResponse = z.infer<typeof WellKnownResponseSchema>;

export type DomainsResponse = z.infer<typeof DomainsResponseSchema>;

export type InviteResponse = z.infer<typeof InviteResponseSchema>;

export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;

export interface SpacebarResponse {
  api: string;
}

export type LoginResponse = z.infer<typeof LoginResponseSchema>;

export type RegisterResponse = z.infer<typeof RegisterResponseSchema>;
