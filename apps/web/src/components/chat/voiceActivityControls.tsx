import './voiceActivityControls.css';

import { type JSX, useState } from 'react';

import { useVoiceContext } from '@/context/voiceContext';

interface VoiceStatusProps {
  status: 'connected' | 'connecting' | 'disconnected';
  channelName: string;
  onDisconnect: () => void;
}

const VoiceStatusBar = ({ status, channelName }: VoiceStatusProps) => (
  <div className='voice-connection-info'>
    <div className='status-row'>
      <span className={`status-indicator ${status}`} />
      <span className='status-text'>
        {status === 'connected' ? 'Voice Connected' : 'Connecting...'}
      </span>
    </div>
    <span className='channel-name'>{channelName}</span>
  </div>
);

const VoiceActivityControls = (): JSX.Element => {
  const { connectionStatus, channel } = useVoiceContext();

  const [isOpen, setIsOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isDeafened, setIsDeafened] = useState(false);

  const currentChannelName: string = channel?.name ?? '';

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
          className='trigger-tab-wrapper'
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
          <div className='trigger-tab'>
            <div className='trigger-icon'>
              <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                expand_more
              </span>
            </div>
          </div>
        </div>

        {connectionStatus !== 'disconnected' && (
          <VoiceStatusBar
            status={connectionStatus}
            channelName={currentChannelName}
            onDisconnect={() => {
              console.log('Disconnecting...');
            }}
          />
        )}

        <div className='volume-controls-panel'>
          <button className='control-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              videogame_asset
            </span>
          </button>
          <button
            className={`control-btn ${isDeafened ? 'active' : ''}`}
            onClick={() => {
              setIsDeafened(!isDeafened);
            }}
          >
            <span className='material-symbols-rounded'>
              {isDeafened ? 'headset_off' : 'headset'}
            </span>
          </button>
          <button
            className={`control-btn ${isMuted ? 'active' : ''}`}
            onClick={() => {
              setIsMuted(!isMuted);
            }}
          >
            <span className='material-symbols-rounded'>{isMuted ? 'mic_off' : 'mic'}</span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default VoiceActivityControls;
