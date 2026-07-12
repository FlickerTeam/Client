import renderDfm from './dfm/dfmRenderer';
import './messageEmbed.css';
import { type JSX } from 'react';
import { type EmbedData } from '@/types/messages';

interface MessageEmbedProps {
  embed: EmbedData;
  guildId?: string;
}

export const MessageEmbed = ({ embed, guildId }: MessageEmbedProps): JSX.Element => {
  const borderLeftColor = embed.color
    ? `#${embed.color.toString(16).padStart(6, '0')}`
    : 'var(--background-secondary-alt, #202225)';

  return (
    <div className='message-embed' style={{ borderLeftColor }}>
      <div className='embed-container'>
        {embed.author && (
          <div className='embed-author'>
            {embed.author.icon_url && (
              <img src={embed.author.icon_url} alt='' className='embed-author-icon' />
            )}
            {embed.author.url ? (
              <a
                href={embed.author.url}
                target='_blank'
                rel='noreferrer'
                className='embed-author-name text-link'
              >
                {embed.author.name}
              </a>
            ) : (
              <span className='embed-author-name'>{embed.author.name}</span>
            )}
          </div>
        )}
        {embed.title && (
          <div className='embed-title'>
            {embed.url ? (
              <a href={embed.url} target='_blank' rel='noreferrer' className='text-link'>
                {embed.title}
              </a>
            ) : (
              embed.title
            )}
          </div>
        )}

        {embed.description && (
          <div className='embed-description'>{renderDfm(embed.description, guildId)}</div>
        )}

        {embed.fields && embed.fields.length > 0 && (
          <div className='embed-fields-grid'>
            {embed.fields.map((field, idx) => (
              <div key={idx} className={`embed-field ${field.inline ? 'embed-field-inline' : ''}`}>
                <div className='embed-field-name'>{field.name}</div>
                <div className='embed-field-value'>{renderDfm(field.value, guildId)}</div>
              </div>
            ))}
          </div>
        )}

        {embed.image?.url && (
          <div className='embed-image-container'>
            <img
              src={embed.image.url}
              alt=''
              className='embed-image'
              loading='lazy'
              style={{
                width: embed.image.width,
              }}
            />
          </div>
        )}

        {embed.footer && (
          <div className='embed-footer'>
            {embed.footer.icon_url && (
              <img src={embed.footer.icon_url} alt='' className='embed-footer-icon' />
            )}
            <span className='embed-footer-text'>{embed.footer.text}</span>
          </div>
        )}
      </div>

      {embed.thumbnail?.url && (
        <img src={embed.thumbnail.url} alt='' className='embed-thumbnail' loading='lazy' />
      )}
    </div>
  );
};
