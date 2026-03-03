import './noTextChannels.css';

import { type JSX } from 'react';

const NoTextChannels = (): JSX.Element => {
  return (
    <div className='no-text-channels-container'>
      <div className='no-text-channels-content'>
        <div className='no-channels-icon'>
          <span className='material-symbols-rounded' style={{ fontSize: '96px' }}>
            chat_bubble_off
          </span>
        </div>
        <h2>Strange, huh?</h2>
        <p>
          If you see channels on the sidebar, click on one and start chatting! If not, then it is
          either that you don&rsquo;t have access to any channels or there are none in this server.
        </p>
      </div>
    </div>
  );
};

export default NoTextChannels;
