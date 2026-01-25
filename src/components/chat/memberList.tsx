import './memberlist.css';

import { JSX, useEffect, useState } from 'react';

import { useContextMenu } from '../../context/contextMenu';
import { useGateway } from '../../context/gateway';
import { useModal } from '../../context/modal';
import { getDefaultAvatar } from '../../utils/avatar';

const MemberListItem = ({
  member,
  isTyping,
  roles,
}: {
  member: any;
  isTyping: boolean;
  roles: any[];
}): JSX.Element => {
  const { openContextMenu, closeContextMenu } = useContextMenu();
  const { openModal, closeModal } = useModal();

  const status = member.presence?.status || 'offline';
  const avatarUrl =
    member.avatar || member.user.avatar
      ? `${localStorage.getItem('selectedAssetsUrl')!}/avatars/${member.id}/${member.user.avatar}.png`
      : `${localStorage.getItem('selectedCdnUrl')!}/assets/${getDefaultAvatar(member.user)}.png`; //This needs to not be hard coded ASAP.

  const handleRightClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    openContextMenu(
      e.clientX,
      e.clientY,
      <div className='context-menu-out guild-context-menu'>
        <div className='button'>Profile</div>
        <div className='button'>Message</div>
        <div className='button'>Change Nickname</div>
        <div className='button'>Copy ID</div>
      </div>,
    );
  };

  const handleProfileOpen = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    closeContextMenu();

    setTimeout(() => {
      openModal('SERVER_PROFILE', {
        member: member,
      });
    }, 0);
  };

  const getRoleColor = (colorDecimal: number) => {
    if (!colorDecimal || colorDecimal === 0) {
      return 'rgba(185, 187, 190, 0.2)';
    }

    return `#${colorDecimal.toString(16).padStart(6, '0')}`;
  };

  const showProfilePopout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left + 30;
    const y = rect.top - 10;

    const bannerUrl = member.user.banner
      ? `url('${localStorage.getItem('selectedAssetsUrl')!}/avatars/${member.user.id}/${member.user.banner}.png')`
      : 'none';

    openContextMenu(
      x,
      y,
      <div
        className='profile-popout-container'
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        {member.user.banner && (
          <div
            className='popout-banner'
            style={{
              backgroundImage: bannerUrl,
            }}
          />
        )}
        <div className='profile-popout-content'>
          <div className='popout-header'>
            <div
              className={`avatar-wrapper-centered ${member.user.banner ? 'overlap' : ''}`}
              onMouseOver={(e) => {
                e.currentTarget.classList.add('avatar-img-text');
              }}
              onMouseLeave={(e) => {
                e.currentTarget.classList.remove('avatar-img-text');
              }}
              onClick={(e) => {
                handleProfileOpen(e);
              }}
            >
              <img src={avatarUrl} alt='Avatar' className='avatar-img-large' />
              <div className={`status-dot-large ${status}`} title={status}></div>
            </div>
            <div className='user-details-centered'>
              <span className='username'>{member.user.username}</span>
              <span className='discriminator'>#{member.user.discriminator || '0000'}</span>
            </div>
            {member.user.pronouns && (
              <div className='pronouns-row'>
                <span className='pronouns' title={`${member.user.username}'s pronouns`}>
                  {member.user.pronouns}
                </span>
              </div>
            )}
          </div>
          {member.user.bio && (
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
          <div className='popout-section'>
            <span className='section-title'>ROLES</span>
            <div className='roles-container'>
              {member.roles.map((roleId: any) => {
                const role = roles.find((r: any) => r.id === roleId);

                if (!role) return null;

                const color = getRoleColor(role.color);

                return (
                  <>
                    <div
                      className='role-pill role-emphasis-border'
                      style={{
                        borderColor: color,
                      }}
                    >
                      <span className='role-removal-button'>×</span> {role.name}
                    </div>
                  </>
                );
              })}
              <div className='add-role-button'>+</div>
            </div>
          </div>
          <div className='popout-section'>
            <span className='section-title'>NOTE</span>
            <textarea className='note-input' placeholder='Click to add a note' />
          </div>
        </div>
      </div>,
    );
  };

  return (
    <div
      className='member-list-item-wrapper'
      onContextMenu={(e) => {
        handleRightClick(e);
      }}
      onClick={(e) => {
        showProfilePopout(e);
      }}
    >
      <div className={`member-list-item ${status === 'offline' ? 'offline-member' : ''}`}>
        <div className='avatar-wrapper'>
          <img
            src={avatarUrl}
            alt={`${member.user.username}'s Avatar`}
            className='avatar-img'
          ></img>
          {isTyping ? (
            <div className={`typing-indicator-dots ${status}`}>
              <span className='dot'></span>
              <span className='dot'></span>
              <span className='dot'></span>
            </div>
          ) : (
            <div className={`status-dot ${status}`}></div>
          )}
        </div>
        <div className='user-info'>
          <span className='name'>{member.user.username}</span>
        </div>
      </div>
    </div>
  );
};

const MemberList = ({ selectedGuild, selectedChannel }: any): JSX.Element => {
  const { memberLists, requestMembers, typingUsers } = useGateway();
  const [rangeIndex, setRangeIndex] = useState(0);

  useEffect(() => {
    if (selectedGuild?.id && selectedChannel?.id && requestMembers) {
      const hasData = memberLists?.[selectedGuild.id];

      if (!hasData) {
        setRangeIndex(0);
        requestMembers(selectedGuild.id, selectedChannel.id, [[0, 99]]);
      }
    }
  }, [selectedGuild?.id, selectedChannel?.id, requestMembers, memberLists]);

  if (!selectedGuild || !selectedChannel) return <></>;

  const currentChannelTyping = typingUsers[selectedChannel.id] || {};

  const listData = memberLists?.[selectedGuild?.id];

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

    if (scrollHeight - scrollTop <= clientHeight + 100) {
      const nextRangeStart = (rangeIndex + 1) * 100;

      if (nextRangeStart < (listData?.member_count || 0)) {
        setRangeIndex((prev) => prev + 1);
        requestMembers?.(selectedGuild.id, selectedChannel.id, [
          [0, 99],
          [nextRangeStart, nextRangeStart + 99],
        ]);
      }
    }
  };

  if (!listData) {
    return (
      <aside className='members-column'>
        <header className='header-base'>Loading members...</header>
      </aside>
    );
  }

  const items = listData.ops.find((op: any) => op.op === 'SYNC')?.items || [];

  return (
    <aside className='members-column'>
      <header className='header-base'>Members ({listData.member_count})</header>
      <div className='scroller' onScroll={handleScroll}>
        {items.map((item: any, index: number) => {
          if (!item) {
            return <div key={`placeholder-${index}`} style={{ height: '44px' }} />;
          }

          if (item.group && item.group.count > 0) {
            const role = selectedGuild.roles.find((x: any) => x.id === item.group.id);
            const group_name = role?.name ?? item.group.id;

            return (
              <div key={`group-${item.group.id}`} className='role-title'>
                {group_name} — {item.group.count}
              </div>
            );
          }

          if (item.member) {
            return (
              <MemberListItem
                key={`${item.member.user.id}-${index}`}
                member={item.member}
                isTyping={!!currentChannelTyping[item.member.user.id]}
                roles={selectedGuild.roles}
              />
            );
          }

          return null;
        })}
      </div>
    </aside>
  );
};

export default MemberList;
