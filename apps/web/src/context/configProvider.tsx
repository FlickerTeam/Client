import type { ReactNode } from 'react';
import { useMemo } from 'react';

import { ConfigContext } from './configContext';

export const ConfigProvider = ({ children }: { children: ReactNode }) => {
  const cdnUrl = useMemo(() => localStorage.getItem('selectedCdnUrl'), []);

  return <ConfigContext value={{ cdnUrl }}>{children}</ConfigContext>;
};
