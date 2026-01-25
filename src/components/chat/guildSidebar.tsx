import './guildsidebar.css';

import { type JSX } from 'react';
import { Link } from 'react-router-dom';

import { useContextMenu } from '../../context/contextMenu';
import { useGateway } from '../../context/gateway';
import { useModal } from '../../context/modal';

const GuildSidebar = ({
  guilds,
  selectedGuildId,
  onSelectGuild,
}: {
  guilds: Guild[];
  selectedGuildId?: string | null;
  onSelectGuild: any;
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

    const isOwner = guild.owner_id === user.id;

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <div className='button'>Change nickname</div>
        {!isOwner && (
          <>
            <hr />
            <div
              className='button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleLeaveServer(guild.name, guild.id);
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
              className='button'
              style={{ color: 'var(--bg-dnd)' }}
              onClick={() => {
                handleDeleteServer(guild.name, guild.id);
              }}
            >
              Delete Server
            </div>
          </>
        )}
      </div>,
    );
  };

  return (
    <div id='guilds-column'>
      <div className='home-button'>
        <Link to='/channels/@me' className='login-link'>
          Home
        </Link>
      </div>
      <div className='quick-guild-stats'>
        <span className='stat-badge'>{guilds.length} guild(s)</span>
      </div>
      {guilds.length > 0 && <hr className='separator' />}
      {guilds.map((guild: Guild) => (
        <div
          className={`guild-icon-wrapper`}
          key={guild.id}
          onClick={() => onSelectGuild(guild)}
          onContextMenu={(e) => {
            handleRightClick(e, guild);
          }}
        >
          {guild.icon ? (
            <img
              className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''}`}
              src={`${localStorage.getItem('selectedAssetsUrl')!}/icons/${guild.id}/${guild.icon}.png`}
              alt={guild.name}
            />
          ) : (
            <div className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''} no-icon`}>
              {guild.name.charAt(0)}
            </div>
          )}
          <div className='item-pill'></div>
        </div>
      ))}
      <hr className='separator' />
      <div
        className={`guild-icon-wrapper`}
        key={`add-guild`}
        onClick={() => {
          openModal('WHATS_IT_GONNA_BE');
        }}
      >
        <div className={`guild-icon no-icon`}>+</div>
        <div className='item-pill'></div>
      </div>
    </div>
  );
};

export default GuildSidebar;
