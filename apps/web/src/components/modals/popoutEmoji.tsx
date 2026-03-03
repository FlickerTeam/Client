import './popoutEmoji.css';

import parse from 'html-react-parser';
import { type JSX } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Emoji } from 'shared';
import { webAssets } from 'shared';

import { usePopup } from '@/layering/popupContext';
import { parseTwemojiWithOverrides } from '@/utils/emoji';

interface PopoutEmojiProps {
  emoji: Emoji;
  guildId: string;
  guildName: string;
  guildIcon?: string;
  isPrivate: boolean;
  isBuiltin?: boolean;
  unicode?: string;
  sourceSubtext?: string;
}

export const PopoutEmoji = ({
  emoji,
  guildId,
  guildName,
  guildIcon,
  isPrivate,
  isBuiltin = false,
  unicode,
  sourceSubtext,
}: PopoutEmojiProps): JSX.Element => {
  const navigate = useNavigate();
  const { closePopup } = usePopup();
  const cdnUrl = localStorage.getItem('selectedCdnUrl') ?? '';
  const emojiUrl = `${cdnUrl}/emojis/${emoji.id}.${emoji.animated ? 'gif' : 'png'}`;
  const emojiGuildIconUrl = `${cdnUrl}/icons/${guildId}/${guildIcon ?? ''}.png`;
  const originIconUrl = isBuiltin ? webAssets.flickerLogo : emojiGuildIconUrl;

  return (
    <div className='profile-popout-container emoji-details-popout'>
      <div className='popout-banner' style={{ backgroundColor: 'var(--accent-primary)' }} />
      <div className='profile-popout-content'>
        <div className='popout-header'>
          <div className='avatar-wrapper-centered overlap'>
            {isBuiltin && unicode ? (
              <span
                className='avatar-img-large built-in-emoji-preview'
                style={{
                  background: 'var(--bg-panel)',
                  pointerEvents: 'none',
                }}
              >
                {parse(
                  parseTwemojiWithOverrides(unicode, {
                    className: 'avatar-img-large',
                  }),
                )}
              </span>
            ) : (
              <img
                src={emojiUrl}
                alt={emoji.name}
                className='avatar-img-large'
                style={{
                  objectFit: 'contain',
                  padding: '8px',
                  background: 'var(--bg-panel)',
                  pointerEvents: 'none',
                }}
              />
            )}
          </div>
          <div className='user-details-centered'>
            <span className='username'>:{emoji.name}:</span>
          </div>
        </div>
        <hr className='popout-separator' />
        <div className='popout-section'>
          <span className='section-title'>THIS EMOJI IS FROM</span>
          <div className='about-me-container emoji-origin-card'>
            <div className='guild-info-row'>
              <div className='guild-details'>
                <div
                  className={`guild-icon-name ${isBuiltin ? 'non-interactive' : ''}`}
                  onClick={(e) => {
                    if (isBuiltin) {
                      return;
                    }
                    e.stopPropagation();
                    closePopup();
                    void navigate(`/channels/${guildId}`);
                  }}
                >
                  {isBuiltin || guildIcon ? (
                    <img
                      src={originIconUrl}
                      alt={`${guildName}'s Icon`}
                      className='avatar-img-large popout-emoji-guild-icon'
                      style={{ objectFit: 'contain', pointerEvents: 'none' }}
                    />
                  ) : (
                    <div className='guild-icon no-icon'>{guildName.substring(0, 1)}</div>
                  )}
                  <h4 className='guild-name-text'>{guildName}</h4>
                </div>
                {isBuiltin && sourceSubtext ? (
                  <span className='emoji-origin-subtext'>{sourceSubtext}</span>
                ) : isPrivate ? (
                  <span className='emoji-origin-subtext'>This guild is private</span>
                ) : null}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
