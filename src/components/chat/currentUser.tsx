import './currentUser.css';

import type { JSX } from 'react';

import type { User } from '@/types/users';

import { useAssetsUrl } from '../../context/assetsUrl';
import { getDefaultAvatar } from '../../utils/avatar';

const CurrentUser = ({
  user,
  status,
  onSettingsClicked,
}: {
  user: User | null;
  status?: string;
  onSettingsClicked?: () => void;
}): JSX.Element => {
  const UserAvatar = ({ user }: { user: User | null }) => {
    const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
      `/assets/${getDefaultAvatar(user) ?? ''}.png`,
    );
    const avatarUrl = user?.avatar
      ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${user.id}/${user.avatar}.png`
      : defaultAvatarUrl;

    return (
      <img
        src={avatarUrl || ''}
        alt='User Avatar'
        className='avatar-img'
        onError={() => {
          rollover();
        }}
      />
    );
  };

  return (
    <section className='user-settings-panel'>
      <div className='avatar-wrapper'>
        <UserAvatar user={user} />
        <div className={`status-dot ${status ?? ''}`}></div>
      </div>

      <div className='user-info'>
        <span className='name'>{user?.username ?? ''}</span>
        <span className='discriminator'>
          {user?.discriminator !== '0' ? `#${user?.discriminator ?? ''}` : ''}
        </span>
      </div>

      <div className='buttons'>
        <button className='primary-btn' title='User Settings' onClick={onSettingsClicked}>
          Edit
        </button>
      </div>
    </section>
  );
};

export default CurrentUser;
