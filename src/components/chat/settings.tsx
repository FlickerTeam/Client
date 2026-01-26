import './settings.css';

import type { User } from '@/types/users';

interface SettingsProps {
  user: User | null;
  onClose: () => void;
}

import { type JSX, useState } from 'react';
const Settings = ({ user, onClose }: SettingsProps): JSX.Element => {
  const [activeTab, setActiveTab] = useState('My Account');

  const sidebarItems = [
    {
      category: 'USER SETTINGS',
      items: ['My Account'],
    },
    {
      category: 'FLICKER SETTINGS',
      items: ['Developer Settings'],
    },
  ];

  const renderTab = () => {
    switch (activeTab) {
      case 'My Account':
        return (
          <div className='settings-section'>
            <div className='settings-header'>
              <h1>My Account</h1>
            </div>
            <div className='account-card'>
              <div className='account-edit-box'>
                <div className='field-group'>
                  <span className='field-title'>USERNAME</span>
                  <div className='field-row'>
                    <span>
                      {user?.username}#{user?.discriminator}
                    </span>
                    <button className='small-edit-btn'>Edit</button>
                  </div>
                </div>
                <div className='field-group'>
                  <span className='field-title'>EMAIL</span>
                  <div className='field-row'>
                    <span>********@gmail.com</span>
                    <button className='small-edit-btn'>Edit</button>
                  </div>
                </div>
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
          {sidebarItems.map((group) => (
            <div key={group.category} className='sidebar-group'>
              <div className='sidebar-category'>{group.category}</div>
              {group.items.map((item) => (
                <button
                  key={item}
                  className={`sidebar-item ${activeTab === item ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item);
                  }}
                >
                  {item}
                </button>
              ))}
            </div>
          ))}
          <hr
            className='separator'
            style={{
              width: '80%',
              marginTop: '20px',
            }}
          ></hr>
          <div className='sidebar-group'>
            <div className='sidebar-item logout'>Log Out</div>
          </div>
          <hr
            className='separator'
            style={{
              width: '80%',
              marginTop: '10px',
            }}
          ></hr>
          <span className='version-text'>FLCKR DEV</span>
          <span className='version-text'>Version 1.0</span>
        </nav>
      </div>

      <div className='settings-content-wrapper'>
        <div className='settings-main-content'>
          {renderTab()}
          <button className='close-btn' onClick={onClose}>
            <div className='close-circle'>✕</div>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Settings;
