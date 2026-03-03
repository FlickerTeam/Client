import './settings.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useEffect, useRef, useState } from 'react';
import type { User } from 'shared';
import { patch } from 'shared';
import { getDefaultAvatar } from 'shared';
import { logger } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useTheme } from '@/context/themeContext';
import { useModal } from '@/layering/modalContext';

interface SettingsProps {
  user: User | null;
  onClose: () => void;
}

interface DevSettings {
  log_gateway: boolean;
  webrtc_p2p: boolean;
  popout_console: boolean;
}

const DefaultDevSettings: DevSettings = {
  log_gateway: false,
  webrtc_p2p: false,
  popout_console: false,
};

const Settings = ({ user, onClose }: SettingsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState('My Account');
  const [tempUser, setTempUser] = useState<
    (User & { current_password?: string; new_password?: string | null }) | null
  >(user);
  const { isDarkMode, toggleTheme } = useTheme();
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [errorUpdatingMsg, setErrorUpdatingMsg] = useState('');
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);
  const [editingProfile, setEditingProfile] = useState(false);
  const { openModal, closeModal } = useModal();
  const [devSettings, setDevSettings] = useState(() => {
    const saved = localStorage.getItem('developerSettings');

    return saved ? (JSON.parse(saved) as DevSettings) : DefaultDevSettings;
  });
  const { cdnUrl } = useConfig();

  const { url: defaultAvatarUrl } = useAssetsUrl(`/assets/${getDefaultAvatar(user) ?? ''}.png`);

  const activeUser = editingProfile ? tempUser : user;

  const avatarUrl = activeUser?.avatar
    ? activeUser.avatar.startsWith('data:')
      ? activeUser.avatar
      : `${cdnUrl ?? ''}/avatars/${user?.id ?? ''}/${activeUser.avatar ?? ''}.png`
    : defaultAvatarUrl;

  const bannerUrl = activeUser?.banner
    ? activeUser.banner.startsWith('data:')
      ? activeUser.banner
      : `${cdnUrl ?? ''}/banners/${user?.id ?? ''}/${activeUser.banner ?? ''}.png`
    : '';

  const maskEmail = (email: string | undefined) => {
    if (!email) return '****@gmail.com';

    const [username, domain] = email.split('@');

    if (!username || username.length <= 2) {
      return `*@${String(domain)}`;
    }

    return `${email.slice(0, 2)}***@${String(domain)}`;
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      setTempUser((prev) => (prev ? { ...prev, [type]: base64String } : null));
    };
    reader.readAsDataURL(file);
  };

  const handleLogout = () => {
    openModal('DANGER_CONFIRMATION', {
      title: 'Are you sure you want to logout?',
      body: 'You will remain on the same instance unless configured in the signup or login page.',
      onCancel: () => {
        closeModal();
      },
      onConfirm: () => {
        localStorage.removeItem('selectedAuthorization');
        localStorage.removeItem('selectedEmail');
        location.reload();
      },
    });
  };

  const handleSaveProfile = async () => {
    if (!tempUser || !user) return;

    try {
      const profilePayload: {
        pronouns?: string | null | undefined;
        bio?: string | null | undefined;
        accent_color?: number | null | undefined;
      } = {};

      if (tempUser.pronouns !== user.pronouns) {
        profilePayload.pronouns = tempUser.pronouns;
      }

      if (tempUser.bio !== user.bio) {
        profilePayload.bio = tempUser.bio;
      }

      if (tempUser.accent_color !== user.accent_color) {
        profilePayload.accent_color = tempUser.accent_color;
      }

      const accountPayload: {
        username?: string;
        discriminator?: string;
        global_name?: string | null | undefined;
        email?: string | null | undefined;
        avatar?: string | null | undefined;
        banner?: string | null | undefined;
        password?: string;
        new_password?: string;
      } = {};

      if (tempUser.username !== user.username) {
        accountPayload.username = tempUser.username;
      }

      if (tempUser.discriminator !== user.discriminator) {
        accountPayload.discriminator = tempUser.discriminator;
      }

      if (tempUser.global_name !== user.global_name) {
        accountPayload.global_name = tempUser.global_name;
      }

      if (tempUser.email !== user.email) {
        accountPayload.email = tempUser.email;
      }

      if (tempUser.avatar !== user.avatar) {
        accountPayload.avatar = tempUser.avatar;
      }

      if (tempUser.banner !== user.banner) {
        accountPayload.banner = tempUser.banner;
      }

      if (tempUser.current_password) {
        accountPayload.password = tempUser.current_password;

        if (tempUser.new_password) {
          accountPayload.new_password = tempUser.new_password;
        }
      }

      const promises = [];

      if (Object.keys(accountPayload).length > 0) {
        promises.push(patch<User>(`/users/@me`, accountPayload));
      } else {
        promises.push(Promise.resolve(user));
      }

      if (Object.keys(profilePayload).length > 0) {
        promises.push(patch<User>(`/users/@me/profile`, profilePayload));
      } else {
        promises.push(Promise.resolve({}));
      }

      const [accountRes, profileRes] = await Promise.all(promises);
      const updatedUser = { ...user, ...accountRes, ...profileRes };

      setEditingProfile(false);
      setShowNewPassword(false);
      setTempUser({ ...updatedUser, current_password: '', new_password: '' });
    } catch (error) {
      logger.error(`SETTINGS`, 'Error saving profile', error);
      setErrorUpdatingMsg(
        `Failed to update account information. Make sure your password is correct.`,
      );
    }
  };

  const renderTab = () => {
    switch (activeTab) {
      case 'My Account':
        return (
          <div className='settings-section'>
            <div className='settings-header'>
              <h1>My Account</h1>
            </div>
            <div
              className={`banner-display ${editingProfile ? 'editable-media' : ''}`}
              style={{
                backgroundImage: `url(${bannerUrl})`,
                backgroundColor: '#2b2d31',
                cursor: editingProfile ? 'pointer' : 'default',
              }}
              onClick={() => editingProfile && bannerInputRef.current?.click()}
            >
              <input
                type='file'
                ref={bannerInputRef}
                style={{ display: 'none' }}
                accept='image/*'
                onChange={(e) => {
                  handleFileChange(e, 'banner');
                }}
              />
              {editingProfile && (
                <div className='media-overlay'>
                  <span className='material-symbols-rounded'>edit</span>
                  <p style={{ fontSize: '12px', fontWeight: 'bold', marginTop: '5px' }}>
                    {!user?.banner && !tempUser?.banner ? 'ADD BANNER' : 'CHANGE BANNER'}
                  </p>
                </div>
              )}
            </div>
            <div className='account-card'>
              {tempUser?.banner && editingProfile ? (
                <>
                  <div
                    style={{
                      position: 'relative',
                      display: 'flex',
                      justifyContent: 'center',
                    }}
                  >
                    <button
                      type='button'
                      style={{
                        color: 'var(--bg-dnd)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        textDecoration: 'none',
                        border: 'none',
                        padding: 0,
                        background: 'none',
                      }}
                      onClick={() => {
                        setTempUser({
                          ...tempUser,
                          banner: null,
                        });
                      }}
                    >
                      Remove Banner
                    </button>
                  </div>
                </>
              ) : (
                <></>
              )}
              <div className='account-info-grid'>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '8px',
                  }}
                >
                  <div
                    className={`profile-picture ${editingProfile ? 'editable-media' : ''}`}
                    style={{ position: 'relative', overflow: 'hidden' }}
                    onClick={() => editingProfile && avatarInputRef.current?.click()}
                  >
                    <input
                      type='file'
                      ref={avatarInputRef}
                      style={{ display: 'none' }}
                      accept='image/*'
                      onChange={(e) => {
                        handleFileChange(e, 'avatar');
                      }}
                    />
                    <img
                      src={tempUser?.avatar?.startsWith('data:') ? tempUser.avatar : avatarUrl}
                      className='profile-picture'
                      alt='Avatar'
                    />
                    {editingProfile && (
                      <div className='media-overlay'>
                        <span className='material-symbols-rounded'>add_a_photo</span>
                        <p style={{ fontSize: '10px', fontWeight: 'bold' }}>CHANGE</p>
                      </div>
                    )}
                  </div>
                  {editingProfile && tempUser?.avatar && (
                    <button
                      type='button'
                      style={{
                        background: 'none',
                        border: 'none',
                        padding: 0,
                        color: 'var(--bg-dnd)',
                        fontSize: '12px',
                        cursor: 'pointer',
                        fontWeight: '500',
                        marginTop: '15px',
                        textDecoration: 'none',
                      }}
                      onClick={() => {
                        if (tempUser) {
                          setTempUser({
                            ...tempUser,
                            avatar: null,
                          });
                        }
                      }}
                    >
                      Remove Avatar
                    </button>
                  )}
                </div>

                <div className='account-info-wrapper'>
                  {errorUpdatingMsg && <p className='failed-to-update'>{errorUpdatingMsg}</p>}
                  <div className='account-info-section'>
                    <div style={{ width: '100%' }}>
                      <p className='info-label'>USERNAME</p>
                      {editingProfile ? (
                        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <input
                            className='edit-input'
                            style={{ flex: 3 }}
                            value={tempUser?.username || ''}
                            onChange={(e) => {
                              if (!tempUser) {
                                return;
                              }
                              setTempUser({ ...tempUser, username: e.target.value });
                            }}
                          />
                          {tempUser?.discriminator !== '0' && (
                            <>
                              <div
                                style={{
                                  color: 'var(--text-muted)',
                                  fontSize: '20px',
                                  marginTop: '5px',
                                }}
                              >
                                #
                              </div>
                              <input
                                className='edit-input'
                                type='text'
                                inputMode='numeric'
                                style={{ flex: 1 }}
                                maxLength={4}
                                value={tempUser?.discriminator || ''}
                                onChange={(e) => {
                                  if (!tempUser) {
                                    return;
                                  }

                                  const val = e.target.value;

                                  if (val === '' || /^\d+$/.test(val)) {
                                    setTempUser({ ...tempUser, discriminator: val });
                                  }
                                }}
                                onBlur={(e) => {
                                  if (!tempUser) {
                                    return;
                                  }

                                  const val = e.target.value;

                                  if (val.length > 0) {
                                    const padded = val.padStart(4, '0');
                                    setTempUser({ ...tempUser, discriminator: padded });
                                  }
                                }}
                              />
                            </>
                          )}
                        </div>
                      ) : (
                        <p className='info-value'>
                          {(user?.discriminator === '0' || user?.discriminator === '0000') && '@'}
                          {user?.username ?? 'User'}
                          {user?.discriminator !== '0' && user?.discriminator !== '0000' && (
                            <span className='discriminator'>#{user?.discriminator ?? '0000'}</span>
                          )}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className='account-info-section'>
                    <div style={{ width: '100%' }}>
                      <p className='info-label'>EMAIL</p>
                      {editingProfile ? (
                        <input
                          className='edit-input'
                          placeholder='Add email'
                          value={tempUser?.email || ''}
                          onChange={(e) => {
                            if (!tempUser) {
                              return;
                            }

                            setTempUser({ ...tempUser, email: e.target.value });
                          }}
                        />
                      ) : (
                        <p className='info-value'>{maskEmail(user?.email ?? undefined)}</p>
                      )}
                    </div>
                  </div>
                  {editingProfile && (
                    <div className='account-info-section'>
                      <div style={{ width: '100%' }}>
                        <p className='info-label required-input'>CURRENT PASSWORD</p>
                        <input
                          type='password'
                          className='edit-input'
                          placeholder=''
                          value={tempUser?.current_password || ''}
                          onChange={(e) => {
                            if (!tempUser) {
                              return;
                            }

                            setTempUser({ ...tempUser, current_password: e.target.value });
                          }}
                        />
                        {!showNewPassword ? (
                          <div style={{ marginTop: '12px' }}>
                            <button
                              type='button'
                              style={{
                                color: '#00a8fc',
                                cursor: 'pointer',
                                fontSize: '12px',
                                background: 'none',
                                padding: 0,
                                border: 'none',
                                textDecoration: 'none',
                              }}
                              onClick={() => {
                                setShowNewPassword(true);
                              }}
                            >
                              Change Password?
                            </button>
                          </div>
                        ) : (
                          <div style={{ marginTop: '15px' }}>
                            <p className='info-label'>NEW PASSWORD</p>
                            <input
                              type='password'
                              className='edit-input'
                              placeholder='Enter new password'
                              value={tempUser?.new_password || ''}
                              onChange={(e) => {
                                if (!tempUser) {
                                  return;
                                }

                                setTempUser({ ...tempUser, new_password: e.target.value });
                              }}
                            />
                            <div style={{ marginTop: '8px' }}>
                              <button
                                type='button'
                                style={{
                                  color: 'var(--text-muted)',
                                  cursor: 'pointer',
                                  fontSize: '12px',
                                  textDecoration: 'none',
                                  border: 'none',
                                  background: 'none',
                                  padding: 0,
                                }}
                                onClick={() => {
                                  setShowNewPassword(false);
                                }}
                              >
                                Cancel Password Change
                              </button>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className='account-card' style={{ marginTop: '-20px' }}>
              <div className='account-info-grid'>
                <div className='account-info-wrapper'>
                  <div className='account-info-section'>
                    <div style={{ width: '100%' }}>
                      <p className='info-label'>GLOBAL NAME</p>
                      {editingProfile ? (
                        <input
                          className='edit-input'
                          placeholder='Add global name'
                          value={tempUser?.global_name || ''}
                          onChange={(e) => {
                            if (!tempUser) {
                              return;
                            }

                            setTempUser({ ...tempUser, global_name: e.target.value });
                          }}
                        />
                      ) : (
                        <p className='info-value'>{user?.global_name ?? user?.username}</p>
                      )}
                    </div>
                  </div>
                  <div className='account-info-section'>
                    <div style={{ width: '100%' }}>
                      <p className='info-label'>PRONOUNS</p>
                      {editingProfile ? (
                        <input
                          className='edit-input'
                          placeholder='Add pronouns'
                          value={tempUser?.pronouns || ''}
                          onChange={(e) => {
                            if (!tempUser) {
                              return;
                            }

                            setTempUser({ ...tempUser, pronouns: e.target.value });
                          }}
                        />
                      ) : (
                        <p className='info-value'>{user?.pronouns ?? 'Not set'}</p>
                      )}
                    </div>
                  </div>
                  <div className='account-info-section'>
                    <div style={{ width: '100%' }}>
                      <p className='info-label'>ABOUT ME</p>
                      {editingProfile ? (
                        <textarea
                          className='edit-input'
                          style={{ minHeight: '80px', resize: 'none' }}
                          placeholder='Add about me'
                          value={tempUser?.bio || ''}
                          onChange={(e) => {
                            if (!tempUser) {
                              return;
                            }

                            setTempUser({ ...tempUser, bio: e.target.value });
                          }}
                        />
                      ) : (
                        <p className='info-value'>{user?.bio || 'Not set'}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {editingProfile ? (
                <div className='edit-actions' style={{ marginTop: '20px' }}>
                  <button
                    className='cancel-btn'
                    onClick={() => {
                      setEditingProfile(false);
                      setTempUser(user);
                      setErrorUpdatingMsg('');
                      setShowNewPassword(false);
                    }}
                  >
                    Cancel
                  </button>
                  <button
                    className='save-btn'
                    onClick={() => {
                      void handleSaveProfile();
                    }}
                  >
                    Save Changes
                  </button>
                </div>
              ) : (
                <button
                  className='edit-btn'
                  style={{ width: '100%' }}
                  onClick={() => {
                    setEditingProfile(true);
                  }}
                >
                  Edit Profile
                </button>
              )}
            </div>
          </div>
        );
      case 'Developer Options':
        return (
          <div className='settings-section'>
            <div className='settings-header'>
              <h1>Developer Options</h1>
            </div>
            <div className='account-card'>
              <div className='account-info-grid'>
                <div className='account-info-wrapper'>
                  <div key='popout-console'>
                    <div className='account-info-section'>
                      <p className='info-label'>Popout console</p>
                      <p className='info-value'>
                        <input
                          type={'checkbox'}
                          className='info-checkbox'
                          checked={devSettings.popout_console}
                          onChange={(e) => {
                            const updatedSettings = {
                              ...devSettings,
                              popout_console: e.target.checked,
                            };

                            setDevSettings(updatedSettings);

                            localStorage.setItem(
                              'developerSettings',
                              JSON.stringify(updatedSettings),
                            );
                          }}
                        ></input>
                      </p>
                    </div>
                    <div className='account-info-section'>
                      <p
                        className='info-value'
                        style={{
                          fontWeight: '400',
                          marginTop: '10px',
                        }}
                      >
                        Displays a console for easy logging that pops out of the client, and can be
                        dragged/resized at will.
                      </p>
                    </div>
                  </div>
                  <div key='log-gateway'>
                    <div className='account-info-section'>
                      <p className='info-label'>Log Gateway</p>
                      <p className='info-value'>
                        <input
                          type={'checkbox'}
                          className='info-checkbox'
                          checked={devSettings.log_gateway}
                          onChange={(e) => {
                            const updatedSettings = {
                              ...devSettings,
                              log_gateway: e.target.checked,
                            };

                            setDevSettings(updatedSettings);

                            localStorage.setItem(
                              'developerSettings',
                              JSON.stringify(updatedSettings),
                            );
                          }}
                        ></input>
                      </p>
                    </div>
                    <div className='account-info-section'>
                      <p
                        className='info-value'
                        style={{
                          fontWeight: '400',
                          marginTop: '10px',
                        }}
                      >
                        Logs gateway events, packets, data to the console.
                      </p>
                    </div>
                  </div>
                  <div key='webrtc-p2p'>
                    <div className='account-info-section'>
                      <p className='info-label'>WebRTC P2P</p>
                      <p className='info-value'>
                        <input
                          type={'checkbox'}
                          className='info-checkbox'
                          checked={devSettings.webrtc_p2p}
                          onChange={(e) => {
                            const updatedSettings = {
                              ...devSettings,
                              webrtc_p2p: e.target.checked,
                            };

                            setDevSettings(updatedSettings);

                            localStorage.setItem(
                              'developerSettings',
                              JSON.stringify(updatedSettings),
                            );
                          }}
                        ></input>
                      </p>
                    </div>
                    <div className='account-info-section'>
                      <p
                        className='info-value'
                        style={{
                          fontWeight: '400',
                          marginTop: '10px',
                        }}
                      >
                        Enables usage of webrtc-p2p for voice calls.{' '}
                        <b>
                          This will expose your public IP to others in the call, re-consider before
                          enabling.
                        </b>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );
      default:
        return <></>;
    }
  };

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  return (
    <div className='settings-overlay layer-screen'>
      <div className='settings-sidebar-wrapper'>
        <OverlayScrollbarsComponent
          element='nav'
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
          className='settings-sidebar scroller-hide'
        >
          <div className='search-bar-container'>
            <div className='search-bar'>
              <span className='material-symbols-rounded search-icon' style={{ fontSize: '20px' }}>
                search
              </span>
              <input type='text' placeholder='Search Settings' className='search-input' />
            </div>
          </div>

          <div className='sidebar-group'>
            <div className='sidebar-category'>User Settings</div>
            <button
              className={`sidebar-item ${activeTab === 'My Account' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('My Account');
              }}
            >
              My Account
            </button>
          </div>

          <div className='sidebar-group'>
            <div className='sidebar-category'>App Settings</div>
            <button
              className={`sidebar-item ${activeTab === 'Developer Options' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Developer Options');
              }}
            >
              Developer Options
            </button>
          </div>

          <div className='divider-container'>
            <hr
              style={{
                height: '1px',
                boxShadow: 'var(--modifier-accent-outline-top)',
              }}
            />
          </div>

          <div className='sidebar-group'>
            <button className='sidebar-item logout' onClick={handleLogout}>
              Log Out
            </button>
          </div>

          <div className='divider-container'>
            <hr
              style={{
                height: '1px',
                boxShadow: 'var(--modifier-accent-outline-top)',
              }}
            />
          </div>

          <div className='version-info'>
            <span className='version-text'>Development 0.1.0</span>
          </div>
          <div className='sidebar-group'>
            <button
              className='sidebar-item theme-toggle'
              onClick={toggleTheme}
              title={isDarkMode ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              <span className='material-symbols-rounded'>
                {isDarkMode ? 'light_mode' : 'dark_mode'}
              </span>
            </button>
          </div>
        </OverlayScrollbarsComponent>
      </div>

      <OverlayScrollbarsComponent
        element='div'
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
        className='settings-content-wrapper scroller'
      >
        <div className='settings-content-layout'>
          <div className='settings-main-content'>{renderTab()}</div>
          <div className='close-btn-container'>
            <button className='close-btn' onClick={onClose}>
              <div className='close-circle'>
                <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                  close
                </span>
              </div>
              <span className='esc-text'>ESC</span>
            </button>
          </div>
        </div>
      </OverlayScrollbarsComponent>
    </div>
  );
};

export default Settings;
