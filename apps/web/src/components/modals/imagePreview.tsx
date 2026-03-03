import './imagePreview.css';

import { type JSX, useEffect, useRef, useState } from 'react';
import type { Message } from 'shared';
import { getDefaultAvatar } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useModal } from '@/layering/modalContext';

export interface ImagePreviewProps {
  src: string;
  alt: string;
  width: number;
  height: number;
  author?: Message['author'];
  id: string;
  timestamp?: string;
  zoomOnly?: boolean;
}

export const ImagePreview = ({
  src,
  alt,
  author,
  timestamp,
  zoomOnly = false,
}: ImagePreviewProps): JSX.Element => {
  const { closeModal } = useModal();
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const imgRef = useRef<HTMLImageElement>(null);
  const { cdnUrl } = useConfig();

  const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
    `/assets/${getDefaultAvatar(author ?? {})}.png`,
  );
  const customAvatarUrl = author?.avatar
    ? `${cdnUrl ?? ''}/avatars/${author.id ?? ''}/${author.avatar}.png`
    : defaultAvatarUrl;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        closeModal();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeModal]);

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    e.preventDefault();

    const ZOOM_SPEED = 0.1;
    const delta = -Math.sign(e.deltaY) * ZOOM_SPEED;
    const newScale = Math.min(Math.max(0.5, scale + delta * scale), 8);

    setScale(newScale);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (scale > 1) {
      e.preventDefault();
      setIsDragging(true);
      dragStart.current = { x: e.clientX - position.x, y: e.clientY - position.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setPosition({
        x: e.clientX - dragStart.current.x,
        y: e.clientY - dragStart.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const resetZoom = () => {
    setScale(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleDoubleClick = () => {
    if (scale !== 1) {
      resetZoom();
    } else {
      setScale(2);
    }
  };

  const openOriginal = () => {
    window.open(src, '_blank');
  };

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(src);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleCanvasClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      closeModal();
    }
  };

  return (
    <div
      className='image-preview-container'
      role='presentation'
      onKeyDown={(e) => {
        if (e.key === 'Escape') closeModal();
      }}
    >
      <div
        className={`image-preview-header ${zoomOnly ? 'zoom-only' : ''}`}
        onClick={(e) => {
          e.stopPropagation();
        }}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role='presentation'
      >
        {!zoomOnly && author && (
          <div className='image-preview-attribution'>
            <img
              src={customAvatarUrl}
              alt=''
              className='attribution-avatar'
              onError={() => {
                rollover();
              }}
            />
            <div className='attribution-info'>
              <span className='attribution-name'>{author.username ?? ''}</span>
              <span className='attribution-sub'>{timestamp ?? ''}</span>
            </div>
          </div>
        )}

        <div className='image-preview-toolbar'>
          {!zoomOnly && (
            <>
              <button
                type='button'
                className='preview-btn'
                onClick={openOriginal}
                title='Open in Browser'
              >
                <span className='material-symbols-rounded'>open_in_new</span>
              </button>
              <div className='preview-divider' />
            </>
          )}
          <button
            type='button'
            className='preview-btn'
            onClick={() => {
              setScale((s) => Math.max(0.5, s - 0.5));
            }}
            title='Zoom Out'
          >
            <span className='material-symbols-rounded'>remove</span>
          </button>
          <button
            type='button'
            className='preview-btn preview-zoom-indicator'
            onClick={resetZoom}
            title='Reset Zoom'
          >
            {String(Math.round(scale * 100))}%
          </button>
          <button
            type='button'
            className='preview-btn'
            onClick={() => {
              setScale((s) => Math.min(8, s + 0.5));
            }}
            title='Zoom In'
          >
            <span className='material-symbols-rounded'>add</span>
          </button>
          <div className='preview-divider' />
          <button type='button' className='preview-btn' onClick={closeModal} title='Close'>
            <span className='material-symbols-rounded'>close</span>
          </button>
        </div>
      </div>

      <div
        className={`image-preview-canvas ${scale > 1 ? 'zoomed' : ''} ${isDragging ? 'dragging' : ''}`}
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
        onDoubleClick={handleDoubleClick}
        onKeyDown={(e) => {
          e.stopPropagation();
        }}
        role='presentation'
      >
        <img
          ref={imgRef}
          src={src}
          alt={alt}
          className='image-preview-img'
          style={{
            transform: `translate(${String(position.x)}px, ${String(position.y)}px) scale(${String(scale)})`,
          }}
          draggable={false}
        />
      </div>

      {!zoomOnly && (
        <div
          className='image-preview-footer'
          onClick={(e) => {
            e.stopPropagation();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
          }}
          role='presentation'
        >
          <div className='image-preview-toolbar'>
            <button
              type='button'
              className='preview-btn'
              onClick={() => {
                void copyLink();
              }}
              title='Copy Link'
            >
              <span className='material-symbols-rounded'>link</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
