import React, { type JSX } from 'react';
import { type Message, MessageType } from '@/types/messages';
import { formatTimestamp } from '@/utils/dateUtils';
import renderDfm from './dfm/dfmRenderer';
import './systemMessage.css';
import type { User } from '@/types/users';
import { MemberMention } from './dfm/dfmComponents';

export const SystemMessage = ({
  msg,
  guildId,
}: {
  msg: Message;
  guildId?: string;
}): JSX.Element => {
  let iconClass = 'material-symbols-rounded system-msg-icon';
  let iconName = 'info';
  let content: React.ReactNode = null;

  switch (msg.type) {
    case MessageType.GUILD_MEMBER_JOIN:
      iconName = 'person_add';
      iconClass += ' join-icon';
      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> joined the server.</span>
        </span>
      );
      break;
    case MessageType.PIN:
      iconName = 'keep';
      iconClass += ' pin-icon';
      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> pinned a message to this channel. </span>
        </span>
      );
      break;
    case MessageType.CALL:
      iconName = 'call';
      iconClass += ' call-icon';
      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> started a call.</span>
        </span>
      );
      break;
    case MessageType.ADD_TO_GROUP:
      iconName = 'person_add';
      iconClass += ' join-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span>
            {' '}
            added{' '}
            {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
              <span
                style={{
                  color: 'var(--text-dim)',
                  fontWeight: 'bold',
                }}
              >
                Deleted User
              </span>
            ) : (
              <MemberMention
                guild_id={guildId}
                user_id={msg.mentions[0]?.id ?? ''}
                fallback_user_object={msg.mentions[0] as User}
              ></MemberMention>
            )}{' '}
            to the group.
          </span>
        </span>
      );
      break;
    case MessageType.REMOVE_FROM_GROUP:
      iconName = 'person_remove';
      iconClass += ' leave-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> left the group.</span>
        </span>
      );
      break;
    case MessageType.GUILD_SUBSCRIPTION:
      iconName = 'rocket_launch';
      iconClass += ' boost-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> boosted the server.</span>
        </span>
      );
      break;
    case MessageType.CHANNEL_ICON_CHANGE:
      iconName = 'image';
      iconClass += ' channel-icon-change-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span> changed the channel icon.</span>
        </span>
      );
      break;
    case MessageType.CHANNEL_NAME_CHANGE:
      iconName = 'edit';
      iconClass += ' channel-edit-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span>
            {' '}
            changed the channel name to: <strong>{msg.content}</strong>
          </span>
        </span>
      );
      break;
    case MessageType.GUILD_SUBSCRIPTION_TIER_1:
      iconName = 'workspace_premium';
      iconClass += ' boost-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span>
            {' '}
            boosted the server. <strong>Tier 1 unlocked!</strong>
          </span>
        </span>
      );
      break;
    case MessageType.GUILD_SUBSCRIPTION_TIER_2:
      iconName = 'diamond';
      iconClass += ' boost-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span>
            {' '}
            boosted the server. <strong>Tier 2 unlocked!</strong>
          </span>
        </span>
      );
      break;
    case MessageType.GUILD_SUBSCRIPTION_TIER_3:
      iconName = 'stars';
      iconClass += ' boost-icon';

      content = (
        <span>
          {msg.author.discriminator === '0000' && msg.author.username === 'Deleted User' ? (
            <span
              style={{
                color: 'var(--text-dim)',
                fontWeight: 'bold',
              }}
            >
              Deleted User
            </span>
          ) : (
            <MemberMention
              guild_id={guildId}
              user_id={msg.author.id ?? ''}
              fallback_user_object={msg.author as User}
            ></MemberMention>
          )}
          <span>
            {' '}
            boosted the server. <strong>Tier 3 has been reached!</strong>
          </span>
        </span>
      );
      break;
    default:
      content = renderDfm(msg.content, guildId);
      break;
  }

  return (
    <div className='system-message-row' data-message-id={msg.id}>
      <span className={iconClass}>{iconName}</span>
      <div className='system-message-content'>
        {content}
        <span className='timestamp'>{formatTimestamp(msg.timestamp)}</span>
      </div>
    </div>
  );
};
