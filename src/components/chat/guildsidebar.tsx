import { Link } from "react-router-dom";
import './guildsidebar.css'
import { Guild } from "../../interfaces/guild";
import { JSX, useEffect } from "react";
import { useModal } from '../../context/modal';

const GuildSidebar = ({ guilds, cdnUrl, selectedGuildId, onSelectGuild }: {
  guilds: Guild[],
  cdnUrl: string,
  selectedGuildId?: string | null,
  onSelectGuild: any
}): JSX.Element => {
  const { openModal } = useModal();

  useEffect(() => {
    const handleNewGuild = (event: any) => {
      const newGuild = event.detail;

      if (guilds.some(x => x.id === newGuild.id)) return;

      guilds.push(...[newGuild]);
    };

    window.addEventListener('gateway_guild_create', handleNewGuild);
  }, [guilds]);

  return (
    <div id="guilds-column">
      <div className="home-button">
        <Link to="/channels/@me" className="login-link">Home</Link>
      </div>
      <div className='quick-guild-stats'>
        <span className='stat-badge'>{guilds.length} guild(s)</span>
      </div>
      <hr className='separator' />
      {guilds.map((guild: Guild) => (
        <div
          className={`guild-icon-wrapper`}
          key={guild.id}
          onClick={() => onSelectGuild(guild)}
        >
          {guild.icon ? (
            <img className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''}`} src={`${cdnUrl}/icons/${guild.id}/${guild.icon}.png`} alt={guild.name} />
          ) : (
            <div className={`guild-icon ${selectedGuildId === guild.id ? 'active' : ''} no-icon`}>{guild.name.charAt(0)}</div>
          )}
          <div className="item-pill"></div>
        </div>
      ))}
      <hr className='separator' />
        <div
          className={`guild-icon-wrapper`} key={`add-guild`}
          onClick={() => {
            openModal('WHATS_IT_GONNA_BE')
          }}
        >
          <div className={`guild-icon no-icon`}>+</div>
          <div className="item-pill"></div>
        </div>
    </div>
  );
}

export default GuildSidebar;