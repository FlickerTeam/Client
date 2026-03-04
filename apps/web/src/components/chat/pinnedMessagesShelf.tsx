import './pinnedMessagesShelf.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { useEffect, useState } from 'react';
import { formatTimestamp, get, getDefaultAvatar, type Message, MessageListSchema } from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';

export const PinnedMessagesShelf = ({
  channelId,
  onClose,
  scrollToMessage,
}: {
  channelId: string;
  onClose: () => void;
  scrollToMessage: (messageId: string) => Promise<void>;
}) => {
  const [pins, setPins] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPins = async () => {
      try {
        const data = await get(`/channels/${channelId}/pins`);

        setPins(MessageListSchema.parse(data));
      } catch (err) {
        console.error('Failed to fetch pins', err);
      } finally {
        setLoading(false);
      }
    };
    void fetchPins();
  }, [channelId]);

  return (
    <div className='pins-shelf'>
      <div className='pins-header'>
        <h3>Pinned Messages</h3>
        <button onClick={onClose} className='icon-btn'>
          <span className='material-symbols-rounded'>close</span>
        </button>
      </div>
      <OverlayScrollbarsComponent
        element='div'
        options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
        className='pins-content scroller'
      >
        {loading ? (
          <p className='status-text'>Loading pins...</p>
        ) : pins.length === 0 ? (
          <p className='status-text'>No pins yet!</p>
        ) : (
          pins.map((pin) => <PinItem key={pin.id} pin={pin} scrollToMessage={scrollToMessage} />)
        )}
      </OverlayScrollbarsComponent>
    </div>
  );
};

const PinItem = ({
  pin,
  scrollToMessage,
}: {
  pin: Message;
  scrollToMessage: (messageId: string) => Promise<void>;
}) => {
  const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
    `/assets/${getDefaultAvatar(pin.author)}.png`,
  );
  const { cdnUrl } = useConfig();

  const avatarUrl = pin.author.avatar
    ? `${cdnUrl ?? ''}/avatars/${pin.author.id ?? ''}/${pin.author.avatar}.png`
    : defaultAvatarUrl;

  return (
    <div className='pin-item'>
      <img
        src={avatarUrl}
        className='pin-avatar'
        alt=''
        onError={() => {
          rollover();
        }}
      />
      <div className='pin-details'>
        <div className='pin-meta'>
          <div className='pin-who-and-date'>
            <strong className='pin-author'>{pin.author.global_name || pin.author.username}</strong>
            <span className='pin-timestamp'>{formatTimestamp(pin.timestamp)}</span>
          </div>
          <button
            className='pin-jump-button'
            onClick={(e) => {
              e.stopPropagation();
              void scrollToMessage(pin.id);
            }}
          >
            Jump
          </button>
        </div>
        <p className='pin-text'>{pin.content}</p>
      </div>
    </div>
  );
};
