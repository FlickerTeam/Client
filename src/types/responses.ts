import * as z from 'zod';

export const DomainsResponse = z.object({
  cdn: z.string(),
  assets: z.array(z.string()).nullish(),
  gateway: z.string(),
  defaultApiVersion: z.string(),
  apiEndpoint: z.string(),
});

export type DomainsResponse = z.infer<typeof DomainsResponse>;

export interface ErrorResponse {
  code?: number;
  message?: string;
}

export interface SpacebarResponse {
  api: string;
}
