import './popoutProfile.css';

import { type JSX, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Channel } from 'shared';
import type { Member, Role } from 'shared';
import { post } from 'shared';
import { getDefaultAvatar } from 'shared';
import { logger } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { usePermissions } from '@/hooks/usePermissions';
import { usePopup } from '@/layering/popupContext';
import { useUiUtilityActions } from '@/utils/uiUtils';

interface PopoutProfileProps {
  member: Member;
  roles: Role[] | null;
  contextGuildId: string | null;
}

export const PopoutProfile = ({
  member,
  roles,
  contextGuildId,
}: PopoutProfileProps): JSX.Element => {
  const { getPresence, user } = useGateway();

  const navigate = useNavigate();
  const { closePopup } = usePopup();
  const contextPerms = usePermissions(contextGuildId ?? '0');
  const status = getPresence(member.id)?.status ?? 'offline';
  const [inLineMessage, setInLineMessage] = useState('');
  const { cdnUrl } = useConfig();
  const { openFullProfile } = useUiUtilityActions(null);

  const MemberAvatar = ({ member, className }: { member: Member; className: string }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(member.user)}.png`,
    );
    const avatarUrl =
      member.avatar || member.user.avatar
        ? `${cdnUrl ?? ''}/avatars/${member.id ?? member.user.id}/${member.user.avatar ?? ''}.png`
        : defaultAvatarUrl;

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

  const sendMessage = async (message: string) => {
    if (!message.trim()) return;

    try {
      setInLineMessage('');
      closePopup(); //to-do improve the UX by having these appear as sending msgs first

      const newDMChannel = await post(`/users/@me/channels`, {
        recipients: [member.user.id],
      });

      const dmChannel = newDMChannel as Channel;

      if (dmChannel?.id) {
        const formData = new FormData();

        const nonce = Math.floor(Math.random() * 1000000000).toString();

        const payload = {
          content: message, //resolveMentions? maybe?
          nonce: `flicker-${nonce}`,
          tts: false,
          embeds: [],
        };

        formData.append('payload_json', JSON.stringify(payload));

        await post(`/channels/${dmChannel.id}/messages`, formData);

        void navigate(`/channels/@me/${dmChannel.id}`);
      }
    } catch (error) {
      logger.error(`POPOUT_PROFILE`, `Failed to send inline message`, error);
    }
  };

  const getRoleColor = (colorDecimal: number) => {
    if (!colorDecimal) {
      return 'rgba(185, 187, 190, 0.2)';
    }

    return `#${colorDecimal.toString(16).padStart(6, '0')}`;
  };

  const bannerUrl = member.user.banner
    ? `url('${cdnUrl ?? ''}/banners/${member.user.id}/${member.user.banner}.png')`
    : 'none';

  const accentColor = member.user.accent_color
    ? `#${member.user.accent_color.toString(16).padStart(6, '0')}`
    : 'var(--bg-sidebar-secondary)';

  return (
    <div className='profile-popout-container'>
      <div
        className='popout-banner'
        style={{
          backgroundImage: bannerUrl,
          backgroundColor: bannerUrl === 'none' ? accentColor : undefined,
        }}
      />
      <div className='profile-popout-content'>
        <div className='popout-header'>
          <button
            className='avatar-wrapper-centered overlap'
            onMouseOver={(e) => {
              e.currentTarget.classList.add('avatar-img-text');
            }}
            onFocus={(e) => {
              e.currentTarget.classList.add('avatar-img-text');
            }}
            onBlur={(e) => {
              e.currentTarget.classList.remove('avatar-img-text');
            }}
            onMouseLeave={(e) => {
              e.currentTarget.classList.remove('avatar-img-text');
            }}
            onClick={(e: React.MouseEvent) => {
              e.preventDefault();
              e.stopPropagation();

              void openFullProfile(member);
            }}
          >
            <MemberAvatar member={member} className='avatar-img-large' />
            <div className={`status-dot-large ${status}`} title={status}></div>
          </button>
          <div className='user-details-centered'>
            <span className='username'>{member.user.global_name ?? member.user.username}</span>
            <span className='discriminator'>#{member.user.discriminator}</span>
            {member.user.bot && <span className='bot-tag'>Bot</span>}
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
        {(member.roles.length > 0 || contextPerms.canManageRoles) && (
          <div className='popout-section'>
            <span className='section-title'>ROLES</span>

            <div className='roles-container'>
              {member.roles.map((roleId: string) => {
                const role = roles?.find((r: Role) => r.id === roleId);
                if (!role) return null;

                const color = getRoleColor(role.color);

                return (
                  <div
                    key={roleId}
                    className='role-pill role-emphasis-border'
                    style={{
                      borderColor: color,
                      outlineColor: color,
                      background: `${color}22`,
                    }}
                  >
                    {contextPerms.canManageRoles && (
                      <span
                        className='role-removal-btn'
                        onClick={(e) => {
                          e.stopPropagation();
                        }}
                      >
                        ×
                      </span>
                    )}
                    {role.name}
                  </div>
                );
              })}

              {contextPerms.canManageRoles && <div className='add-role-btn'>+</div>}
            </div>
          </div>
        )}
        <div className='popout-section'>
          <span className='section-title'>NOTE</span>
          <textarea className='note-input' placeholder='Click to add a note' />
        </div>
        {member.user.id !== user?.id && (
          <div
            className='popout-section'
            style={{
              marginTop: '-30px',
            }}
          >
            <hr className='popout-separator' />
            <input
              className='note-input'
              placeholder={`Message @${member.user.username}`}
              style={{
                backgroundColor: 'var(--bg-secondary)',
              }}
              value={inLineMessage}
              onChange={(e) => {
                setInLineMessage(e.target.value);
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && inLineMessage.trim() !== '') {
                  e.preventDefault();
                  void sendMessage(inLineMessage);
                  setInLineMessage('');
                }
              }}
            />
          </div>
        )}
      </div>
    </div>
  );
};
