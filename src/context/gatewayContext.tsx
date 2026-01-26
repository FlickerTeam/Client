import { createContext, useContext } from 'react';

import type { GatewayContextSchema } from '@/types/gatewayContext';

export const GatewayContext = createContext<GatewayContextSchema | null>(null);

export const useGateway = () => {
  const context = useContext(GatewayContext);

  if (!context) {
    throw new Error('useGateway must be used within a GatewayProvider');
  }

  return context;
};
