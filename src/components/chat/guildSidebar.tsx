import './guildSidebar.css';

import { type JSX } from 'react';
import { Link } from 'react-router-dom';

import type { Guild } from '@/types/guilds';

import { useContextMenu } from '../../context/contextMenu';
import { useGateway } from '../../context/gatewayContext';
import { useModal } from '../../context/modal';

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

  return (
    <div id='guilds-column'>
      <div className='home-btn'>
        <Link to='/channels/@me' className='login-link'>
          Home
        </Link>
      </div>
      <div className='quick-guild-stats'>
        <span className='stat-badge'>{guilds.length} guild(s)</span>
      </div>
      {guilds.length > 0 && <hr className='separator' />}
      {guilds.map((guild: Guild) => (
        <button
          className={`guild-icon-wrapper`}
          key={guild.id}
          onClick={() => {
            onSelectGuild(guild);
          }}
          onContextMenu={(e) => {
            handleRightClick(e, guild);
          }}
        >
          {guild.icon ? (
            <img
              className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''}`}
              src={`${localStorage.getItem('selectedCdnUrl') ?? ''}/icons/${guild.id}/${guild.icon}.png`}
              alt={guild.name}
            />
          ) : (
            <div className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''} no-icon`}>
              {guild.name.charAt(0)}
            </div>
          )}
          <div className='item-pill'></div>
        </button>
      ))}
      <hr className='separator' />
      <button
        className={`guild-icon-wrapper`}
        key={`add-guild`}
        onClick={() => {
          openModal('WHATS_IT_GONNA_BE');
        }}
      >
        <div className={`guild-icon no-icon`}>+</div>
        <div className='item-pill'></div>
      </button>
    </div>
  );
};

export default GuildSidebar;
