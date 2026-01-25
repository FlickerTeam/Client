import './channelsidebar.css';

import { type JSX, useState } from 'react';

import type { Channel } from '@/types/channel';
import type { Guild } from '@/types/guild';

import CurrentUser from './currentUser';

const ChannelSidebar = ({
  selectedGuild,
  selectedChannel,
  onSelectChannel,
  user,
  relationships,
  status,
  onSettingsClicked,
}: {
  selectedGuild?: Guild | null;
  selectedChannel?: Channel | null;
  onSelectChannel: any;
  user: any;
  relationships: any;
  status: any;
  onSettingsClicked: any;
}): JSX.Element => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!selectedGuild) {
    return (
      <div id='channels-column'>
        <header className='header-base'>Direct Messages</header>
        <div className='scroller'>
          <div
            className={`channel-item ${!selectedChannel ? 'active' : ''}`}
            onClick={() => onSelectChannel(null)}
          >
            <span className='channel-hash'>
              ({relationships.filter((x: any) => x.type === 1).length ?? 0})
            </span>
            <span className='channel-name'>Friends</span>
          </div>
        </div>
        <CurrentUser user={user} onSettingsClicked={onSettingsClicked} status={status} />
      </div>
    );
  }

  const allChannels = selectedGuild.channels;
  const categoryChannels = allChannels.filter((c: any) => c.type === 4); //Text Channels, Voice Channels, other channels..
  const categorizedChannels = allChannels.filter((c: any) => c.parent_id !== null);
  const nonCategorizedChannels = allChannels.filter((c: any) => c.parent_id === null);

  const renderChannel = (channel: Channel) => (
    <div
      key={channel.id}
      className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.type === 2 ? 'not-selectable' : ''}`}
      onClick={() => onSelectChannel(channel)}
    >
      <span className='channel-hash'>{channel.type === 2 ? '' : '#'}</span>
      <span className='channel-name'>{channel.name}</span>
    </div>
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  return (
    <div id='channels-column'>
      <header className='header-base'>{selectedGuild.name}</header>
      <div className='scroller'>
        {categoryChannels
          .sort((a: any, b: any) => a.position - b.position)
          .map((category: any) => {
            const isCollapsed = collapsedCategories[category.id];
            const children = categorizedChannels
              .filter((c: any) => c.parent_id === category.id)
              .sort((a: any, b: any) => a.position - b.position);

            return (
              <div key={category.id} className='category-wrapper'>
                <div
                  className='category-header'
                  onClick={() => {
                    toggleCategory(category.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`arrow ${isCollapsed ? '' : 'expanded'}`}>
                    {isCollapsed ? '›' : '⌄'}
                  </span>
                  {category.name.toUpperCase()}
                </div>
                {!isCollapsed && (
                  <div className='category-children'>{children.map(renderChannel)}</div>
                )}
              </div>
            );
          })}

        {nonCategorizedChannels.map((channel: any) => (
          <div key={`wrapper-${channel.id}`} className='category-children'>
            {renderChannel(channel)}
          </div>
        ))}
      </div>

      <CurrentUser user={user} onSettingsClicked={onSettingsClicked} status={status} />
    </div>
  );
};

export default ChannelSidebar;
