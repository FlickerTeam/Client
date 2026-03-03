import { type JSX, useSyncExternalStore } from 'react';

interface MenuOverlayState {
  x: number;
  y: number;
  content: JSX.Element | null;
  isOpen: boolean;
}

interface MenuOverlayApi extends MenuOverlayState {
  openContextMenu: (x: number, y: number, content: JSX.Element) => void;
  closeContextMenu: () => void;
}

const listeners = new Set<() => void>();

let state: MenuOverlayState = {
  x: 0,
  y: 0,
  content: null,
  isOpen: false,
};

const getSnapshot = (): MenuOverlayState => state;

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

const openContextMenu = (x: number, y: number, content: JSX.Element) => {
  state = {
    x,
    y,
    content,
    isOpen: true,
  };
  emit();
};

const closeContextMenu = () => {
  if (!state.isOpen) {
    return;
  }

  state = {
    ...state,
    isOpen: false,
  };
  emit();
};

export const useMenuOverlay = (): MenuOverlayApi => {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);

  return {
    ...snapshot,
    openContextMenu,
    closeContextMenu,
  };
};
