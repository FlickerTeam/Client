import './userProfile.css';

import type { KeyboardEvent, MouseEvent } from 'react';
import { type JSX, useMemo, useState } from 'react';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useGateway } from '@/context/gatewayContext';
import { useModal } from '@/layering/modalContext';
import { usePopup } from '@/layering/popupContext';
import type { Member } from '@/types/guilds';
import type { User } from '@/types/users';
import { getDefaultAvatar } from '@/utils/avatar';
import { useUiUtilityActions } from '@/utils/uiUtils';

export const UserProfileModal = (): JSX.Element => {
  const { user, sessions, getPresence } = useGateway();
  const { openModal } = useModal();
  const { closePopup, openPopup } = usePopup();
  const { openFullProfile } = useUiUtilityActions(null);

  const { url: defaultAvatarUrl, rollover } = useAssetsUrl(`/assets/${getDefaultAvatar(user)}.png`);
  const cdnUrl = useMemo(() => localStorage.getItem('selectedCdnUrl'), []);

  const customAvatarUrl = user?.avatar
    ? `${cdnUrl ?? ''}/avatars/${user.id}/${user.avatar}.png`
    : null;

  const currentAvatarUrl = customAvatarUrl ?? defaultAvatarUrl;
  const [avatarSrc, setAvatarSrc] = useState(currentAvatarUrl);
  const [prevUrl, setPrevUrl] = useState(currentAvatarUrl);

  if (currentAvatarUrl !== prevUrl) {
    setPrevUrl(currentAvatarUrl);
    setAvatarSrc(currentAvatarUrl);
  }

  function getInstance() {
    try {
      const fullApiUrl = localStorage.getItem('selectedInstanceUrl');
      const urlObj = new URL(fullApiUrl ?? '');
      return urlObj.host;
    } catch {
      return '';
    }
  }

  const bannerUrl = user?.banner
    ? `url('${cdnUrl ?? ''}/banners/${user.id}/${user.banner}.png')`
    : 'none';

  const accentColor = user?.accent_color
    ? `#${user.accent_color.toString(16).padStart(6, '0')}`
    : 'var(--bg-sidebar-secondary)';

  const handleCopyUserId = () => {
    if (user?.id) {
      closePopup();
      void navigator.clipboard.writeText(user.id);
    }
  };

  const handleSetCustomStatus = () => {
    openModal('SET_STATUS');
    closePopup();
  };

  const handleSwitchAccount = () => {
    openModal('SWITCH_ACCOUNT');
    closePopup();
  };

  const handleSetStatus = (e: MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();

    const x = rect.right + 8;
    const y = rect.top - 120;

    openPopup('SET_STATUS', {
      x,
      y,
      direction: 'right',
    });
  };

  const handleOpenSettings = () => {
    window.dispatchEvent(new CustomEvent('ui_open_settings'));
    closePopup();
  };

  const viewUserProfile = (user: User) => {
    if (user?.id) {
      closePopup();

      const presence = getPresence(user.id);
      const status = presence?.status ?? 'offline';

      const memberObj: Member = {
        id: user?.id,
        user: user,
        presence: {
          user: user,
          status: status,
          activities: [],
        },
        joined_at: new Date().toISOString(),
        roles: [],
      };

      void openFullProfile(memberObj);
    }
  };

  const activeSession = sessions.find((s) => s.active === true);
  const status =
    activeSession?.status ??
    sessions[0]?.status ??
    (user?.id ? getPresence(user.id)?.status : undefined) ??
    'offline';

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
              <div className={`status-dot-large ${status}`} />
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
            {user?.bot && (
              <span
                className='bot-tag'
                style={{
                  bottom: '3px',
                }}
              >
                Bot
              </span>
            )}
          </div>
          <div className='icon-btn-small' title='Switch account' onClick={handleSwitchAccount}>
            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
              switch_account
            </span>
          </div>
          <div
            className='icon-btn-small'
            title={`View user profile`}
            onClick={(e: MouseEvent<HTMLDivElement>) => {
              e.preventDefault();
              e.stopPropagation();

              if (user) {
                viewUserProfile(user);
              }
            }}
            tabIndex={0}
            role='button'
            onKeyDown={(e: KeyboardEvent<HTMLDivElement>) => {
              if (e.key === 'Enter' || e.key === ' ') {
                e.preventDefault();
                e.stopPropagation();

                if (user) {
                  viewUserProfile(user);
                }
              }
            }}
          >
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
        <div className='pronouns-row-profile'>
          <span className='discriminator'>{getInstance()}</span>
        </div>
      </div>

      <div className='profile-actions'>
        <div className='action-row clickable'>
          <div className='action-content action' onClick={handleSetCustomStatus}>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                add_reaction
              </span>
            </div>
            <p className='action-text'>Set a custom status</p>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              gap: '5px',
            }}
            className='action'
            onClick={(e) => handleSetStatus(e)}
          >
            <div className='action-status-icon'>
              <div className='status-indicator-wrapper'>
                <div className={`status-dot ${status}`} />
              </div>
            </div>
            <div className='icon-btn-small'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                chevron_right
              </span>
            </div>
          </div>
        </div>

        <div className='divider' style={{ borderBottom: '1px solid var(--bg-alt)' }} />

        <button className='action-row centered clickable' onClick={handleOpenSettings}>
          <div className='action-content action'>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                settings
              </span>
            </div>
            <p className='action-text'>Settings</p>
          </div>
        </button>

        <button className='action-row centered clickable' onClick={handleCopyUserId}>
          <div className='action-content action'>
            <div className='action-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                account_box
              </span>
            </div>
            <p
              className='action-text'
              onClick={() => {
                void navigator.clipboard.writeText(user?.id ?? '');
                closePopup();
              }}
            >
              Copy User ID
            </p>
          </div>
        </button>
      </div>
    </div>
  );
};
