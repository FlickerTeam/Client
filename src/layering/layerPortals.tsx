import './modal.css';
import './popup.css';

import { type JSX, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

import { ClearSelectedInstanceModal } from '@/components/modals/clearSelectedInstance';
import { ConfirmationConnectP2PModal } from '@/components/modals/confirmationConnectP2P';
import { ConfirmationDeleteModal } from '@/components/modals/confirmationDelete';
import { ConfirmationLeaveModal } from '@/components/modals/confirmationLeave';
import { CreateServerModal } from '@/components/modals/createServer';
import { DangerConfirmationModal } from '@/components/modals/dangerConfirmationModal';
import { EmojiChooser } from '@/components/modals/emojiChooser';
import { GifSearcher } from '@/components/modals/gifSearcher';
import { ImagePreview } from '@/components/modals/imagePreview';
import { JoinOrCreateServerModal } from '@/components/modals/joinOrCreateServer';
import { JoinServerModal } from '@/components/modals/joinServer';
import { PopoutEmoji } from '@/components/modals/popoutEmoji';
import { PopoutProfile } from '@/components/modals/popoutProfile';
import { ServerProfileModal } from '@/components/modals/serverProfile';
import { SetRegularStatusModal } from '@/components/modals/setRegularStatusModal';
import { SetStatusModal } from '@/components/modals/setStatus';
import { UserProfileModal } from '@/components/modals/userProfile';
import { useGuildChannelMemoryStore } from '@/stores/gncMemoryStore';
import type { Emoji } from '@/types/guilds';
import { type ModalDataMap, useModal } from './modalContext';
import { type PopupDataMap, type PopupDirection, type PopupType, usePopup } from './popupContext';

export const LayerPortals = (): JSX.Element | null => {
  const { modalType, modalData, closeModal } = useModal();
  const { popups, closePopup } = usePopup();
  const currentGuildId = useGuildChannelMemoryStore((s) => s.currentGuildId);

  const modalPortal = document.getElementById('modal-portal');
  const [viewport, setViewport] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
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
  }, []);

  if (!modalPortal) {
    console.error('Failed to find the modal portal element');
    return null;
  }

  const renderModal = () => {
    switch (modalType) {
      case 'WHATS_IT_GONNA_BE':
        return <JoinOrCreateServerModal />;
      case 'CREATE_SERVER':
        return <CreateServerModal />;
      case 'SET_STATUS':
        return <SetStatusModal />;
      case 'JOIN_SERVER':
        return <JoinServerModal />;
      case 'CLEAR_SELECTED_INSTANCE':
        return <ClearSelectedInstanceModal />;
      case 'CONFIRMATION_CONNECT_P2P':
        return (
          <ConfirmationConnectP2PModal
            {...(modalData as ModalDataMap['CONFIRMATION_CONNECT_P2P'])}
          />
        );
      case 'CONFIRMATION_LEAVE':
        return <ConfirmationLeaveModal {...(modalData as ModalDataMap['CONFIRMATION_LEAVE'])} />;
      case 'CONFIRMATION_DELETE':
        return <ConfirmationDeleteModal {...(modalData as ModalDataMap['CONFIRMATION_DELETE'])} />;
      case 'SERVER_PROFILE':
        return <ServerProfileModal {...(modalData as ModalDataMap['SERVER_PROFILE'])} />;
      case 'IMAGE_PREVIEW':
        return <ImagePreview {...(modalData as ModalDataMap['IMAGE_PREVIEW'])} />;
      case 'DANGER_CONFIRMATION':
        return <DangerConfirmationModal {...(modalData as ModalDataMap['DANGER_CONFIRMATION'])} />;
      default:
        return null;
    }
  };

  const clampPosition = (x: number, y: number, width: number, height: number, padding = 10) => {
    const maxX = Math.max(padding, viewport.width - width - padding);
    const maxY = Math.max(padding, viewport.height - height - padding);

    return {
      x: Math.min(Math.max(x, padding), maxX),
      y: Math.min(Math.max(y, padding), maxY),
    };
  };

  const getDirectionFromAnchor = (
    anchorX: number,
    anchorY: number,
    popupX: number,
    popupY: number,
    popupWidth: number,
    popupHeight: number,
  ): PopupDirection => {
    const popupCenterX = popupX + popupWidth / 2;
    const popupCenterY = popupY + popupHeight / 2;
    const deltaX = popupCenterX - anchorX;
    const deltaY = popupCenterY - anchorY;

    if (Math.abs(deltaX) > Math.abs(deltaY)) {
      return deltaX < 0 ? 'left' : 'right';
    }

    return deltaY < 0 ? 'top' : 'bottom';
  };

  const renderSinglePopup = (popupType: PopupType, popupData: unknown) => {
    if (!popupType || !popupData) return null;

    let content: JSX.Element | null = null;
    let fixedX = 0;
    let fixedY = 0;
    let direction: string | undefined = undefined;
    let currentWidth = 'auto';

    switch (popupType) {
      case 'USER_PROFILE_POPOUT': {
        const data = popupData as PopupDataMap['USER_PROFILE_POPOUT'];
        const popoutHeight = 450;
        const popoutWidth = 300;
        const preferredX = data.x + popoutWidth > viewport.width ? data.x - popoutWidth : data.x;
        const pos = clampPosition(preferredX, data.y, popoutWidth, popoutHeight);
        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '300px';
        direction = data.direction;
        if (!direction) {
          direction = getDirectionFromAnchor(
            data.x,
            data.y,
            fixedX,
            fixedY,
            popoutWidth,
            popoutHeight,
          );
        }
        content = (
          <PopoutProfile member={data.member} roles={data.roles} contextGuildId={currentGuildId} />
        );
        break;
      }
      case 'CURRENT_USER_PROFILE': {
        const data = popupData as PopupDataMap['CURRENT_USER_PROFILE'];
        const popoutHeight = 470;
        const popoutWidth = 340;
        const pos = clampPosition(data.x, data.y, popoutWidth, popoutHeight);
        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '340px';
        direction = data.direction;
        if (!direction) {
          direction = getDirectionFromAnchor(
            data.x,
            data.y,
            fixedX,
            fixedY,
            popoutWidth,
            popoutHeight,
          );
        }
        content = <UserProfileModal />;
        break;
      }
      case 'EMOJI_DETAILS_POPOUT': {
        const data = popupData as PopupDataMap['EMOJI_DETAILS_POPOUT'];
        const popoutHeight = 320;
        const popoutWidth = 280;
        const preferredX =
          data.x + 50 + popoutWidth > viewport.width ? data.x - popoutWidth - 10 : data.x + 50;
        const preferredY = data.y + 100;
        const pos = clampPosition(preferredX, preferredY, popoutWidth, popoutHeight, 20);
        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '280px';
        direction = data.direction;
        if (!direction) {
          direction = getDirectionFromAnchor(
            data.x,
            data.y,
            fixedX,
            fixedY,
            popoutWidth,
            popoutHeight,
          );
        }
        content = (
          <PopoutEmoji
            emoji={data.emoji as Emoji}
            guildIcon={data.guildIcon}
            guildId={data.guildId}
            guildName={data.guildName}
            isPrivate={data.isPrivate}
            isBuiltin={data.isBuiltin}
            unicode={data.unicode}
            sourceSubtext={data.sourceSubtext}
          />
        );
        break;
      }
      case 'SET_STATUS': {
        const data = popupData as PopupDataMap['SET_STATUS'];
        const popoutHeight = 240;
        const popoutWidth = 220;
        const pos = clampPosition(data.x, data.y, popoutWidth, popoutHeight);

        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '220px';
        direction = 'right';

        content = <SetRegularStatusModal />;
        break;
      }
      case 'EMOJI_PICKER': {
        const data = popupData as PopupDataMap['EMOJI_PICKER'];
        const popoutHeight = 440;
        const popoutWidth = 350;
        const pos = clampPosition(
          data.x - popoutWidth,
          data.y - popoutHeight,
          popoutWidth,
          popoutHeight,
        );
        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '350px';
        direction =
          data.direction ||
          getDirectionFromAnchor(
            data.pointerX ?? data.x,
            data.pointerY ?? data.y,
            fixedX,
            fixedY,
            popoutWidth,
            popoutHeight,
          );
        content = (
          <EmojiChooser
            guilds={data.guilds}
            onSelectEmoji={data.onSelectEmoji}
            onClose={closePopup}
            currentGuildId={currentGuildId ?? undefined}
          />
        );
        break;
      }
      case 'GIF_PICKER': {
        const data = popupData as PopupDataMap['GIF_PICKER'];
        const popoutHeight = 440;
        const popoutWidth = 350;
        const pos = clampPosition(
          data.x - popoutWidth,
          data.y - popoutHeight,
          popoutWidth,
          popoutHeight,
        );
        fixedX = pos.x;
        fixedY = pos.y;
        currentWidth = '350px';
        direction =
          data.direction ||
          getDirectionFromAnchor(
            data.pointerX ?? data.x,
            data.pointerY ?? data.y,
            fixedX,
            fixedY,
            popoutWidth,
            popoutHeight,
          );
        content = (
          <GifSearcher
            gifCategories={data.gifCategories ?? []}
            gifs={data.gifs ?? []}
            onSearch={data.onSearch}
            onSelectGif={data.onSelectGif}
            onClose={closePopup}
          />
        );
        break;
      }
    }

    return (
      <div
        className={`popup-wrapper dir-${direction || 'top'}`}
        style={{ top: fixedY, left: fixedX, position: 'fixed', width: currentWidth }}
        role='dialog'
        tabIndex={-1}
      >
        {content}
      </div>
    );
  };

  const isProfile = modalType === 'SERVER_PROFILE';
  const isImagePreview = modalType === 'IMAGE_PREVIEW';
  const modalContents = renderModal();

  const hasPopups = Object.keys(popups).length > 0;

  return (
    <>
      {hasPopups &&
        createPortal(
          <div className='popup-layer'>
            <div
              className='popup-backdrop'
              onClick={() => closePopup()}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') closePopup();
              }}
              role='button'
              tabIndex={0}
              aria-label='Close popup'
            />
            {Object.entries(popups).map(([_type, instance]) =>
              renderSinglePopup(instance.popupType, instance.popupData),
            )}
          </div>,
          modalPortal,
        )}
      {modalType &&
        createPortal(
          <div className={`modal-layer ${isImagePreview ? 'modal-layer-image-preview' : ''}`}>
            <button
              type='button'
              className='modal-backdrop'
              onClick={closeModal}
              aria-label='Close modal'
            />
            <div
              className={`modal-container ${isProfile ? 'modal-container-profile' : ''} ${isImagePreview ? 'modal-container-image-preview' : ''}`}
            >
              {modalContents}
            </div>
          </div>,
          modalPortal,
        )}
    </>
  );
};
