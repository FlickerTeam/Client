import './dmChannel.css';

import { type JSX } from 'react';

interface DmChannelProps {
  icon: string | JSX.Element;
  title: string;
  selected: boolean;
  status: string;
  isTyping: boolean;
  subtitle?: string;
  onClick: () => void;
  onClose: () => void;
}

export const DmChannel = ({
  icon,
  title,
  subtitle,
  selected,
  status,
  isTyping,
  onClick,
  onClose,
}: DmChannelProps) => (
  <div className={`dm-card ${selected ? 'selected-dm' : ''}`} onClick={onClick}>
    <div className='dm-card-icon'>
      {typeof icon === 'string' ? <img src={icon} alt='' /> : icon}
      {isTyping ? (
        <div className={`fr-typing-indicator-dots ${status}`}>
          <span className='dot'></span>
          <span className='dot'></span>
          <span className='dot'></span>
        </div>
      ) : (
        <div className={`fr-status-dot ${status}`} title={status}></div>
      )}
    </div>
    <div className='dm-card-info'>
      <div className='dm-card-title'>{title}</div>
      {subtitle && <div className='dm-card-subtitle'>{subtitle}</div>}
    </div>
    <button
      type='button'
      className='exit-btn'
      aria-label={`Close DM with ${title}`}
      onClick={(e) => {
        e.stopPropagation();
        onClose();
      }}
      style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
    >
      <span className='material-symbols-rounded dm-card-arrow close-dm-btn'>close</span>
    </button>
  </div>
);
