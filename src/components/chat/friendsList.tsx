import './friendsList.css';

import { type JSX, useState } from 'react';

import type { Relationship } from '@/types/relationship';

import { useAssetsUrl } from '../../context/assetsUrl';
import { getDefaultAvatar } from '../../utils/avatar';

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
  const [filter, setFilter] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const getFilteredFriends = () => {
    const filtered = friends.filter((friend) => {
      if (searchQuery && !friend.user.username.toLowerCase().includes(searchQuery.toLowerCase())) {
        return false;
      }

      switch (filter) {
        case 'ONLINE':
          return friend.type === 1;
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
      const baseUrl = localStorage.getItem('selectedInstanceUrl');
      const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/users/@me/relationships/${friend.id}`;

      const response = await fetch(url, {
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
        method: 'PUT',
        body: JSON.stringify({}),
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to accept friend request: ', error);

      return false;
    }
  };

  const declineFriendRequest = async (friend: Relationship): Promise<boolean> => {
    onRequestDelete(friend.id);

    try {
      const baseUrl = localStorage.getItem('selectedInstanceUrl');
      const url = `${baseUrl ?? ''}/${localStorage.getItem('defaultApiVersion') ?? ''}/users/@me/relationships/${friend.id}`;

      const response = await fetch(url, {
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
        method: 'DELETE',
      });

      return response.ok;
    } catch (error) {
      console.error('Failed to decline friend request: ', error);

      return false;
    }
  };

  const FriendAvatar = ({ friend }: { friend: Relationship }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(friend) ?? ''}.png`,
    );
    const avatarUrl = friend.user.avatar
      ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${friend.id}/${friend.user.avatar}.png`
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

  const displayFriends = getFilteredFriends();

  return (
    <main className='friends-container'>
      <header className='friends-header'>
        <div className='header-content-left'>
          <div className='friends-icon-container'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              group
            </span>
          </div>
          <span className='header-title'>Friends</span>
          <div className='vertical-divider'></div>
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
              setFilter('ALL');
            }}
            className={filter === 'ALL' ? 'active' : ''}
          >
            All
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
          <button className='add-friend-btn'>Add Friend</button>
        </div>
        <div className='header-content-right'>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              edit_square
            </span>
          </button>
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
            <span className='material-symbols-rounded search-icon' style={{ fontSize: '20px' }}>
              search
            </span>
          </div>
          <div className='friends-count'>
            {filter} — {displayFriends.length}
          </div>
          <div className='friends-scroller'>
            {displayFriends.map((friend) => (
              <div key={friend.id} className='friend-item-row'>
                <div className='friend-info'>
                  <div className='avatar-wrapper'>
                    <FriendAvatar friend={friend} />
                    {friend.type === 1 && <div className={`status-dot ${friend.status ?? ''}`} />}
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
                            : (friend.status ?? 'Offline')}
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
                            onClick={() => {
                              void acceptFriendRequest(friend);
                            }}
                          >
                            ACCEPT
                          </button>
                          <button
                            className='action-btn dnd'
                            onClick={() => {
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
                          <button className='icon-action-btn'>
                            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                              chat_bubble
                            </span>
                          </button>
                          <button className='icon-action-btn'>
                            <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
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
            ))}
          </div>
        </div>
        <div className='active-now-column'>
          <h3 className='active-now-header'>Active now</h3>
          <div className='active-now-empty'>
            <h4>Hello? Is anybody on?</h4>
            <p>
              Well, I guess nobody is on. If someone starts an activity, those activities will be
              shown here!
            </p>
          </div>
        </div>
      </div>
    </main>
  );
};
