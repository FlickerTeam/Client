import { JSX, useEffect, useState } from "react";
import './memberlist.css'
import { useGateway } from "../../context/gateway";
import { getDefaultAvatar } from "../../utils/avatar";

const MemberListItem = ({ member, isTyping }: {
    member: any,
    isTyping: boolean
}): JSX.Element => {
    const status = member.presence?.status || "offline";
    const avatarUrl = (member.avatar || member.user.avatar) ? `${localStorage.getItem("selectedAssetsUrl")!}/avatars/${member.id}/${member.user.avatar}.png` : `${localStorage.getItem("selectedCdnUrl")!}/assets/${getDefaultAvatar(member.user)}.png`; //This needs to not be hard coded ASAP.
     
    return (
        <div className="member-list-item-wrapper">
            <div className={`member-list-item ${status === 'offline' ? 'offline-member' : ''}`}>
                <div className="avatar-wrapper">
                    <img src={avatarUrl} alt={`${member.user.username}'s Avatar`} className="avatar-img"></img>
                    {isTyping ? (
                        <div className={`typing-indicator-dots ${status}`}>
                             <span className="dot"></span>
                             <span className="dot"></span>
                             <span className="dot"></span>
                        </div>
                    ) : (
                        <div className={`status-dot ${status}`}></div>
                    )}
                </div>
                <div className="user-info">
                    <span className="name">{member.user.username}</span>
                </div>
            </div>
        </div>
    )
}

const MemberList = ({ selectedGuild, selectedChannel }: any): JSX.Element => {
    const { memberLists, requestMembers, typingUsers } = useGateway();
    const [rangeIndex, setRangeIndex] = useState(0);

    if (!selectedGuild || !selectedChannel) return <></>;

    const currentChannelTyping = typingUsers[selectedChannel.id] || {};

    const listData = memberLists && memberLists[selectedGuild?.id];

    const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
        const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
        
        if (scrollHeight - scrollTop <= clientHeight + 100) {
            const nextRangeStart = (rangeIndex + 1) * 100;

            if (nextRangeStart < (listData?.member_count || 0)) {
                setRangeIndex(prev => prev + 1);
                requestMembers?.(selectedGuild.id, selectedChannel.id, [
                    [0, 99],
                    [nextRangeStart, nextRangeStart + 99]
                ]);
            }
        }
    };

    if (!listData) {
        return <aside className="members-column"><header className="header-base">Loading members...</header></aside>;
    }

    const items = listData.ops.find((op: any) => op.op === "SYNC")?.items || [];

    return (
        <aside className="members-column">
            <header className="header-base">Members ({listData.member_count})</header>
            <div className="scroller" onScroll={handleScroll}>
                {items.map((item: any, index: number) => {
                    if (!item) {
                        return <div key={`placeholder-${index}`} style={{ height: '44px' }} />;
                    }

                    if (item.group) {
                        return (
                            <div key={`group-${item.group.id}`} className="role-title">
                                {item.group.id.toUpperCase()} — {item.group.count}
                            </div>
                        );
                    }

                    if (item.member) {
                        return (
                            <MemberListItem 
                                key={`${item.member.user.id}-${index}`} 
                                member={item.member} 
                                isTyping={!!currentChannelTyping[item.member.user.id]}
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
