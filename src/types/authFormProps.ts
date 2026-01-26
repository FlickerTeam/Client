import type { ChangeEvent, Dispatch, SetStateAction } from 'react';
import * as z from 'zod';

import type { ErrorStatusFields } from './errorStatusFields';
import type { Instance } from './instance';

export const ErrorMsgSchema = z.object({
  username: z.boolean(),
  email: z.boolean(),
  instance: z.string().nullish(),
  password: z.string().nullish(),
});

export type ErrorMsg = z.infer<typeof ErrorMsgSchema>;

export interface AuthFormProps {
  handleInstanceSelect: (event: ChangeEvent<HTMLSelectElement>) => void;
  instances: Instance[] | [];
  instance: string | Instance | undefined;
  customInstance: string;
  setCustomInstance: Dispatch<SetStateAction<string>>;
  errorMsg: ErrorMsg;
  status: ErrorStatusFields;
  email: string;
  setEmail: Dispatch<SetStateAction<string>>;
  password: string;
  setPassword: Dispatch<SetStateAction<string>>;
}
