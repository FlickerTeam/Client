import './settings.css';

import { type JSX, useState } from 'react';

import type { User } from '@/types/users';

interface SettingsProps {
  user: User | null;
  onClose: () => void;
}

const Settings = ({ user, onClose }: SettingsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState('My Account');

  const renderTab = () => {
    switch (activeTab) {
      case 'My Account':
        return (
          <div className='settings-section'>
            <div className='settings-header'>
              <h1>My Account</h1>
            </div>
            <div className='account-card'>
              <div className='account-info-grid'>
                <p className='info-label'>UserTag</p>
                <p className='info-value'>
                  {user?.username ?? 'User'}#{user?.discriminator ?? '0000'}
                </p>
                <p className='info-label'>Email</p>
                <p className='info-value'>*****@gmail.com</p>
              </div>
            </div>
          </div>
        );
      default:
        return <></>;
    }
  };

  return (
    <div className='settings-overlay'>
      <div className='settings-sidebar-wrapper'>
        <nav className='settings-sidebar'>
          <div className='search-bar-container'>
            <div className='search-bar'>
              <span className='material-symbols-rounded search-icon' style={{ fontSize: '20px' }}>
                search
              </span>
              <input type='text' placeholder='Search Settings' className='search-input' />
            </div>
          </div>

          <div className='sidebar-group'>
            <div className='sidebar-category'>User Settings</div>
            <button
              className={`sidebar-item ${activeTab === 'My Account' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('My Account');
              }}
            >
              My Account
            </button>
          </div>

          <div className='sidebar-group'>
            <div className='sidebar-category'>App Settings</div>
            <button
              className={`sidebar-item ${activeTab === 'Developer Options' ? 'active' : ''}`}
              onClick={() => {
                setActiveTab('Developer Options');
              }}
            >
              Developer Options
            </button>
          </div>

          <div className='divider-container'>
            <hr style={{ border: 'none', borderTop: '1px solid var(--bg-modifier-accent)' }} />
          </div>

          <div className='sidebar-group'>
            <button className='sidebar-item logout'>Log Out</button>
          </div>

          <div className='divider-container'>
            <hr style={{ border: 'none', borderTop: '1px solid var(--bg-modifier-accent)' }} />
          </div>

          <div className='version-info'>
            <span className='version-text'>Development 0.1.0</span>
          </div>
        </nav>
      </div>

      <div className='settings-content-wrapper'>
        <div className='settings-main-content'>{renderTab()}</div>
        <div className='close-btn-container'>
          <button className='close-btn' onClick={onClose}>
            <div className='close-circle'>
              <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                close
              </span>
            </div>
            <span className='esc-text'>ESC</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
