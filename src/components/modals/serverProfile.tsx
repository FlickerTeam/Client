import './serverProfile.css';

import { type JSX } from 'react';

import type { Member } from '@/types/guilds';

import { useAssetsUrl } from '../../context/assetsUrl';
import { useModal } from '../../context/modalContext';
import { getDefaultAvatar } from '../../utils/avatar';
export const ServerProfileModal = ({ member }: { member: Member }): JSX.Element => {
  useModal();

  const status = member.presence?.status ?? 'offline';

  const MemberAvatar = ({ member }: { member: Member }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(member.user) ?? ''}.png`,
    );
    const avatarUrl =
      member.avatar || member.user.avatar
        ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${member.id}/${member.user.avatar ?? ''}.png`
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

  const bannerUrl = member.user.banner
    ? `url('${localStorage.getItem('selectedCdnUrl') ?? ''}/banners/${member.user.id}/${member.user.banner ?? ''}.png')`
    : 'none';

  return (
    <div className='profile-modal-root'>
      <div className='profile-modal-header' style={{ backgroundImage: bannerUrl }}>
        <div className='profile-modal-avatar-wrapper'>
          <MemberAvatar member={member} />
          <div className={`modal-status-dot ${status}`} />
        </div>
      </div>

      <div className='profile-modal-body'>
        <div className='profile-modal-identity'>
          <div className='modal-user-info'>
            <span className='modal-username'>{member.user.username}</span>
            <span className='modal-discriminator'>#{member.user.discriminator}</span>
          </div>
          {member.user.pronouns && <span className='modal-pronouns'>{member.user.pronouns}</span>}
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
          <span className='section-title'>Note</span>
          <textarea className='note-input modal-note' placeholder='Click to add a note' />
        </div>
      </div>
    </div>
  );
};
