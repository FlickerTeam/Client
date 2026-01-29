import './guildSidebar.css';

import { type JSX } from 'react';
import { Link } from 'react-router-dom';

import type { Guild } from '@/types/guilds';

import { useAssetsUrl } from '../../context/assetsUrl';
import { useContextMenu } from '../../context/contextMenuContext';
import { useGateway } from '../../context/gatewayContext';
import { useModal } from '../../context/modalContext';
import { usePopup } from '../../context/popupContext';
import { getDefaultAvatar } from '../../utils/avatar';

const GuildSidebar = ({
  guilds,
  selectedGuildId,
  onSelectGuild,
}: {
  guilds: Guild[];
  selectedGuildId?: string | null;
  onSelectGuild: (guild: Guild) => void;
}): JSX.Element => {
  const { user } = useGateway();
  const { openModal } = useModal();
  const { openContextMenu } = useContextMenu();
  const { openPopup, popupType } = usePopup();

  const handleLeaveServer = (guild_name: string, guild_id: string) => {
    openModal('CONFIRMATION_LEAVE', { name: guild_name, id: guild_id, type: 'server' });
  };

  const handleDeleteServer = (guild_name: string, guild_id: string) => {
    openModal('CONFIRMATION_DELETE', { name: guild_name, id: guild_id, type: 'server' });
  };

  const handleRightClick = (e: React.MouseEvent, guild: Guild) => {
    e.preventDefault();

    const isOwner = guild.owner_id === user?.id;

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <div className='button'>Change nickname</div>
        {!isOwner && (
          <>
            <hr />
            <button
              className='primary-btn button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleLeaveServer(guild.name, guild.id);
              }}
            >
              Leave Server
            </button>
          </>
        )}
        {isOwner && (
          <>
            <hr />
            <div className='button'>Server Settings</div>
            <button
              className='primary-button button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleDeleteServer(guild.name, guild.id);
              }}
            >
              Delete Server
            </button>
          </>
        )}
      </div>,
    );
  };

  const UserAvatar = () => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(user) ?? ''}.png`,
    );
    const customAvatarUrl = user?.avatar
      ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${user.id}/${user.avatar}.png`
      : defaultAvatarUrl;

    return (
      <img
        src={customAvatarUrl || ''}
        alt='User Avatar'
        className='guild-user-avatar'
        onError={() => {
          rollover();
        }}
      />
    );
  };

  const isUserPopupOpen = popupType === 'CURRENT_USER_PROFILE';

  const handleImgError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    e.currentTarget.style.display = 'none';
  };

  return (
    <div id='guilds-column'>
      <div className='home-section'>
        <button className='guild-icon-wrapper home-wrapper'>
          {!selectedGuildId && (
            <div className='selected-indicator-bg'>
              <div className='selected-gradient' />
            </div>
          )}
          <Link to='/channels/@me' className='home-btn-link'>
            <div className='icon-container shadow-container'>
              <div className='guild-icon home-icon'>
                <span className='material-symbols-rounded' style={{ fontSize: '28px' }}>
                  home
                </span>
              </div>
            </div>
          </Link>
        </button>
        <div className='online-stats'>
          <span className='stat-text'>1 ONLINE</span>
          <div className='stat-line' />
        </div>
      </div>

      <div className='server-section'>
        {guilds.map((guild: Guild) => (
          <button
            className={`guild-icon-wrapper ${selectedGuildId === guild.id ? 'selected' : ''}`}
            key={guild.id}
            onClick={() => {
              onSelectGuild(guild);
            }}
            onContextMenu={(e) => {
              handleRightClick(e, guild);
            }}
          >
            {selectedGuildId === guild.id && (
              <div className='selected-indicator-bg'>
                <div className='selected-gradient' />
              </div>
            )}
            <div className='icon-container'>
              {guild.icon ? (
                <img
                  className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''}`}
                  src={`${localStorage.getItem('selectedCdnUrl') ?? ''}/icons/${guild.id}/${guild.icon}.png`}
                  alt={guild.name}
                  onError={handleImgError}
                />
              ) : (
                <div
                  className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''} no-icon`}
                >
                  {guild.name.charAt(0)}
                </div>
              )}
            </div>
          </button>
        ))}

        <button
          className={`guild-icon-wrapper`}
          key={`add-guild`}
          onClick={() => {
            openModal('WHATS_IT_GONNA_BE');
          }}
        >
          <div className='icon-container'>
            <div className={`guild-icon no-icon add-icon`}>
              <span
                className='material-symbols-rounded'
                style={{ fontSize: '24px', color: '#23a559' }}
              >
                add
              </span>
            </div>
          </div>
        </button>
      </div>

      <div className='user-section'>
        <button
          className={`guild-icon-wrapper ${isUserPopupOpen ? 'selected' : ''}`}
          onClick={(e) => {
            if (isUserPopupOpen) return;
            const rect = e.currentTarget.getBoundingClientRect();
            openPopup('CURRENT_USER_PROFILE', {
              x: 12,
              y: rect.bottom - 440,
            });
          }}
        >
          {isUserPopupOpen && (
            <div className='selected-indicator-bg'>
              <div className='selected-gradient' />
            </div>
          )}
          <div className='icon-container'>
            <div className='guild-icon no-icon user-icon-container'>
              <div className='guild-user-avatar-wrapper'>
                <UserAvatar />
              </div>
              <div className='user-status-indicator'>
                <div className='status-indicator-wrapper'>
                  <div className='status-dot-large online'></div>
                </div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GuildSidebar;
