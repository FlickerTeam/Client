import { createContext, useContext } from 'react';

import type { UseVoiceReturn } from '@/hooks/useVoice';

export const VoiceContext = createContext<UseVoiceReturn | null>(null);

export const useVoiceContext = (): UseVoiceReturn => {
  const context = useContext(VoiceContext);
  if (!context) throw new Error('useVoiceContext must be used within VoiceProvider');
  return context;
};
