import './channelSidebar.css';

import { type JSX, useState } from 'react';

import type { Channel } from '@/types/channel';
import type { Guild } from '@/types/guilds';
import type { Relationship } from '@/types/relationship';

import CurrentUser from './currentUser';

const ChannelSidebar = ({
  selectedGuild,
  selectedChannel,
  onSelectChannel,
  relationships,
  onSettingsClicked,
}: {
  selectedGuild?: Guild | null;
  selectedChannel?: Channel | null;
  onSelectChannel: (channel: Channel | null) => void;
  relationships: Relationship[];
  onSettingsClicked: () => void;
}): JSX.Element => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});

  if (!selectedGuild) {
    return (
      <div id='channels-column'>
        <div className='sidebar-header-search'>
          <div className='search-bar-fake'>
            <span className='search-text'>Find or start a conversation</span>
          </div>
        </div>

        <div className='scroller'>
          <button
            className={`friends-button ${!selectedChannel ? 'active' : ''}`}
            onClick={() => {
              onSelectChannel(null);
            }}
          >
            <div className='icon-wrapper'>
              <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                group
              </span>
            </div>
            <span className='channel-name'>Friends</span>
          </button>

          <div className='dm-section'>
            <div className='dm-header'>
              <span className='dm-header-text'>Direct Messages</span>
              <button className='dm-add-btn'>
                <span className='material-symbols-rounded' style={{ fontSize: '16px' }}>
                  add
                </span>
              </button>
            </div>
            <div className='dm-list'>
              <span className='dm-placeholder'>
                ({relationships.filter((x: Relationship) => x.type === 1).length}) Friends
              </span>
            </div>
          </div>
        </div>
        <CurrentUser onSettingsClicked={onSettingsClicked} />
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
      <div className='channel-icon'>
        <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
          {channel.type === 2 ? 'volume_up' : 'tag'}
        </span>
      </div>
      <span className='channel-name'>{channel.name}</span>
    </button>
  );

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const bannerUrl = selectedGuild.banner
    ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/banners/${selectedGuild.id}/${selectedGuild.banner}.png`
    : null;

  return (
    <div id='channels-column'>
      <div className='sidebar-header-guild'>
        <div className='header-bg'>
          {bannerUrl && <img src={bannerUrl} alt='' className='header-image' />}
          <div className='header-gradient'></div>
        </div>
        <div className='header-content'>
          <span className='guild-name'>{selectedGuild.name}</span>
          <span className='material-symbols-rounded header-arrow' style={{ fontSize: '24px' }}>
            expand_more
          </span>
        </div>
      </div>

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
                  <div className={`arrow-icon ${isCollapsed ? 'collapsed' : ''}`}>
                    <span className='material-symbols-rounded' style={{ fontSize: '12px' }}>
                      expand_more
                    </span>
                  </div>
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

      <CurrentUser onSettingsClicked={onSettingsClicked} />
    </div>
  );
};

export default ChannelSidebar;
