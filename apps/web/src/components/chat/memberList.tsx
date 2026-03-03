import './memberList.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useCallback, useEffect, useState } from 'react';
import type { Channel } from 'shared';
import type { Guild, Member, Role } from 'shared';
import { getDefaultAvatar } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { useMenuOverlay } from '@/layering/menuOverlayStore';
import { usePopup } from '@/layering/popupContext';

const MemberListItem = ({
  member,
  isTyping,
  roles,
  color,
}: {
  member: Member;
  isTyping: boolean;
  roles?: Role[];
  color?: string;
}): JSX.Element => {
  const { openContextMenu } = useMenuOverlay();
  const { openPopup } = usePopup();
  const { getPresence } = useGateway();
  const { cdnUrl } = useConfig();

  const status = getPresence(member.id)?.status ?? 'offline';

  const MemberAvatar = ({ member, className }: { member: Member; className: string }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(member.user)}.png`,
    );
    const avatarUrl =
      member.avatar || member.user.avatar
        ? `${cdnUrl ?? ''}/avatars/${member.id}/${member.user.avatar ?? ''}.png`
        : defaultAvatarUrl; //This needs to not be hard coded ASAP.

    return (
      <img
        src={avatarUrl || ''}
        alt={`${member.user.username}'s Avatar`}
        className={className}
        onError={() => {
          rollover();
        }}
      />
    );
  };

  const handleRightClick = (e: React.MouseEvent, member: Member) => {
    e.preventDefault();
    e.stopPropagation();

    const MENU_WIDTH = 180;
    let x = e.clientX;
    const y = e.clientY;

    if (x + MENU_WIDTH > window.innerWidth) {
      x = x - MENU_WIDTH;
    }

    openContextMenu(
      x,
      y,
      <div className='context-menu-out guild-context-menu'>
        <div className='button'>Profile</div>
        <div className='button'>Message</div>
        <div className='button'>Change Nickname</div>
        <div
          className='button'
          onClick={() => {
            void navigator.clipboard.writeText(member.id);
          }}
        >
          Copy ID
        </div>
      </div>,
    );
  };

  const showProfilePopout = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left - 310;
    const y = rect.top;

    openPopup('USER_PROFILE_POPOUT', {
      x,
      y,
      member,
      roles: roles ?? [],
    });
  };

  return (
    <button
      className={`member-list-item ${status === 'offline' ? 'offline-member' : ''}`}
      onContextMenu={(e) => {
        handleRightClick(e, member);
      }}
      onClick={(e) => {
        showProfilePopout(e);
      }}
    >
      <div className='avatar-wrapper'>
        <MemberAvatar member={member} className='avatar-img' />
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
        <span
          className='name'
          style={{
            color: color,
          }}
        >
          {member.nick || member.user.global_name || member.user.username}
        </span>
        {member.user.bot && <span className='bot-tag'>Bot</span>}
      </div>
    </button>
  );
};

const ITEM_HEIGHT = 44;
const LEEWAY_HEIGHT = 100;

const MemberList = ({
  selectedGuild,
  selectedChannel,
  active,
}: {
  selectedGuild: Guild | null;
  selectedChannel: Channel | null;
  active: boolean;
}): JSX.Element => {
  const { memberLists, memberListsRef, requestMembers, getMemberColor, typingUsers } = useGateway();
  const [rangeIndex, setRangeIndex] = useState(0);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportHeight, setViewportHeight] = useState(window.innerHeight - LEEWAY_HEIGHT);

  useEffect(() => {
    const handleResize = () => {
      setViewportHeight(window.innerHeight - LEEWAY_HEIGHT);
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  useEffect(() => {
    const guildId = selectedGuild?.id;
    const channelId = selectedChannel?.id;

    if (guildId && channelId && memberListsRef) {
      const hasData = memberListsRef.current?.[guildId];

      if (!hasData) {
        requestMembers(guildId, channelId, [[0, 99]]);
      }
    }
  }, [selectedGuild?.id, selectedChannel?.id, requestMembers, memberListsRef]);

  const currentChannelTyping = selectedChannel?.id ? typingUsers[selectedChannel.id] : {};

  const listData = selectedGuild?.id ? memberLists?.[selectedGuild.id] : undefined;

  const handleScroll = useCallback(
    (e: React.UIEvent<HTMLDivElement>) => {
      const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;

      setScrollTop(scrollTop);

      if (scrollHeight - scrollTop <= clientHeight + 100) {
        const nextRangeStart = (rangeIndex + 1) * 100;

        if (listData && nextRangeStart < listData.member_count) {
          setRangeIndex((prev) => prev + 1);
          if (selectedGuild?.id && selectedChannel?.id) {
            requestMembers(selectedGuild.id, selectedChannel.id, [
              [0, 99],
              [nextRangeStart, nextRangeStart + 99],
            ]);
          }
        }
      }
    },
    [rangeIndex, listData, requestMembers, selectedGuild, selectedChannel],
  );

  if (!listData) {
    return (
      <aside className='members-column'>
        <header className='members-column-header-base'>Loading members...</header>
      </aside>
    );
  }

  const items = listData.items;

  const startIndex = Math.floor(scrollTop / ITEM_HEIGHT);
  const endIndex = Math.min(startIndex + Math.ceil(viewportHeight / ITEM_HEIGHT) + 5, items.length);

  const visibleItems = items.slice(startIndex, endIndex);
  const totalHeight = items.length * ITEM_HEIGHT;
  const offsetY = startIndex * ITEM_HEIGHT;

  return !active ? (
    <></>
  ) : (
    <>
      <aside className='members-column'>
        <header className='members-column-header-base'>Members ({listData.member_count})</header>
        <OverlayScrollbarsComponent
          element='div'
          options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
          events={{
            scroll: (instance) => {
              const { scrollOffsetElement } = instance.elements();
              handleScroll({
                currentTarget: scrollOffsetElement,
              } as unknown as React.UIEvent<HTMLDivElement>);
            },
          }}
          className='scroller-hide members-column-scroller'
          style={{ height: `${String(viewportHeight)}px` }}
        >
          <div style={{ height: `${String(totalHeight)}px`, position: 'relative' }}>
            <div style={{ transform: `translateY(${String(offsetY)}px)`, width: '100%' }}>
              {visibleItems.map((item, index) => {
                if (item.group && item.group.count > 0) {
                  const role = selectedGuild?.roles.find((x: Role) => x.id === item.group?.id);
                  return (
                    <div key={`group-${item.group.id}`} className='role-title'>
                      {role?.name ?? item.group.id} — {item.group.count}
                    </div>
                  );
                }

                if (item.member) {
                  const memberWithGuild = { ...item.member, guild_id: selectedGuild?.id };
                  const color = getMemberColor(item.member, selectedGuild);
                  const memberId = item.member.user.id;
                  return (
                    <MemberListItem
                      key={`${memberId}-${index.toString()}`}
                      member={memberWithGuild}
                      isTyping={!!currentChannelTyping?.[memberId]}
                      roles={selectedGuild?.roles}
                      color={color}
                    />
                  );
                }
                return null;
              })}
            </div>
          </div>
          {listData.partial && (
            <div className='role-title' style={{ transform: `translateY(${String(offsetY)}px)` }}>
              Loading...
            </div>
          )}
        </OverlayScrollbarsComponent>
      </aside>
    </>
  );
};

export default MemberList;
