import './currentUser.css';

import { type JSX, useState } from 'react';

const CurrentUser = ({ onSettingsClicked }: { onSettingsClicked: () => void }): JSX.Element => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleOpen = () => {
    setIsOpen((prev) => !prev);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      toggleOpen();
    }
  };

  return (
    <section className={`volume-controls-container ${isOpen ? 'open' : ''}`}>
      <div
        className='hover-trap'
        onClick={toggleOpen}
        onKeyDown={handleKeyDown}
        role='button'
        tabIndex={0}
        aria-label='Expand volume controls'
      />

      <div className='slide-wrapper'>
        <div
          className='trigger-tab'
          onClick={(e) => {
            e.stopPropagation();
            toggleOpen();
          }}
          onKeyDown={(e) => {
            e.stopPropagation();
            handleKeyDown(e);
          }}
          role='button'
          tabIndex={0}
          aria-label='Toggle volume controls'
        >
          <div className='trigger-icon'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              expand_more
            </span>
          </div>
        </div>

        <div className='volume-controls-panel'>
          <button className='control-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              videogame_asset
            </span>
          </button>
          <button className='control-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              headset_mic
            </span>
          </button>
          <button className='control-btn' onClick={onSettingsClicked}>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              mic_off
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default CurrentUser;
