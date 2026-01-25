import './serverprofile.css';

import { JSX } from 'react';

import { useModal } from '../../context/modal';
import { getDefaultAvatar } from '../../utils/avatar';
export const ServerProfileModal = ({ member }: { member: any }): JSX.Element => {
  const { closeModal } = useModal();

  const status = member.presence?.status || 'offline';
  const avatarUrl = member.user.avatar
    ? `${localStorage.getItem('selectedAssetsUrl')}/avatars/${member.id}/${member.user.avatar}.png`
    : `${localStorage.getItem('selectedCdnUrl')}/assets/${getDefaultAvatar(member.user)}.png`;
  const bannerUrl = member.user.banner
    ? `url('${localStorage.getItem('selectedAssetsUrl')}/avatars/${member.user.id}/${member.user.banner}.png')`
    : 'none';

  return (
    <div className='profile-modal-root'>
      <div className='profile-modal-header' style={{ backgroundImage: bannerUrl }}>
        <div className='profile-modal-avatar-wrapper'>
          <img src={avatarUrl} alt='Avatar' className='modal-avatar-img' />
          <div className={`modal-status-dot ${status}`} />
        </div>
      </div>

      <div className='profile-modal-body'>
        <div className='profile-modal-identity'>
          <div className='modal-user-info'>
            <span className='modal-username'>{member.user.username}</span>
            <span className='modal-discriminator'>#{member.user.discriminator || '0000'}</span>
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
