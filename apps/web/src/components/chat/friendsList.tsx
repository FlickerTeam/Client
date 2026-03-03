import './friendsList.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Channel } from 'shared';
import type { Relationship } from 'shared';
import { del, post, put } from 'shared';
import { getDefaultAvatar } from 'shared';
import { logger } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';

interface FriendsListProps {
  friends: Relationship[];
  onRequestUpdate: (friend: Relationship) => void;
  onRequestDelete: (friendId: string) => void;
}

export const FriendsList = ({
  friends,
  onRequestUpdate,
  onRequestDelete,
}: FriendsListProps): JSX.Element => {
  const navigate = useNavigate();
  const { privateChannels, getPresence } = useGateway();
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getFilteredFriends = () => {
    const filtered = friends.filter((friend) => {
      const currentStatus = getPresence(friend.id)?.status;

      if (searchQuery && !friend.user.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      switch (filter) {
        case 'ONLINE':
          return friend.type === 1 && currentStatus !== 'offline';
        case 'PENDING':
          return friend.type === 3 || friend.type === 4;
        case 'BLOCKED':
          return friend.type === 2;
        case 'ALL':
        default:
          return friend.type === 1;
      }
    });

    return filtered.sort((a, b) => a.user.username.localeCompare(b.user.username));
  };

  const acceptFriendRequest = async (friend: Relationship) => {
    onRequestUpdate({ ...friend, type: 1 });

    try {
      await put(`/users/@me/relationships/${friend.id}`, {});

      return true;
    } catch (error) {
      console.error('Failed to accept friend request: ', error);

      return false;
    }
  };

  const declineFriendRequest = async (friend: Relationship): Promise<boolean> => {
    onRequestDelete(friend.id);

    try {
      await del(`/users/@me/relationships/${friend.id}`);

      return true;
    } catch (error) {
      console.error('Failed to decline friend request: ', error);

      return false;
    }
  };

  const FriendAvatar = ({ friend }: { friend: Relationship }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(friend)}.png`,
    );
    const { cdnUrl } = useConfig();
    const avatarUrl = friend.user.avatar
      ? `${cdnUrl ?? ''}/avatars/${friend.id}/${friend.user.avatar}.png`
      : defaultAvatarUrl;

    return (
      <img
        src={avatarUrl || ''}
        className='avatar-img'
        alt=''
        onError={() => {
          rollover();
        }}
      />
    );
  };

  const openDMChannel = async (userId: string) => {
    let dmChannel = (privateChannels as Channel[]).find(
      (c) => c.type === 1 && c.recipients?.some((r) => r.id === userId),
    );

    if (!dmChannel) {
      try {
        const newDMChannel = await post(`/users/@me/channels`, {
          recipients: [userId],
        });

        dmChannel = newDMChannel as Channel;
      } catch (error) {
        logger.error(`FRIEND_LIST`, `Failed to create new DM channel`, error);
        return;
      }
    }

    if (dmChannel?.id) {
      void navigate(`/channels/@me/${dmChannel.id}`);
    }
  };

  const displayFriends = getFilteredFriends();

  return (
    <main className='friends-container'>
      <header className='header'>
        <div className='header-left'>
          <div className='header-icon'>
            <span className='material-symbols-rounded'>group</span>
          </div>
          <span className='header-title'>Friends</span>
          <div className='vertical-divider'></div>
          <button
            onClick={() => {
              setFilter('ALL');
            }}
            className={filter === 'ALL' ? 'active' : ''}
          >
            All
          </button>
          <button
            onClick={() => {
              setFilter('ONLINE');
            }}
            className={filter === 'ONLINE' ? 'active' : ''}
          >
            Online
          </button>
          <button
            onClick={() => {
              setFilter('PENDING');
            }}
            className={filter === 'PENDING' ? 'active' : ''}
          >
            Pending
          </button>
          <button
            onClick={() => {
              setFilter('BLOCKED');
            }}
            className={filter === 'BLOCKED' ? 'active' : ''}
          >
            Blocked
          </button>
        </div>
        <div className='header-right'>
          <div className='header-right-left'>
            <button className='add-friend-btn'>Add Friend</button>
            <button className='icon-btn'>
              <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                edit_square
              </span>
            </button>
          </div>
          <div className='vertical-divider'></div>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              inbox
            </span>
          </button>
        </div>
      </header>

      <div className='friends-content'>
        <div className='friends-list-column'>
          <div className='friends-search-bar'>
            <input
              type='text'
              placeholder='Search'
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
              }}
            />
            <span className='material-symbols-rounded search-icon'>search</span>
          </div>
          <div className='friends-count'>
            {filter} — {displayFriends.length}
          </div>
          <OverlayScrollbarsComponent
            element='div'
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
            className='friends-scroller scroller'
            style={{ flex: 1, minHeight: 0 }}
          >
            {displayFriends.map((friend) => {
              const liveStatus = getPresence(friend.id)?.status ?? 'offline';

              return (
                <div
                  key={friend.id}
                  className='friend-item-row'
                  onClick={() => {
                    void openDMChannel(friend.id);
                  }}
                >
                  <div className='friend-info'>
                    <div className='avatar-wrapper'>
                      <FriendAvatar friend={friend} />
                      {friend.type === 1 && (
                        <div className={`status-dot ${liveStatus}`} title={liveStatus} />
                      )}
                    </div>
                    <div className='friend-text'>
                      <div className='friend-name-row'>
                        <span className='username'>{friend.user.username}</span>
                        <span className='discriminator'>#{friend.user.discriminator}</span>
                      </div>

                      {(filter === 'PENDING' || friend.type === 1) && (
                        <div className='friend-status-row'>
                          <span className='status-text'>
                            {filter === 'PENDING'
                              ? friend.type === 3
                                ? 'Incoming Friend Request'
                                : 'Outgoing Friend Request'
                              : liveStatus}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                  <div className='friend-actions'>
                    {(() => {
                      if (filter === 'PENDING' && friend.type === 3) {
                        return (
                          <>
                            <button
                              className='action-btn online'
                              onClick={(e) => {
                                e.stopPropagation();
                                void acceptFriendRequest(friend);
                              }}
                            >
                              ACCEPT
                            </button>
                            <button
                              className='action-btn dnd'
                              onClick={(e) => {
                                e.stopPropagation();
                                void declineFriendRequest(friend);
                              }}
                            >
                              DECLINE
                            </button>
                          </>
                        );
                      }

                      if (filter === 'PENDING' && friend.type === 4) {
                        return (
                          <>
                            <button
                              className='action-btn dnd'
                              onClick={() => {
                                void declineFriendRequest(friend);
                              }}
                            >
                              X
                            </button>
                          </>
                        );
                      }

                      if (friend.type === 1) {
                        return (
                          <>
                            <button
                              className='icon-action-btn'
                              onClick={(e) => {
                                e.stopPropagation();
                                void openDMChannel(friend.id);
                              }}
                            >
                              <span
                                className='material-symbols-rounded'
                                style={{ fontSize: '20px' }}
                              >
                                chat_bubble
                              </span>
                            </button>
                            <button
                              className='icon-action-btn'
                              onClick={(e) => {
                                e.stopPropagation();

                                //uh.. do something here
                              }}
                            >
                              <span
                                className='material-symbols-rounded'
                                style={{ fontSize: '20px' }}
                              >
                                more_vert
                              </span>
                            </button>
                          </>
                        );
                      }

                      return null;
                    })()}
                  </div>
                </div>
              );
            })}
          </OverlayScrollbarsComponent>
        </div>

        <div className='active-now-column'>
          <OverlayScrollbarsComponent
            element='div'
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
            style={{ height: '100%' }}
          >
            <h3 className='active-now-header'>Active now</h3>
            <div className='active-now-empty'>
              <h4>Hello? Is anybody on?</h4>
              <p>
                Well, I guess nobody is on. If someone starts an activity, those activities will be
                shown here!
              </p>
            </div>
          </OverlayScrollbarsComponent>
        </div>
      </div>
    </main>
  );
};
