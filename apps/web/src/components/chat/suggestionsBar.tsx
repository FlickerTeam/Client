import parse from 'html-react-parser';
import { type Suggestion, type SuggestionsTrigger, SuggestionsType } from 'shared';

import { useConfig } from '@/context/configContext';
import { parseTwemojiWithOverrides } from '@/utils/emoji';

interface SuggestionsBarProps {
  suggestionsTrigger: SuggestionsTrigger;
  filteredSuggestions: Suggestion[] | [];
  selectedIndex: number;
  applySuggestion: (item: Suggestion) => void;
  setSelectedIndex: (index: number) => void;
}

export const SuggestionsBar = ({
  suggestionsTrigger,
  filteredSuggestions,
  selectedIndex,
  applySuggestion,
  setSelectedIndex,
}: SuggestionsBarProps) => {
  const { cdnUrl } = useConfig();

  function renderEmoji(item: Suggestion) {
    return (
      <>
        {typeof item.emoji !== 'string' ? (
          <img
            src={`${cdnUrl ?? ''}/emojis/${item.emoji?.id ?? ''}.${item.emoji?.animated ? 'gif' : 'png'}`}
            alt={item.name}
            className='suggested-item-avi'
            style={{ objectFit: 'contain' }}
          />
        ) : (
          <>
            {parse(
              parseTwemojiWithOverrides(item.emoji ?? '', {
                className: 'suggested-item-avi',
              }),
            )}
          </>
        )}
      </>
    );
  }

  return (
    <>
      <div className='input-wrapper' key={'SuggestionsBar'}>
        <div className='input-row'>
          {suggestionsTrigger != null && filteredSuggestions.length > 0 && (
            <>
              <div className='chat-suggestions-wrapper'>
                {filteredSuggestions.map((item: Suggestion, index: number) => {
                  const isUser = item.suggestionType === SuggestionsType.USER;
                  const isRole = item.suggestionType === SuggestionsType.ROLE;
                  const isEmoji = item.suggestionType === SuggestionsType.EMOJI;
                  const isCommand = item.suggestionType === SuggestionsType.COMMAND;

                  const prefix = isUser || isRole ? '@' : isEmoji ? ':' : isCommand ? '/' : '#';
                  const { name, subtext } = (() => {
                    if (isUser && item.user) {
                      return {
                        name: item.user.nick || item.user.user.username,
                        subtext:
                          item.user.user.discriminator !== '0'
                            ? `${item.user.user.username}#${item.user.user.discriminator}`
                            : item.user.user.username,
                      };
                    }

                    if (item.isSpecial) {
                      return { name: item.name, subtext: item.description };
                    }

                    if (isEmoji) {
                      if (typeof item.emoji !== 'string') {
                        return {
                          name: item.name,
                          subtext: `Emoji from ${item.sourceGuildName || 'Unknown Server'}`,
                        };
                      } else {
                        return {
                          name: item.name,
                          subtext: 'Flicker Default Emojis',
                        };
                      }
                    }

                    if (isRole) {
                      return { name: item.name, subtext: 'Role' };
                    }

                    if (isCommand) {
                      return { name: item.name, subtext: item.description };
                    }

                    const topic = item.channel?.topic || 'Channel';
                    const maxTopicLength = 50;

                    return {
                      name: item.name,
                      subtext:
                        topic.length > maxTopicLength
                          ? `${topic.substring(0, maxTopicLength)}...`
                          : topic,
                    };
                  })();

                  return (
                    <div
                      key={`suggestion-${String(index)}`}
                      className={`chat-suggestion ${index === selectedIndex ? 'active' : ''}`}
                      style={{ '--prefix': `"${prefix}"` } as React.CSSProperties}
                      onClick={() => {
                        applySuggestion(item);
                      }}
                      onMouseEnter={() => {
                        setSelectedIndex(index);
                      }}
                    >
                      {isUser && item.user?.user.avatar && !item.isSpecial ? (
                        <img
                          src={`${cdnUrl ?? ''}/avatars/${item.user.id}/${item.user.user.avatar ?? ''}.png`}
                          alt={`${item.user.user.username} avatar`}
                          className='avatar-img suggested-item-avi'
                        />
                      ) : isEmoji ? (
                        renderEmoji(item)
                      ) : (
                        <div
                          className='suggested-item-avi'
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          {!isUser && prefix}
                        </div>
                      )}
                      <div className='chat-suggestion-item'>
                        <span>{name}</span>
                        <span>{subtext}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>
    </>
  );
};
