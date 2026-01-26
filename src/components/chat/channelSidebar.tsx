import './channelSidebar.css';

import { type JSX, useState } from 'react';

import type { Channel } from '@/types/channel';
import type { Guild } from '@/types/guilds';
import type { StatusEnum } from '@/types/presences';
import type { Relationship } from '@/types/relationship';
import type { User } from '@/types/users';

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
  onSelectChannel: (channel: Channel | null) => void;
  user: User | null;
  relationships: Relationship[];
  status: StatusEnum;
  onSettingsClicked: () => void;
}): JSX.Element => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!selectedGuild) {
    return (
      <div id='channels-column'>
        <header className='header-base'>Direct Messages</header>
        <div className='scroller'>
          <button
            className={`channel-item ${!selectedChannel ? 'active' : ''}`}
            onClick={() => {
              onSelectChannel(null);
            }}
          >
            <span className='channel-hash'>
              ({relationships.filter((x: Relationship) => x.type === 1).length})
            </span>
            <span className='channel-name'>Friends</span>
          </button>
        </div>
        <CurrentUser user={user} onSettingsClicked={onSettingsClicked} status={status} />
      </div>
    );
  }

  const allChannels = selectedGuild.channels;
  const categoryChannels = allChannels.filter((c: Channel) => c.type === 4); //Text Channels, Voice Channels, other channels..
  const categorizedChannels = allChannels.filter((c: Channel) => c.parent_id !== null);
  const nonCategorizedChannels = allChannels.filter((c: Channel) => c.parent_id === null);

  const renderChannel = (channel: Channel) => (
    <button
      key={channel.id}
      className={`channel-item ${selectedChannel?.id === channel.id ? 'active' : ''} ${channel.type === 2 ? 'not-selectable' : ''}`}
      onClick={() => {
        onSelectChannel(channel);
      }}
    >
      <span className='channel-hash'>{channel.type === 2 ? '' : '#'}</span>
      <span className='channel-name'>{channel.name}</span>
    </button>
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
          .sort((a: Channel, b: Channel) => (a.position ?? 0) - (b.position ?? 0))
          .map((category: Channel) => {
            const isCollapsed = collapsedCategories[category.id];
            const children = categorizedChannels
              .filter((c: Channel) => c.parent_id === category.id)
              .sort((a: Channel, b: Channel) => (a.position ?? 0) - (b.position ?? 0));

            return (
              <div key={category.id} className='category-wrapper'>
                <button
                  className='category-header'
                  onClick={() => {
                    toggleCategory(category.id);
                  }}
                  style={{ cursor: 'pointer' }}
                >
                  <span className={`arrow ${isCollapsed ? '' : 'expanded'}`}>
                    {isCollapsed ? '›' : '⌄'}
                  </span>
                  {category.name?.toUpperCase()}
                </button>
                {!isCollapsed && (
                  <div className='category-children'>{children.map(renderChannel)}</div>
                )}
              </div>
            );
          })}

        {nonCategorizedChannels.map((channel: Channel) => (
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
