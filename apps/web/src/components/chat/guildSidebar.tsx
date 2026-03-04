import './guildSidebar.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import type { Channel, Guild } from 'shared';
import { getDefaultAvatar, webAssets } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { useMenuOverlay } from '@/layering/menuOverlayStore';
import { useModal } from '@/layering/modalContext';
import { usePopup } from '@/layering/popupContext';

const GuildSidebar = ({
  privateChannels,
  guilds,
  unreads,
  mentions,
  privateChannelMentions,
  selectedGuildId,
  onSelectGuild,
  markAsRead,
}: {
  privateChannels: Channel[]; //yeah okay i get it, private channels in a GUILD sidebar. boohoo
  guilds: Guild[];
  unreads: Map<string, Set<string>>;
  mentions: Map<string, Map<string, number>>;
  privateChannelMentions: Map<string, number>;
  selectedGuildId?: string | null;
  onSelectGuild: (guild: Guild) => void;
  markAsRead: (guild_id: string) => Promise<void>;
}): JSX.Element => {
  const { user, sessions, relationships, getPresence } = useGateway();
  const navigate = useNavigate();
  const { openModal } = useModal();
  const { openContextMenu } = useMenuOverlay();
  const { openPopup, popupType } = usePopup();

  const handleLeaveServer = (guild_name: string, guild_id: string) => {
    openModal('CONFIRMATION_LEAVE', { name: guild_name, id: guild_id, type: 'server' });
  };

  const handleDeleteServer = (guild_id: string) => {
    openModal('CONFIRMATION_DELETE', { id: guild_id, type: 'server' });
  };

  const handleRightClick = (e: React.MouseEvent, guild: Guild) => {
    e.preventDefault();

    const isOwner = guild.owner_id === user?.id;

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <div
          className='button'
          onClick={() => {
            void markAsRead(guild.id);
          }}
          role='button'
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              void markAsRead(guild.id);
            }
          }}
        >
          Mark as read
        </div>
        <div className='button'>Change nickname</div>
        {!isOwner && (
          <>
            <hr />
            <div
              role='button'
              tabIndex={0}
              className='button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleLeaveServer(guild.name, guild.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleLeaveServer(guild.name, guild.id);
                }
              }}
            >
              Leave Server
            </div>
          </>
        )}
        {isOwner && (
          <>
            <hr />
            <div className='button'>Server Settings</div>
            <div
              role='button'
              tabIndex={0}
              className='button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleDeleteServer(guild.id);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  handleDeleteServer(guild.id);
                }
              }}
            >
              Delete Server
            </div>
          </>
        )}
      </div>,
    );
  };

  const UserAvatar = () => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(user)}.png`,
    );
    const { cdnUrl } = useConfig();

    const customAvatarUrl = user?.avatar
      ? `${cdnUrl ?? ''}/avatars/${user.id}/${user.avatar}.png`
      : defaultAvatarUrl;

    return (
      <img
        src={customAvatarUrl || ''}
        alt='User Avatar'
        className='guild-icon'
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

  const { cdnUrl } = useConfig();

  const isHomeSelected = !selectedGuildId;
  const activeSession = sessions.find((s) => s.active === true);
  const status =
    activeSession?.status ??
    sessions[0]?.status ??
    (user?.id ? getPresence(user.id)?.status : undefined) ??
    'offline';

  const onlineFriendsCount = relationships.filter((r) => {
    const friendStatus = getPresence(r.id)?.status ?? 'offline';

    return r.type === 1 && friendStatus !== 'offline' && friendStatus !== 'invisible';
  }).length;

  return (
    <div id='guilds-column'>
      <div className='home-section'>
        <button
          className={`guild-icon-wrapper home-wrapper ${isHomeSelected && !isUserPopupOpen ? 'selected' : ''}`}
        >
          {isHomeSelected && !isUserPopupOpen && (
            <div className='selected-indicator-bg'>
              <div className='selected-gradient' />
            </div>
          )}
          <Link to='/channels/@me' className='home-btn-link'>
            <div
              className={`icon-container shadow-container ${isHomeSelected && !isUserPopupOpen ? 'active' : ''}`}
            >
              <img
                className={`guild-icon home-icon-inner`}
                src={webAssets.flickerLogo}
                alt='Home'
              />
            </div>
          </Link>
        </button>
        <div className='online-stats'>
          <span className='stat-text'>{onlineFriendsCount} ONLINE</span>
          {privateChannels.length > 0 && (
            <div className='private-channels-section'>
              {privateChannels.map((privateChannel: Channel) => {
                const recipient = privateChannel.recipients?.[0];
                const mentions = privateChannelMentions.get(privateChannel.id);
                const totalMentions = mentions ?? 0;

                return (
                  <button
                    className={`guild-icon-wrapper`}
                    key={privateChannel.id}
                    onClick={(e) => {
                      e.stopPropagation();

                      void navigate(`/channels/@me/${privateChannel.id}`);
                    }}
                  >
                    <div
                      style={
                        {
                          '--mention-count': `"${totalMentions.toString()}"`,
                        } as React.CSSProperties
                      }
                      className={`icon-container shadow-container ${totalMentions > 0 ? 'mention-badge' : ''}`}
                      title={recipient?.username}
                    >
                      {recipient?.avatar ? (
                        <img
                          className='guild-icon'
                          src={`${cdnUrl ?? ''}/avatars/${recipient?.id ?? ''}/${recipient?.avatar ?? ''}.png`}
                          alt={recipient?.username}
                          onError={handleImgError}
                        />
                      ) : (
                        <div className={`guild-icon no-icon`}>{recipient?.username?.charAt(0)}</div>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}
          <div className='stat-line' />
        </div>
      </div>
      <OverlayScrollbarsComponent
        element='div'
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
        className='server-section-scroller'
        style={{ width: '100%', flex: 1, minHeight: 0 }}
      >
        <div className='server-section'>
          {guilds.map((guild: Guild) => {
            const guildMentionsMap = mentions.get(guild.id);

            let totalMentions = 0;

            guildMentionsMap?.forEach((count: number) => {
              totalMentions += count;
            });

            const hasUnreads = (unreads.get(guild.id)?.size ?? 0) > 0;

            return (
              <button
                className={`guild-icon-wrapper ${selectedGuildId === guild.id && !isUserPopupOpen ? 'selected' : ''}`}
                key={guild.id}
                onClick={() => {
                  onSelectGuild(guild);
                }}
                onContextMenu={(e) => {
                  handleRightClick(e, guild);
                }}
              >
                {selectedGuildId === guild.id && !isUserPopupOpen && (
                  <div className='selected-indicator-bg'>
                    <div className='selected-gradient' />
                  </div>
                )}
                <div
                  style={
                    { '--mention-count': `"${totalMentions.toString()}"` } as React.CSSProperties
                  }
                  className={`icon-container shadow-container ${selectedGuildId === guild.id && !isUserPopupOpen ? 'active' : ''} ${hasUnreads ? 'unread-notification' : ''} ${totalMentions > 0 ? 'mention-badge' : ''}`}
                  title={guild.name}
                >
                  {guild.icon ? (
                    <img
                      className='guild-icon'
                      src={`${cdnUrl ?? ''}/icons/${guild.id}/${guild.icon}.png`}
                      alt={guild.name}
                      onError={handleImgError}
                    />
                  ) : (
                    <div className={`guild-icon no-icon`}>{guild.name?.charAt(0) ?? '?'}</div>
                  )}
                </div>
              </button>
            );
          })}

          <button
            className={`guild-icon-wrapper`}
            key={`add-guild`}
            onClick={() => {
              openModal('WHATS_IT_GONNA_BE');
            }}
          >
            <div className='icon-container'>
              <div className={`guild-icon no-icon add-icon`}>
                <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                  add
                </span>
              </div>
            </div>
          </button>
        </div>
      </OverlayScrollbarsComponent>

      <div className='user-section'>
        <button
          className={`guild-icon-wrapper ${isUserPopupOpen ? 'selected' : ''}`}
          onClick={(e) => {
            if (isUserPopupOpen) return;
            const rect = e.currentTarget.getBoundingClientRect();
            openPopup('CURRENT_USER_PROFILE', {
              x: 12,
              y: rect.bottom - 400,
            });
          }}
        >
          <div
            className={`icon-container user-icon-container shadow-container ${isUserPopupOpen ? 'active' : ''}`}
          >
            <UserAvatar />
            <div className='user-status-indicator'>
              <div className='status-indicator-wrapper'>
                <div className={`status-dot-large ${status}`}></div>
              </div>
            </div>
          </div>
        </button>
      </div>
    </div>
  );
};

export default GuildSidebar;
