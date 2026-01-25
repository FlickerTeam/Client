import './currentuser.css';

import type { JSX } from 'react';

import { getDefaultAvatar } from '../../utils/avatar';

const CurrentUser = ({
  user,
  status,
  onSettingsClicked,
}: {
  user: any;
  status?: string;
  onSettingsClicked?: any;
}): JSX.Element => {
  const cdnUrl = localStorage.getItem('selectedCdnUrl')!;
  const assetsUrl = localStorage.getItem('selectedAssetsUrl')!;
  const avatarUrl = user?.avatar
    ? `${assetsUrl}/avatars/${user.id}/${user.avatar}.png`
    : `${cdnUrl}/assets/${getDefaultAvatar(user)}.png`;

  return (
    <section className='user-settings-panel'>
      <div className='avatar-wrapper'>
        <img src={avatarUrl} alt='User Avatar' className='avatar-img' />
        <div className={`status-dot ${status}`}></div>
      </div>

      <div className='user-info'>
        <span className='name'>{user?.username}</span>
        <span className='discriminator'>
          {user?.discriminator !== '0' ? `#${user?.discriminator}` : ''}
        </span>
      </div>

      <div className='buttons'>
        <button title='User Settings' onClick={onSettingsClicked}>
          Edit
        </button>
      </div>
    </section>
  );
};

export default CurrentUser;
