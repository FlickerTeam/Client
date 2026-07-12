import { useSyncExternalStore } from 'react';

import type { Emoji as EmojiChooserEmoji } from '@/types/emojiChooser';
import type { GifCategory, GifResult } from '@/types/gifsSearcher';
import type { Emoji, Guild, Member, Role } from '@/types/guilds';

export type PopupDirection = 'top' | 'bottom' | 'left' | 'right';

export interface PopupDataMap {
  USER_PROFILE_POPOUT: {
    x: number;
    y: number;
    member: Member;
    roles: Role[] | null;
    direction?: PopupDirection;
  };
  SET_STATUS: {
    x: number;
    y: number;
    direction?: PopupDirection;
  };
  CURRENT_USER_PROFILE: { x: number; y: number; direction?: PopupDirection };
  EMOJI_DETAILS_POPOUT: {
    x: number;
    y: number;
    emoji: Emoji | EmojiChooserEmoji;
    guildIcon?: string;
    guildId: string;
    guildName: string;
    isPrivate: boolean;
    isBuiltin?: boolean;
    unicode?: string;
    sourceSubtext?: string;
    direction?: PopupDirection;
  };
  EMOJI_PICKER: {
    x: number;
    y: number;
    pointerX?: number;
    pointerY?: number;
    guilds: Guild[];
    onSelectEmoji: (emoji: Emoji | EmojiChooserEmoji) => void;
    direction?: PopupDirection;
  };
  GIF_PICKER: {
    x: number;
    y: number;
    pointerX?: number;
    pointerY?: number;
    gifCategories: GifCategory[];
    gifs: GifResult[];
    onSearch: (term: string) => Promise<void>;
    onSelectGif: (url: string) => void;
    direction?: PopupDirection;
  };
  GUILD_ACTIONS_DROPDOWN: {
    x: number;
    y: number;
    width: number;
    guild: Guild;
    onClose: () => void;
  };
}

export type PopupType = keyof PopupDataMap;

export interface PopupInstance {
  popupType: PopupType;
  popupData: PopupDataMap[PopupType];
}

interface PopupContextType {
  popups: Record<string, PopupInstance>;
  openPopup: <T extends PopupType>(type: T, data: PopupDataMap[T]) => void;
  updatePopup: <T extends PopupType>(type: T, data: Partial<PopupDataMap[T]>) => void;
  closePopup: (type?: PopupType) => void;
}

interface PopupState {
  popups: Record<string, PopupInstance>;
}

const listeners = new Set<() => void>();

let state: PopupState = {
  popups: {},
};

const getSnapshot = (): PopupState => state;

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

const openPopup: PopupContextType['openPopup'] = (type, data) => {
  state = {
    popups: {
      ...state.popups,
      [type]: { popupType: type, popupData: data },
    },
  };
  emit();
};

const updatePopup: PopupContextType['updatePopup'] = (type, data) => {
  const targetPopup = state.popups[type];
  if (!targetPopup || !targetPopup.popupData || typeof targetPopup.popupData !== 'object') {
    return;
  }

  state = {
    popups: {
      ...state.popups,
      [type]: {
        ...targetPopup,
        popupData: {
          ...targetPopup.popupData,
          ...(data as object),
        } as PopupDataMap[PopupType],
      },
    },
  };
  emit();
};

const closePopup = (type?: PopupType) => {
  if (type) {
    const nextPopups = { ...state.popups };
    delete nextPopups[type];
    state = { popups: nextPopups };
  } else {
    state = { popups: {} };
  }
  emit();
};

export const usePopup = (): PopupContextType => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  return {
    popups: snapshot.popups,
    openPopup,
    updatePopup,
    closePopup,
  };
};
