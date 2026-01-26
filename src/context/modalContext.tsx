import { createContext, useContext } from 'react';

import type { Member } from '@/types/guilds';

export interface ModalDataMap {
  JOIN_SERVER: undefined;
  CREATE_SERVER: undefined;
  WHATS_IT_GONNA_BE: undefined;
  CONFIRMATION_LEAVE: { name: string; id: string; type: string };
  CLEAR_SELECTED_INSTANCE: undefined;
  CONFIRMATION_DELETE: { name: string; id: string; type: string };
  USER_PROFILE: { member: Member };
  SERVER_PROFILE: { member: Member };
}

export type ModalType = keyof ModalDataMap;

interface ModalContextType {
  modalType: ModalType | null;
  modalData: ModalDataMap[ModalType] | null;
  openModal: <T extends ModalType>(
    ...args: ModalDataMap[T] extends undefined ? [type: T] : [type: T, data: ModalDataMap[T]]
  ) => void;
  closeModal: () => void;
}

export const ModalContext = createContext<ModalContextType | undefined>(undefined);

export const useModal = () => {
  const context = useContext(ModalContext);
  if (!context) {
    throw new Error('useModal must be used within ModalProvider');
  }
  return context;
};
