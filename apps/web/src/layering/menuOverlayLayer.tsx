import { type JSX, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

import { useMenuOverlay } from './menuOverlayStore';

export const MenuOverlayLayer = (): JSX.Element | null => {
  const { x, y, content, isOpen, closeContextMenu } = useMenuOverlay();
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuSize, setMenuSize] = useState({ width: 0, height: 0 });
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useLayoutEffect(() => {
    if (!isOpen || !content || !menuRef.current) {
      return;
    }

    const { offsetWidth, offsetHeight } = menuRef.current;
    setMenuSize({
      width: offsetWidth,
      height: offsetHeight,
    });
  }, [isOpen, content]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEvents = () => {
      closeContextMenu();
    };

    window.addEventListener('click', handleEvents);
    window.addEventListener('scroll', handleEvents, true);

    return () => {
      window.removeEventListener('click', handleEvents);
      window.removeEventListener('scroll', handleEvents, true);
    };
  }, [isOpen, closeContextMenu]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleResize = () => {
      setViewport({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [isOpen]);

  if (!isOpen || !content) {
    return null;
  }

  const padding = 8;
  const maxX = Math.max(padding, viewport.width - menuSize.width - padding);
  const maxY = Math.max(padding, viewport.height - menuSize.height - padding);
  const clampedX = Math.min(Math.max(x, padding), maxX);
  const clampedY = Math.min(Math.max(y, padding), maxY);

  const contextMenuPortal = document.getElementById('context-menu-portal');
  const menuContent = (
    <div
      ref={menuRef}
      className='context-menu-container'
      style={{ top: clampedY, left: clampedX, position: 'fixed', pointerEvents: 'auto' }}
    >
      {content}
    </div>
  );

  if (contextMenuPortal) {
    return createPortal(menuContent, contextMenuPortal);
  }

  return menuContent;
};
