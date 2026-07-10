import { useSyncExternalStore } from 'react';

import type { ImagePreviewProps } from '@/components/modals/imagePreview';
import type { ConnectedAccount } from '@/components/modals/serverProfile';
import type { Channel } from '@/types/channel';
import type { Guild, Member } from '@/types/guilds';
import type { User } from '@/types/users';

export interface ModalDataMap {
  JOIN_SERVER: undefined;
  CREATE_SERVER: undefined;
  SET_STATUS: undefined;
  WHATS_IT_GONNA_BE: undefined;
  CONFIRMATION_LEAVE: { name: string; id: string; type: string };
  CLEAR_SELECTED_INSTANCE: undefined;
  CONFIRMATION_DELETE: { id: string; type: string };
  DANGER_CONFIRMATION: { title: string; body: string; onCancel: () => void; onConfirm: () => void };
  CONFIRMATION_CONNECT_P2P: {
    channel: Channel;
    name: string;
    guild_id?: string | null;
  };
  SERVER_PROFILE: {
    member: Member;
    mutual_guilds?: Guild[];
    mutual_friends?: User[];
    connected_accounts?: ConnectedAccount[];
    premium_since?: string | null;
    premium_type?: number;
  };
  IMAGE_PREVIEW: ImagePreviewProps;
}

export type ModalType = keyof ModalDataMap;

interface ModalContextType {
  modalType: ModalType | null;
  modalData: ModalDataMap[ModalType] | null;
  openModal: <T extends ModalType>(
    ...args: ModalDataMap[T] extends undefined ? [type: T] : [type: T, data: ModalDataMap[T]]
  ) => void;
  updateModal: <T extends ModalType>(data: Partial<ModalDataMap[T]>) => void;
  closeModal: () => void;
}

interface ModalState {
  modalType: ModalType | null;
  modalData: ModalDataMap[ModalType] | null;
}

const listeners = new Set<() => void>();
let state: ModalState = {
  modalType: null,
  modalData: null,
};

const getSnapshot = (): ModalState => state;

const subscribe = (listener: () => void) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const emit = () => {
  listeners.forEach((listener) => {
    listener();
  });
};

const openModal: ModalContextType['openModal'] = (...args) => {
  const [type, data] = args as [ModalType, ModalDataMap[ModalType] | undefined];
  state = {
    modalType: type,
    modalData: (data ?? null) as ModalDataMap[ModalType] | null,
  };
  emit();
};

const updateModal: ModalContextType['updateModal'] = (data) => {
  if (!state.modalData || typeof state.modalData !== 'object') {
    return;
  }

  state = {
    ...state,
    modalData: {
      ...state.modalData,
      ...(data as object),
    } as ModalDataMap[ModalType],
  };
  emit();
};

const closeModal = () => {
  state = {
    modalType: null,
    modalData: null,
  };
  emit();
};

export const useModal = (): ModalContextType => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    modalType: snapshot.modalType,
    modalData: snapshot.modalData,
    openModal,
    updateModal,
    closeModal,
  };
};
