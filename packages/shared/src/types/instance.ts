import * as z from 'zod';

export const InstanceSchema = z.object({
  url: z.string(),
  name: z.string(),
  description: z.string(),
  provider: z.string(),
});

export type Instance = z.infer<typeof InstanceSchema>;
