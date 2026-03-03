import './channelSidebar.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useEffect, useMemo, useState } from 'react';
import { type NavigateFunction, useNavigate } from 'react-router-dom';
import type { Channel } from 'shared';
import type { Guild, VoiceState } from 'shared';
import { useUserStore } from 'shared';
import { del } from 'shared';
import { getDefaultAvatar } from 'shared';
import { logger } from 'shared';
import { Snowflake } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { useMenuOverlay } from '@/layering/menuOverlayStore';

import { DmChannel } from './dmChannel';
import VoiceActivityControls from './voiceActivityControls';

interface ChannelSidebarProps {
  selectedGuild?: Guild | null;
  unreads?: Map<string, Set<string>>;
  mentions?: Map<string, Map<string, number>>;
  selectedChannel?: Channel | null;
  onSelectChannel: (channel: Channel | null) => void;
}

const handleCloseDM = async (channelid: string) => {
  try {
    await del(`/channels/${channelid}`);
  } catch (error) {
    logger.error(`CHANNEL_SIDEBAR`, `Failed to close DM`, error);
  }
};

const PrivateChannelItem = ({
  channel,
  navigate,
  selected,
  onCloseLocal,
}: {
  channel: Channel;
  navigate: NavigateFunction;
  selected: boolean;
  onCloseLocal: () => void;
}) => {
  const { getPresence, typingUsers } = useGateway();
  const { cdnUrl } = useConfig();

  const recipient = channel.recipients?.[0];
  const { url: defaultAvatarUrl } = useAssetsUrl(`/assets/${getDefaultAvatar(recipient)}.png`);

  const channelName =
    channel.name || recipient?.global_name || recipient?.username || 'Unknown User';
  const avatarUrl = recipient?.avatar
    ? `${cdnUrl ?? ''}/avatars/${recipient.id ?? ''}/${recipient.avatar}.png`
    : defaultAvatarUrl;

  const status = getPresence(recipient?.id)?.status ?? 'offline';
  const recipientId = recipient?.id;
  const isTyping = !!(recipientId && typingUsers[channel.id]?.[recipientId]);

  let subTitle = ``;

  if (channel.last_message_id) {
    const snowflake = new Snowflake(channel.last_message_id);

    subTitle = `Last Message ${snowflake.format()}`;
  }

  return (
    <DmChannel
      key={channel.id}
      title={channelName}
      subtitle={subTitle !== '' ? subTitle : undefined}
      icon={avatarUrl}
      isTyping={isTyping}
      selected={selected}
      status={status}
      onClose={() => {
        onCloseLocal();
        void handleCloseDM(channel.id);
      }}
      onClick={() => {
        void navigate(`/channels/@me/${channel.id}`);
      }}
    />
  );
};

const VoiceChannelMember = ({ vs }: { vs: VoiceState }): JSX.Element => {
  const user = useUserStore((state) => state.users[vs.user_id]);
  const { cdnUrl } = useConfig();
  const [isSpeaking, setIsSpeaking] = useState(false);

  useEffect(() => {
    const handleSpeaking = (event: Event) => {
      const detail = (event as CustomEvent<{ userId: string; speaking: boolean }>).detail;
      if (detail.userId === vs.user_id) {
        setIsSpeaking(detail.speaking);
      }
    };

    window.addEventListener('ui_vc_member_speaking', handleSpeaking);
    return () => {
      window.removeEventListener('ui_vc_member_speaking', handleSpeaking);
    };
  }, [vs.user_id]);

  const { url: defaultAvatarUrl } = useAssetsUrl(`/assets/${getDefaultAvatar(user)}.png`);
  if (!user) return <></>;
  const avatarUrl = user.avatar
    ? `${cdnUrl ?? ''}/avatars/${user.id}/${user.avatar}.png`
    : defaultAvatarUrl;

  return (
    <div className='voice-channel-member'>
      <img
        className={`avatar-img ${isSpeaking ? 'speaking' : ''}`}
        src={avatarUrl}
        alt={user.username}
      ></img>
      <div className='vc-user-info'>
        <span>{user.global_name ?? user.username}</span>
        <div className='voice-control-states'>
          {(vs.self_mute || vs.mute) && (
            <span className='material-symbols-rounded vc-icon-state'>mic_off</span>
          )}
          {(vs.self_deaf || vs.deaf) && (
            <span className='material-symbols-rounded vc-icon-state'>headset_off</span>
          )}
        </div>
      </div>
    </div>
  );
};

const ChannelSidebar = ({
  selectedGuild,
  unreads,
  mentions,
  selectedChannel,
  onSelectChannel,
}: ChannelSidebarProps): JSX.Element => {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const { privateChannels: globalPrivateChannels, voiceStates } = useGateway();
  const { openContextMenu, closeContextMenu } = useMenuOverlay();
  const [dmUsername, setDmUsername] = useState('');
  const [closedChannelIds, setClosedChannelIds] = useState<string[]>([]);
  const navigate = useNavigate();
  const { cdnUrl } = useConfig();
  const validClosedChannelIds = useMemo(
    () => closedChannelIds.filter((id) => globalPrivateChannels.some((c) => c.id === id)),
    [closedChannelIds, globalPrivateChannels],
  );

  const visiblePrivateChannels = ((globalPrivateChannels as Channel[]) || [])
    .filter((channel) => !validClosedChannelIds.includes(channel.id))
    .sort((a, b) => {
      const idA = BigInt(a.last_message_id ?? '0');
      const idB = BigInt(b.last_message_id ?? '0');

      if (idB > idA) return 1;
      if (idB < idA) return -1;
      return 0;
    });

  useEffect(() => {
    const handleRemoteDelete = (event: Event) => {
      const deletedChannel = (event as CustomEvent<Channel>).detail;

      if (selectedChannel?.id === deletedChannel.id) {
        onSelectChannel(null);
        void navigate('/channels/@me');
      }
    };

    window.addEventListener('ui_channel_deleted', handleRemoteDelete);
    return () => {
      window.removeEventListener('ui_channel_deleted', handleRemoteDelete);
    };
  }, [selectedChannel, navigate, onSelectChannel]);

  if (!selectedGuild) {
    return (
      <div id='channels-column'>
        <div className='sidebar-header'>
          <div
            className='friends-search-bar'
            style={{
              marginBottom: '0',
            }}
          >
            <input
              placeholder='Find or start a conversation'
              type='text'
              value={dmUsername}
              onChange={(e) => {
                setDmUsername(e.target.value);
              }}
            ></input>
          </div>
        </div>

        <OverlayScrollbarsComponent
          element='div'
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
          style={{ flex: 1, minHeight: 0 }}
        >
          <div className='no-channels-sidebar-wrapper'>
            <button
              className={`sidebar-btn ${!selectedChannel ? 'active' : ''}`}
              onClick={() => {
                onSelectChannel(null);
              }}
            >
              <div className='icon-wrapper'>
                <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                  group
                </span>
              </div>
              <span className='sidebar-text'>Friends</span>
            </button>
          </div>

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
              {visiblePrivateChannels.length > 0 &&
                visiblePrivateChannels
                  .filter((x) =>
                    x.recipients?.some((recipient) =>
                      recipient.username?.toLowerCase().includes(dmUsername?.toLowerCase()),
                    ),
                  )
                  .map((channel) => (
                    <PrivateChannelItem
                      key={channel.id}
                      channel={channel}
                      navigate={navigate}
                      selected={selectedChannel?.id === channel.id}
                      onCloseLocal={() => {
                        setClosedChannelIds((prev) => [...prev, channel.id]);

                        if (selectedChannel?.id === channel.id) {
                          onSelectChannel(null);
                          void navigate('/channels/@me');
                        }
                      }}
                    />
                  ))}
            </div>
          </div>
        </OverlayScrollbarsComponent>
        <VoiceActivityControls />
      </div>
    );
  }

  const allChannels = selectedGuild.channels;
  allChannels.sort((a: Channel, b: Channel) => a.position - b.position);

  //to-do: no magic numbers
  const categoryChannels = allChannels.filter((c: Channel) => c.type === 4); //Text Channels, Voice Channels, other channels..
  const categorizedChannels = allChannels.filter(
    (c: Channel) => c.parent_id !== null && allChannels.some((c2) => c.parent_id === c2.id),
  );
  const nonCategorizedChannels = allChannels.filter(
    (c: Channel) => !categoryChannels.includes(c) && !categorizedChannels.includes(c),
  );

  const handleRightClick = (e: React.MouseEvent, channel: Channel) => {
    e.preventDefault();

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <div className='button'>Mark as read</div>
        <div className='button'>Make invite</div>
        <hr />
        <div
          className='button'
          onClick={() => {
            if (channel.id) {
              closeContextMenu();
              void navigator.clipboard.writeText(channel.id);
            }
          }}
        >
          Copy ID
        </div>
      </div>,
    );
  };

  const renderChannel = (channel: Channel) => {
    const membersInThisChannel = Object.values(voiceStates || {}).filter(
      (vs) => vs.channel_id === channel.id,
    );

    const isSelected = selectedChannel?.id === channel.id;
    const hasUnread = !isSelected && unreads?.get(selectedGuild.id)?.has(channel.id);
    const mentionCount = !isSelected ? (mentions?.get(selectedGuild.id)?.get(channel.id) ?? 0) : 0;

    return (
      <>
        <button
          key={channel.id}
          className={`sidebar-btn 
            ${selectedChannel?.id === channel.id ? 'active' : ''} 
            ${hasUnread ? 'unread' : ''} 
            ${channel.type === 2 ? 'not-selectable' : ''}`}
          onClick={() => {
            onSelectChannel(channel);
          }}
          onContextMenu={(e) => {
            handleRightClick(e, channel);
          }}
        >
          <div className='sidebar-icon'>
            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
              {channel.type === 2 ? 'volume_up' : channel.nsfw ? 'lock' : 'tag'}
            </span>
          </div>
          <span className='sidebar-text'>{channel.name}</span>
          {mentionCount > 0 && <div className='channel-mention-badge'>{mentionCount}</div>}
        </button>
        {channel.type === 2 && membersInThisChannel.length > 0 && (
          <div className='voice-channel-members'>
            {membersInThisChannel.map((vs: VoiceState) => (
              <VoiceChannelMember key={vs.user_id} vs={vs} />
            ))}
          </div>
        )}
      </>
    );
  };

  const toggleCategory = (categoryId: string) => {
    setCollapsedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const bannerUrl = selectedGuild.banner
    ? `${cdnUrl ?? ''}/banners/${selectedGuild.id}/${selectedGuild.banner}.png`
    : null;

  return (
    <div id='channels-column'>
      <div className={`sidebar-header ${bannerUrl != null ? 'sidebar-header-banner' : ''}`}>
        {bannerUrl != null && (
          <div className='sidebar-header-banner-bg'>
            <img
              src={bannerUrl}
              alt=''
              className='sidebar-header-banner-image'
              loading='eager'
              fetchPriority='high'
            />
            <div className='sidebar-header-banner-gradient'></div>
          </div>
        )}
        <div className='sidebar-header-content'>
          <span className='guild-name'>{selectedGuild.name}</span>
          <span
            className='material-symbols-rounded sidebar-header-arrow'
            style={{ fontSize: '24px' }}
          >
            expand_more
          </span>
        </div>
      </div>

      <OverlayScrollbarsComponent
        element='div'
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
        style={{ flex: 1, minHeight: 0 }}
      >
        {nonCategorizedChannels.map((channel: Channel) => (
          <div
            key={`wrapper-${channel.id}`}
            className='category-children'
            style={{
              marginBottom: '10px',
            }}
          >
            {renderChannel(channel)}
          </div>
        ))}

        {categoryChannels
          .sort((a: Channel, b: Channel) => a.position - b.position)
          .map((category: Channel) => {
            const isCollapsed = collapsedCategories[category.id];
            const children = categorizedChannels
              .filter((c: Channel) => c.parent_id === category.id)
              .sort((a: Channel, b: Channel) => a.position - b.position);

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
      </OverlayScrollbarsComponent>

      <VoiceActivityControls />
    </div>
  );
};

export default ChannelSidebar;
