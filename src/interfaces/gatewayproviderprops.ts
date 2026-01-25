import { ReactNode } from 'react';

import { Guild } from './guild';

export interface GatewayProviderProps {
  children?: ReactNode;
  isReady?: boolean;
  guilds?: Guild[];
  user?: any;
}
