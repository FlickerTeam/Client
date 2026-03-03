import type { ReactNode } from 'react';

import { useVoice } from '@/hooks/useVoice';

import { VoiceContext } from './voiceContext';

export const VoiceProvider = ({ children }: { children: ReactNode }) => {
  const voice = useVoice();
  return <VoiceContext value={voice}>{children}</VoiceContext>;
};
