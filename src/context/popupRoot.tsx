import './popup.css';

import { createPortal } from 'react-dom';

import { PopoutProfile } from '../components/modals/popoutProfile';
import { UserProfileModal } from '../components/modals/userProfile';
import { type PopupDataMap, usePopup } from './popupContext';

export const PopupRoot = () => {
  const { popupType, popupData, closePopup } = usePopup();

  if (!popupType) return null;

  const renderPopup = () => {
    switch (popupType) {
      case 'USER_PROFILE_POPOUT': {
        const data = popupData as PopupDataMap['USER_PROFILE_POPOUT'];

        return (
          <div
            className='popup-wrapper'
            style={{ top: data.y, left: data.x, position: 'fixed' }}
            role='dialog'
            tabIndex={-1}
          >
            <PopoutProfile member={data.member} roles={data.roles} />
          </div>
        );
      }
      case 'CURRENT_USER_PROFILE': {
        const data = popupData as PopupDataMap['CURRENT_USER_PROFILE'];

        return (
          <div
            className='popup-wrapper'
            style={{ top: data.y, left: data.x, position: 'fixed' }}
            role='dialog'
            tabIndex={-1}
          >
            <UserProfileModal />
          </div>
        );
      }
      default:
        return null;
    }
  };

  const modalPortal = document.getElementById('modal-portal');

  if (modalPortal) {
    return createPortal(
      <>
        <div
          className='popup-backdrop'
          onClick={closePopup}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') closePopup();
          }}
          role='button'
          tabIndex={0}
          aria-label='Close popup'
        />
        {renderPopup()}
      </>,
      modalPortal,
    );
  } else {
    console.error('Failed to find the modal portal element');
    return null;
  }
};
