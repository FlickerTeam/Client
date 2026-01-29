import './mainContent.css';

import { type JSX, useCallback, useEffect, useRef, useState } from 'react';

import type { Channel } from '@/types/channel';
import type { Guild } from '@/types/guilds';
import { type Message, MessageListSchema } from '@/types/messages';

import { useAssetsUrl } from '../../context/assetsUrl';
import { useGateway } from '../../context/gatewayContext';
import { useModal } from '../../context/modalContext';
import { getDefaultAvatar } from '../../utils/avatar';
import MemberList from './memberList';

interface MediaAttachment {
  file: File;
  preview: string;
  id: string;
}

interface MainContentProps {
  selectedChannel: Channel;
  selectedGuild: Guild;
}

const MainContent = ({ selectedChannel, selectedGuild }: MainContentProps): JSX.Element => {
  useModal();
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { typingUsers, user, memberLists } = useGateway();
  const [messages, setMessages] = useState<Message[]>([]);
  const [chatMessage, setChatMessage] = useState('');
  const lastTypingSent = useRef<number>(0);
  const isloadingMore = useRef(false);
  const isFirstLoad = useRef(true);

  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);
    const newAttachments: MediaAttachment[] = files.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
      id: Math.random().toString(36).substring(7),
    }));

    setAttachments((prev) => [...prev, ...newAttachments]);

    e.target.value = '';
  };

  const removeAttachment = (id: string) => {
    setAttachments((prev) => {
      const filtered = prev.filter((a) => a.id !== id);
      const removed = prev.find((a) => a.id === id);

      if (removed) {
        URL.revokeObjectURL(removed.preview);
      }

      return filtered;
    });
  };

  const scrollToBottom = () => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTop = scrollerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = useCallback(
    async (limit: number, before?: string) => {
      const baseUrl = localStorage.getItem('selectedInstanceUrl') ?? '';
      const version = localStorage.getItem('defaultApiVersion') ?? '';
      const url = `${baseUrl}/${version}/channels/${selectedChannel.id}/messages?limit=${String(limit)}${before ? `&before=${before}` : ''}`;

      const response = await fetch(url, {
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
      });

      if (!response.ok) return [];

      const data: unknown = await response.json();
      return MessageListSchema.parse(data);
    },
    [selectedChannel.id],
  );

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!chatMessage.trim() && attachments.length === 0) return;

    const baseUrl = localStorage.getItem('selectedInstanceUrl') ?? '';
    const url = `${baseUrl}/${localStorage.getItem('defaultApiVersion') ?? ''}/channels/${selectedChannel.id}/messages`;

    const formData = new FormData();

    const payload = {
      content: chatMessage,
      nonce: Math.floor(Math.random() * 1000000000).toString(),
      tts: false,
      embeds: [],
    };

    formData.append('payload_json', JSON.stringify(payload));

    attachments.forEach((at, index) => {
      formData.append(`files[${index.toString()}]`, at.file);
    });

    setChatMessage('');

    const toCleanup = [...attachments];

    setAttachments([]);

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          Authorization: localStorage.getItem('Authorization') ?? '',
        },
        body: formData,
      });

      toCleanup.forEach((at) => {
        URL.revokeObjectURL(at.preview);
      });

      if (!response.ok) {
        console.error('Failed to send message');
      }
    } catch (error) {
      console.error('Error sending message:', error);
    }

    lastTypingSent.current = 0;
  };

  const handleScroll = async () => {
    const scroller = scrollerRef.current;

    if (!scroller || messages.length === 0 || isloadingMore.current) return;

    if (scroller.scrollTop === 0) {
      isloadingMore.current = true;

      const oldestMsgId = messages[0]?.id;
      const prevHeight = scroller.scrollHeight;

      const olderMessages = await fetchMessages(50, oldestMsgId);

      if (olderMessages.length > 0) {
        const reversedOlder = olderMessages.reverse();

        setMessages((prev) => [...reversedOlder, ...prev]);

        requestAnimationFrame(() => {
          if (scrollerRef.current) {
            const newHeight = scrollerRef.current.scrollHeight;
            const heightDifference = newHeight - prevHeight;

            scrollerRef.current.scrollTop = heightDifference;

            setTimeout(() => {
              isloadingMore.current = false;
            }, 150);
          }
        });
      } else {
        isloadingMore.current = false;
      }
    }
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();

    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);

    yesterday.setDate(yesterday.getDate() - 1);

    const msgDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    if (msgDate.getTime() === today.getTime()) {
      return `Today at ${timeStr}`;
    } else if (msgDate.getTime() === yesterday.getTime()) {
      return `Yesterday at ${timeStr}`;
    } else {
      return `${date.toLocaleDateString()} ${timeStr}`;
    }
  };

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      scrollToBottom();
      isFirstLoad.current = false;
    }
  }, [messages]);

  useEffect(() => {
    if (!selectedChannel.id) {
      setMessages([]);
      return;
    }

    isFirstLoad.current = true;

    setMessages([]);

    void fetchMessages(50).then((data) => {
      if (data.length > 0) {
        setMessages([...data].reverse());
      }
    });
  }, [selectedChannel.id, fetchMessages]);

  useEffect(() => {
    const handleNewMessage = (event: CustomEvent<Message>) => {
      const newMessage = event.detail;

      if (newMessage.channel_id === selectedChannel.id) {
        setMessages((prev) => {
          if (prev.find((m) => m.id === newMessage.id)) return prev;

          return [...prev, newMessage];
        });

        scrollToBottom();
      }
    };

    window.addEventListener('gateway_message', handleNewMessage);

    return () => {
      window.removeEventListener('gateway_message', handleNewMessage);
    };
  }, [selectedChannel.id]);

  const renderMessages = () => {
    if (messages.length === 0) {
      return (
        <div className='no-messages'>
          <h1>There are no messages here yet!</h1>
          <p>This is the start of something exciting!</p>
        </div>
      );
    }

    const AuthorAvatar = ({ msg }: { msg: Message }) => {
      const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
        `/assets/${getDefaultAvatar(msg.author) ?? ''}.png`,
      );
      const avatarUrl = msg.author.avatar
        ? `${localStorage.getItem('selectedCdnUrl') ?? ''}/avatars/${msg.author.id ?? ''}/${msg.author.avatar}.png`
        : defaultAvatarUrl;

      return (
        <img
          src={avatarUrl}
          className='avatar-img'
          alt=''
          onError={() => {
            rollover();
          }}
        />
      );
    };

    return messages.map((msg: Message, index: number) => {
      const prevMsg = messages[index - 1];
      const isNewGroup =
        prevMsg?.author.id !== msg.author.id ||
        new Date(msg.timestamp).getTime() - new Date(prevMsg?.timestamp ?? '').getTime() > 420000;

      const msgContent = (
        <>
          <div className='message-content'>
            {msg.content}
            {msg.attachments.length > 0 && (
              <div className='message-attachments'>
                {msg.attachments.map((attachment: NonNullable<Message['attachments']>[number]) => {
                  const isVideo = /\.(mp4|webm|mov)$/i.exec(attachment.filename);

                  return (
                    <div key={attachment.id} className='attachment-item'>
                      {isVideo ? (
                        <video
                          src={attachment.url}
                          controls
                          className='chat-video'
                          style={{ maxWidth: attachment.width ?? '100%' }}
                        >
                          <track kind='captions' />
                        </video>
                      ) : (
                        <a href={attachment.url} target='_blank' rel='noreferrer'>
                          <img
                            src={attachment.url}
                            alt={attachment.filename}
                            className='chat-image'
                            style={{
                              width: attachment.width ?? 'auto',
                              height: 'auto',
                              maxHeight: 400,
                            }}
                          />
                        </a>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </>
      );

      if (isNewGroup) {
        return (
          <div key={msg.id} className='message-group'>
            <AuthorAvatar msg={msg} />
            <div className='message-details'>
              <div className='message-header'>
                <span className='author-name'>{msg.author.username}</span>
                <span className='timestamp'>{formatTimestamp(msg.timestamp)}</span>
              </div>
              {msgContent}
            </div>
          </div>
        );
      }

      return (
        <div key={msg.id} className='message-sub'>
          {msgContent}
        </div>
      );
    });
  };

  const updateChat = (message: string) => {
    setChatMessage(message);

    const now = Date.now();

    if (now - lastTypingSent.current > 3000 && message.length > 0) {
      lastTypingSent.current = now;
      void sendTypingStart();
    }
  };

  const sendTypingStart = async () => {
    const baseUrl = localStorage.getItem('selectedInstanceUrl') ?? '';
    const url = `${baseUrl}/${localStorage.getItem('defaultApiVersion') ?? ''}/channels/${selectedChannel.id}/typing`;

    try {
      await fetch(url, {
        method: 'POST',
        headers: { Authorization: localStorage.getItem('Authorization') ?? '' },
      });
    } catch (e) {
      console.error('Failed to send typing status', e);
    }
  };

  const handleTypingStatus = () => {
    if (!selectedChannel.id) return null;

    const channelTypingMap = typingUsers[selectedChannel.id] ?? {};
    const typingIds = Object.keys(channelTypingMap).filter((id) => id !== user?.id);

    if (typingIds.length === 0) return null;

    const names = typingIds.map((id) => {
      const guildId = selectedChannel.guild_id;
      const listData = memberLists?.[guildId ?? ''];
      const items = listData?.ops.find((op) => op.op === 'SYNC')?.items ?? [];
      const memberEntry = items.find((item) => item.member?.user.id === id);

      return memberEntry?.member?.user.username ?? 'Someone';
    });

    const reactKeyThing = names.join('-');

    if (names.length === 1) {
      return (
        <p key={reactKeyThing}>
          <strong>{names[0]}</strong> is typing...
        </p>
      );
    } else if (names.length === 2) {
      return (
        <p key={reactKeyThing}>
          <strong>{names[0]}</strong> and <strong>{names[1]}</strong> are typing...
        </p>
      );
    } else if (names.length === 3) {
      return (
        <p key={reactKeyThing}>
          <strong>{names[0]}</strong>, <strong>{names[1]}</strong> and <strong>{names[2]}</strong>{' '}
          are typing...
        </p>
      );
    } else {
      return <p key={`several-people`}>MFmgph.. so many people.. aresh typing...</p>;
    }
  };

  return (
    <main className='chat-main'>
      <header className='chat-header'>
        <div className='chat-header-left'>
          <div className='header-icon'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              tag
            </span>
          </div>
          <span className='header-title'>{selectedChannel.name}</span>
          {selectedChannel.topic && (
            <span className='header-topic'> | {selectedChannel.topic}</span>
          )}
        </div>
        <div className='chat-header-right'>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              forum
            </span>
          </button>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              notifications
            </span>
          </button>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              push_pin
            </span>
          </button>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              group
            </span>
          </button>
          <div className='search-bar'>
            <input type='text' placeholder='Search' />
            <span className='material-symbols-rounded search-icon'>search</span>
          </div>
          <div className='vertical-divider'></div>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              inbox
            </span>
          </button>
        </div>
      </header>

      <div className='chat-content-row'>
        <div className='chat-view'>
          <div
            className='messages-scroller scroller'
            ref={scrollerRef}
            onScroll={() => {
              void handleScroll();
            }}
          >
            {renderMessages()}
          </div>
          <form
            className='chat-input-area'
            onSubmit={(e) => {
              void handleSendMessage(e);
            }}
          >
            <div className='input-wrapper'>
              {attachments.length > 0 && (
                <div className='attachment-shelf'>
                  {attachments.map((at) => (
                    <div key={at.id} className='attachment-container'>
                      <img
                        src={at.preview}
                        className='attachment-preview'
                        alt='Attachment preview'
                      />
                      <button
                        type='button'
                        className='attachment-remove'
                        onClick={() => {
                          removeAttachment(at.id);
                        }}
                      >
                        X
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className='input-row'>
                <button
                  type='button'
                  className='add-media-btn'
                  onClick={() => fileInputRef.current?.click()}
                >
                  <div className='add-icon-circle'>
                    <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                      add_circle
                    </span>
                  </div>
                </button>
                <input
                  type='text'
                  placeholder={`Message #${selectedChannel.name ?? ''}`}
                  value={chatMessage}
                  onChange={(e) => {
                    updateChat(e.target.value);
                  }}
                />
                <div className='input-icons'>
                  <button type='button' className='input-icon-btn'>
                    <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                      gif_box
                    </span>
                  </button>
                  <button type='button' className='input-icon-btn'>
                    <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                      sticky_note_2
                    </span>
                  </button>
                  <button type='button' className='input-icon-btn'>
                    <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                      mood
                    </span>
                  </button>
                  <button type='button' className='input-icon-btn'>
                    <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                      interests
                    </span>
                  </button>
                </div>

                <input
                  type='file'
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  multiple
                />
              </div>
            </div>
          </form>
          <div className='typing-status-wrapper'>{handleTypingStatus()}</div>
        </div>

        <MemberList
          key={selectedChannel.id}
          selectedGuild={selectedGuild}
          selectedChannel={selectedChannel}
        />
      </div>
    </main>
  );
};

export default MainContent;
