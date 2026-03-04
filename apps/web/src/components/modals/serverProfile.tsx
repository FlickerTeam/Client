import './serverProfile.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Guild, Member, User } from 'shared';
import { get, getDefaultAvatar, logger } from 'shared';

import { MutualItem } from '@/components/chat/mutualItem';
import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { useModal } from '@/layering/modalContext';
import { intToHex } from '@/utils/uiUtils';

//import hypesquad from "@/assets/hypesquad.svg";

export interface ConnectedAccount {
  id: string;
} //do this properly later

export interface ServerProfileProps {
  member: Member;
  mutual_guilds?: Guild[];
  mutual_friends?: User[];
  connected_accounts?: ConnectedAccount[];
  premium_since?: string | null;
  premium_type?: number;
}

export interface SharedGuild {
  id: string;
  nick?: string | null;
}

export const ServerProfileModal = ({
  member,
  mutual_guilds: sharedGuilds,
  mutual_friends: sharedFriends,
}: ServerProfileProps): JSX.Element => {
  const { openModal, closeModal, updateModal } = useModal();
  const { guilds, getPresence, user } = useGateway();
  const navigate = useNavigate();
  const [bannerLoaded, setBannerLoaded] = useState(!member.user.banner);
  const { cdnUrl } = useConfig();

  const status = getPresence(member.id)?.status ?? 'offline';

  const [activeTab, setActiveTab] = useState<'INFO' | 'GUILDS' | 'FRIENDS'>('INFO');

  const handleGuildClick = (guildId: string) => {
    closeModal();
    void navigate(`/channels/${guildId}`);
  };

  const handleFriendClick = async (user: User) => {
    closeModal();

    openModal('SERVER_PROFILE', { member: { user } as Member });

    try {
      const query = new URLSearchParams({
        with_mutual_guilds: 'true',
        with_mutual_friends: 'true',
      }).toString();

      const fullProfile = await get<ServerProfileProps>(
        `/users/${member.user.id}/profile?${query}`,
      );

      updateModal<'SERVER_PROFILE'>({
        mutual_guilds: fullProfile.mutual_guilds,
        mutual_friends: fullProfile.mutual_friends,
        connected_accounts: fullProfile.connected_accounts,
        premium_since: fullProfile.premium_since,
        premium_type: fullProfile.premium_type,
      });
    } catch (error) {
      logger.error(`SERVER_PROFILE`, `Failed to fetch full user profile from API!`, error);
    }
  };

  const MemberAvatar = ({ member }: { member: Member }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(member.user)}.png`,
    );

    const avatarUrl =
      member.avatar || member.user.avatar
        ? `${cdnUrl ?? ''}/avatars/${member.user.id}/${member.user.avatar ?? ''}.png`
        : defaultAvatarUrl;

    return (
      <img
        src={avatarUrl || ''}
        alt='Avatar'
        className='modal-avatar-img'
        onError={() => {
          rollover();
        }}
      />
    );
  };

  const bannerColor = intToHex(member.user.accent_color ?? 0);
  const fullBannerUrl = `${cdnUrl ?? ''}/banners/${member.user.id}/${member.user.banner ?? ''}.png`;

  return (
    <div className='profile-modal-root'>
      {member.user.banner && (
        <img
          src={fullBannerUrl}
          alt={`${member.user.username}'s banner`}
          style={{ display: 'none' }}
          onLoad={() => {
            setBannerLoaded(true);
          }}
        />
      )}

      <div
        className={`profile-modal-header ${bannerLoaded ? 'loaded' : ''}`}
        style={{
          backgroundImage: member.user.banner ? `url('${fullBannerUrl}')` : 'none',
          backgroundColor: bannerColor,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className='profile-modal-avatar-wrapper'>
          <MemberAvatar member={member} />
          <div
            className={`status-dot-large ${status}`}
            style={{
              right: '5px',
            }}
          />
        </div>
      </div>

      <div className='profile-modal-body'>
        <div className='profile-modal-identity'>
          <div className='modal-user-info'>
            <span className='modal-username'>{member.user.username}</span>
            <span className='modal-discriminator'>#{member.user.discriminator}</span>
            {member.user.bot && (
              <span
                className='bot-tag'
                style={{
                  bottom: '3px',
                }}
              >
                Bot
              </span>
            )}
          </div>
          <div className='identity-meta-row'>
            {member.user.pronouns && <span className='modal-pronouns'>{member.user.pronouns}</span>}
            {/*
                {Number(member.user.public_flags) > 0 && (
                    <div className="profile-badges">
                      <div className="badge-item" title="HypeSquad">
                        <img src={hypesquad} alt="badge" />
                      </div>
                    </div>
                  )}
              */}
          </div>
        </div>

        {sharedGuilds && member.user.id !== user?.id && (
          <>
            <hr className='popout-separator' />
            <div className='popout-section'>
              <div className='tab-bar'>
                <div
                  className={`tab ${activeTab === 'INFO' ? 'selected' : ''}`}
                  onClick={() => {
                    setActiveTab('INFO');
                  }}
                >
                  User Info
                </div>
                {sharedGuilds.length > 0 && (
                  <>
                    <div
                      className={`tab ${activeTab === 'GUILDS' ? 'selected' : ''}`}
                      onClick={() => {
                        setActiveTab('GUILDS');
                      }}
                    >
                      Mutual Servers ({sharedGuilds.length})
                    </div>
                    <div
                      className={`tab ${activeTab === 'FRIENDS' ? 'selected' : ''}`}
                      onClick={() => {
                        setActiveTab('FRIENDS');
                      }}
                    >
                      Mutual Friends ({sharedFriends?.length})
                    </div>
                  </>
                )}
              </div>
            </div>
          </>
        )}

        {member.user.bio && activeTab === 'INFO' && (
          <>
            <hr className='popout-separator' />
            <div className='popout-section'>
              <span className='section-title'>ABOUT ME</span>
              <div className='about-me-container'>
                <p>{member.user.bio}</p>
              </div>
            </div>
          </>
        )}

        <hr className='popout-separator' />

        {activeTab === 'INFO' && (
          <>
            <div className='popout-section'>
              <span className='section-title'>Note</span>
              <textarea className='note-input modal-note' placeholder='Click to add a note' />
            </div>
          </>
        )}

        {activeTab === 'GUILDS' && (
          <>
            <div className='popout-section'>
              <OverlayScrollbarsComponent
                element='div'
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
                className='mutual-list'
              >
                {sharedGuilds?.length ? (
                  sharedGuilds.map((shared: SharedGuild) => {
                    //to-do make a type of shared guild where its just id and nick
                    const fullGuild = guilds.find((g) => g.id === shared.id);
                    const guildName = fullGuild?.name || 'Unknown Server';
                    const guildIcon = fullGuild?.icon
                      ? `${cdnUrl ?? ''}/icons/${fullGuild.id}/${fullGuild.icon ?? ''}.png`
                      : '';

                    return (
                      <MutualItem
                        key={shared.id}
                        title={guildName}
                        subtitle={shared.nick ? shared.nick : ''}
                        icon={guildIcon}
                        onClick={() => {
                          handleGuildClick(shared.id);
                        }}
                      />
                    );
                  })
                ) : (
                  <div className='empty-state'>No Mutual Servers</div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          </>
        )}

        {activeTab === 'FRIENDS' && (
          <>
            <div className='popout-section'>
              <OverlayScrollbarsComponent
                element='div'
                options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
                className='mutual-list'
              >
                {sharedFriends?.length ? (
                  sharedFriends.map((friend) => (
                    <MutualItem
                      key={friend.id}
                      title={friend.global_name || friend.username}
                      subtitle={`@${friend.username}`}
                      icon={`${cdnUrl ?? ''}/avatars/${friend.id}/${friend.avatar ?? ''}.png`}
                      onClick={() => void handleFriendClick(friend)}
                    />
                  ))
                ) : (
                  <div className='empty-state'>No Mutual Friends</div>
                )}
              </OverlayScrollbarsComponent>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
