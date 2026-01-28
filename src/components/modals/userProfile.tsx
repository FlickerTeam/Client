import './userProfile.css';

import { type JSX, useState } from 'react';

import { useAssetsUrl } from '../../context/assetsUrl';
import { useGateway } from '../../context/gatewayContext';
import { usePopup } from '../../context/popupContext';
import { getDefaultAvatar } from '../../utils/avatar';

export const UserProfileModal = (): JSX.Element => {
  const { user } = useGateway();
  const { closePopup } = usePopup();

  const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
    `/assets/${getDefaultAvatar(user) ?? ''}.png`,
  );
  const customAvatarUrl = user?.avatar
    ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${user.id}/${user.avatar}.png`
    : null;

  const currentAvatarUrl = customAvatarUrl ?? defaultAvatarUrl;
  const [avatarSrc, setAvatarSrc] = useState(currentAvatarUrl);
  const [prevUrl, setPrevUrl] = useState(currentAvatarUrl);

  if (currentAvatarUrl !== prevUrl) {
    setPrevUrl(currentAvatarUrl);
    setAvatarSrc(currentAvatarUrl);
  }

  const bannerUrl = user?.banner
    ? `url('${localStorage.getItem('selectedCdnUrl') ?? ''}/banners/${user.id}/${user.banner}.png')`
    : 'none';

  const accentColor = user?.accent_color
    ? `#${user.accent_color.toString(16).padStart(6, '0')}`
    : 'var(--bg-sidebar-secondary)';

  const handleCopyUserId = () => {
    if (user?.id) {
      void navigator.clipboard.writeText(user.id);
    }
  };

  const handleOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('ui_open_settings'));
    closePopup();
  };

  return (
    <div className='user-profile-modal'>
      <div className='profile-header'>
        <div
          className='profile-banner'
          style={{
            backgroundImage: bannerUrl,
            backgroundColor: bannerUrl === 'none' ? accentColor : undefined,
          }}
        />
        <div className='profile-picture-wrapper'>
          <div className='profile-picture-container'>
            <img
              src={avatarSrc}
              alt='Profile'
              className='profile-picture'
              onError={() => {
                if (customAvatarUrl && avatarSrc === customAvatarUrl) {
                  setAvatarSrc(defaultAvatarUrl);
                } else {
                  rollover();
                }
              }}
            />
            <div className='status-indicator-wrapper'>
              <div className='status-dot-large online' />
            </div>
          </div>
        </div>
      </div>

      <div className='profile-info'>
        <div className='profile-identity'>
          <div className='profile-names'>
            <span className='username'>{user?.global_name ?? user?.username ?? 'User'}</span>
            <span className='discriminator'>
              {user?.username ?? 'User'}#{user?.discriminator.padStart(4, '0')}
            </span>
          </div>
          <div className='icon-btn-small'>
            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
              switch_account
            </span>
          </div>
          <div className='icon-btn-small'>
            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
              chevron_right
            </span>
          </div>
        </div>
        {user?.pronouns && (
          <div className='pronouns-row-profile'>
            <span className='pronouns'>{user.pronouns}</span>
          </div>
        )}
      </div>

      <div className='profile-actions'>
        <div className='action-row'>
          <div className='action-content'>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                add_reaction
              </span>
            </div>
            <p className='action-text'>Set a custom status</p>
          </div>
          <div className='action-status-icon'>
            <span
              className='material-symbols-rounded'
              style={{ fontSize: '16px', color: '#23a559' }}
            >
              circle
            </span>
          </div>
          <div className='icon-btn-small'>
            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
              chevron_right
            </span>
          </div>
        </div>

        <div className='divider' style={{ borderBottom: '1px solid var(--bg-alt)' }} />

        <button className='action-row centered clickable' onClick={handleOpenSettings}>
          <div className='action-content'>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                settings
              </span>
            </div>
            <p className='action-text'>Settings</p>
          </div>
        </button>

        <button className='action-row centered clickable' onClick={handleCopyUserId}>
          <div className='action-content'>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                account_box
              </span>
            </div>
            <p className='action-text'>Copy User ID</p>
          </div>
        </button>
      </div>
    </div>
  );
};
