import './settings.css';

import React, { JSX, useState } from 'react';
const Settings = ({ user, onClose }: { user: any; onClose: any }): JSX.Element => {
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
                  <label>USERNAME</label>
                  <div className='field-row'>
                    <span>
                      {user.username}#{user.discriminator}
                    </span>
                    <button className='small-edit-btn'>Edit</button>
                  </div>
                </div>
                <div className='field-group'>
                  <label>EMAIL</label>
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
                <div
                  key={item}
                  className={`sidebar-item ${activeTab === item ? 'active' : ''}`}
                  onClick={() => {
                    setActiveTab(item);
                  }}
                >
                  {item}
                </div>
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
          <div className='close-button' onClick={onClose}>
            <div className='close-circle'>✕</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
