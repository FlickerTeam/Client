import { createContext, type JSX, useContext, useEffect, useState } from 'react';

interface ContextMenuState {
  x: number;
  y: number;
  content: JSX.Element | null;
  isOpen: boolean;
}

interface ContextMenuContextType {
  openContextMenu: (x: number, y: number, content: JSX.Element) => void;
  closeContextMenu: () => void;
}

const ContextMenuContext = createContext<ContextMenuContextType | undefined>(undefined);

export const ContextMenuProvider = ({ children }: { children: any }): JSX.Element => {
  const [menu, setMenu] = useState<ContextMenuState>({ x: 0, y: 0, content: null, isOpen: false });

  const openContextMenu = (x: number, y: number, content: JSX.Element) => {
    setMenu({ x, y, content, isOpen: true });
  };

  const closeContextMenu = () => {
    setMenu((prev) => ({ ...prev, isOpen: false }));
  };

  useEffect(() => {
    const handleEvents = () => {
      closeContextMenu();
    };

    window.addEventListener('click', handleEvents);
    window.addEventListener('scroll', handleEvents, true);

    return () => {
      window.removeEventListener('click', handleEvents);
      window.removeEventListener('scroll', handleEvents, true);
    };
  }, []);

  return (
    <ContextMenuContext.Provider value={{ openContextMenu, closeContextMenu }}>
      {children}
      {menu.isOpen && (
        <div
          className='context-menu-container'
          style={{ top: menu.y, left: menu.x, position: 'fixed', zIndex: 9999 }}
        >
          {menu.content}
        </div>
      )}
    </ContextMenuContext.Provider>
  );
};

export const useContextMenu = () => {
  const context = useContext(ContextMenuContext);

  if (!context) {
    throw new Error('useContextMenu must be used within a ContextMenuProvider');
  }

  return context;
};
