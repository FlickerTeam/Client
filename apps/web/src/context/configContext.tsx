import { createContext, useContext } from 'react';

interface ConfigContextValue {
  cdnUrl: string | null;
}

export const ConfigContext = createContext<ConfigContextValue | undefined>(undefined);

export const useConfig = (): ConfigContextValue => {
  const context = useContext(ConfigContext);
  if (!context) {
    throw new Error('useConfig must be used within ConfigProvider');
  }
  return context;
};
