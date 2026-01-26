import { createContext, type JSX, useContext } from 'react';

interface ContextMenuContextType {
  openContextMenu: (x: number, y: number, content: JSX.Element) => void;
  closeContextMenu: () => void;
}

export const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }

  return context;
};
