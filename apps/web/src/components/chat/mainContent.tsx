import './mainContent.css';

import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type {
  Channel,
  Command,
  EmojiChooserEmoji,
  GifCategory,
  GifResult,
  GifTrendingResponse,
  MessageCreate,
  MessageDelete,
  MessageUpdate,
  RawGifResponse,
  User,
} from 'shared';
import {
  EmojiSchema,
  formatTimestamp,
  type Guild,
  get,
  getDefaultAvatar,
  localBlobCache,
  logger,
  type Member,
  type Message,
  MessageListSchema,
  MessageSchema,
  patch,
  post,
  request,
  type Suggestion,
  type SuggestionsTrigger,
  SuggestionsType,
  useUserStore,
} from 'shared';

import { useAssetsUrl } from '@/context/assetsUrl';
import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { EMOJI_SHORTCODE_MAP } from '@/generated/emojiMap';
import { usePermissions } from '@/hooks/usePermissions';
import { useMenuOverlay } from '@/layering/menuOverlayStore';
import { useModal } from '@/layering/modalContext';
import { usePopup } from '@/layering/popupContext';
import { useUiUtilityActions } from '@/utils/uiUtils';

import { ChatAttachment } from './chatAttachment';
import ChatInput from './chatInput';
import renderDfm from './dfm/dfmRenderer';
import MemberList from './memberList';
import { MessageEditInput } from './messageeditinput';
import { PinnedMessagesShelf } from './pinnedMessagesShelf';
import { ReplyPreview } from './replyPreview';
import { SuggestionsBar } from './suggestionsBar';
import { UploadProgressCircle } from './uploadProgressCircle';

interface MemberListItem {
  member?: Member | null;
  group?: { id: string; count: number } | null;
}

interface MediaAttachment {
  file: File;
  preview: string;
  id: string;
}

interface MainContentProps {
  selectedChannel: Channel;
  selectedGuild: Guild | null;
  viewMode?: 'guild_channel' | 'dm_channel';
  unreads?: Map<string, Set<string>>;
  mentions?: Map<string, Map<string, number>>;
  onChannelSeen?: (guild_id: string | null, channel_id: string, lastMsgId: string) => Promise<void>;
}

const MESSAGE_STATE = Object.freeze({
  PENDING: 0,
  SENT: 1,
  FAILED: -1,

  0: 'Pending',
  1: 'Sent',
  '-1': 'Failed',
}); //Should I put this somewhere else?

type LocalMessage = Message & { state: number };

const MainContent = ({
  selectedChannel,
  selectedGuild,
  viewMode,
  unreads,
  mentions,
  onChannelSeen,
}: MainContentProps): JSX.Element => {
  const isGuildView = viewMode === 'guild_channel' || (viewMode == null && selectedGuild != null);
  const isDmView = viewMode === 'dm_channel' || (viewMode == null && selectedGuild == null);
  const contextPerms = usePermissions(selectedGuild?.id, selectedChannel.id);
  const { openUserProfile, openFullProfile } = useUiUtilityActions(selectedGuild);
  const { openContextMenu } = useMenuOverlay();
  const { openModal } = useModal();
  const { popupType, openPopup, updatePopup, closePopup } = usePopup();

  const [suggestionsTrigger, setSuggestionTrigger] = useState<SuggestionsTrigger | null>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [editingMsgID, setEditingMsgID] = useState<string | null>(null);
  const [replyingMsgID, setReplyingMgID] = useState<string | null>(null);
  const [uploadProgress, setUploadProgress] = useState<
    Record<string, { loaded: number; total: number }>
  >({});
  const [filteredSuggestions, setFilteredSuggestions] = useState<Suggestion[] | []>([]);
  const [gifs, setGifs] = useState<GifResult[] | []>([]);
  const [gifCategories, setGifCategories] = useState<GifCategory[] | []>([]);
  const [gifSearchQuery, setGifSearchQuery] = useState('');
  const [isScrolledUp, setIsScrolledUp] = useState(false);
  const [stickernatorActive, setStickernatorActive] = useState(false);
  const [channelPinsVisible, setChannelPinsVisible] = useState(false);
  const [memberListVisible, setMemberListVisible] = useState(true);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const { typingUsers, user, getMember, getMemberColor, getPresence, memberLists, guilds } =
    useGateway();
  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const messageMap = useMemo(() => {
    return new Map(messages.map((m) => [m.id, m]));
  }, [messages]);
  const [chatMessage, setChatMessage] = useState('');
  const lastTypingSent = useRef<number>(0);
  const isloadingMore = useRef(false);
  const [firstLoad, setFirstLoad] = useState(true);
  const autoScroll = useRef(true);
  const [attachments, setAttachments] = useState<MediaAttachment[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const commands: Command[] = [
    {
      name: 'shrug',
      description: 'Appends ¯\\_(ツ)_/¯ to your message.',
      onUse: (parameters: string[]) => {
        const text = parameters.join(' ');
        const shrug = '¯\\_(ツ)_/¯';
        return text ? `${text} ${shrug}` : shrug; //¯\\\_(ツ)_/¯
      },
    },
  ]; //should this go somewhere else?

  useEffect(() => {
    const channelId = selectedChannel.id;
    const lastMsgId = selectedChannel.last_message_id ?? null;
    const key = selectedGuild?.id ?? 'direct_messages';
    const isUnread = unreads?.get(key)?.has(channelId);
    const hasMentions = mentions?.get(key)?.has(channelId);

    if ((isUnread || hasMentions) && onChannelSeen && lastMsgId) {
      void onChannelSeen(selectedGuild?.id || null, channelId, lastMsgId);
    }
  }, [
    selectedChannel.id,
    selectedChannel.last_message_id,
    selectedGuild?.id,
    onChannelSeen,
    mentions,
    unreads,
  ]);

  const addFiles = useCallback((files: File[]) => {
    const newAttachments: MediaAttachment[] = files.map((file) => {
      const preview = URL.createObjectURL(file);

      localBlobCache.set(`${file.name}-${file.size.toString()}`, preview);

      return {
        file,
        preview,
        id: crypto.randomUUID(),
      };
    });

    setAttachments((prev) => [...prev, ...newAttachments]);
  }, []);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    if (e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);

      addFiles(files);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;

    const files = Array.from(e.target.files);

    addFiles(files);
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

  const scrollToBottom = useCallback((behavior: ScrollBehavior = 'smooth') => {
    if (scrollerRef.current) {
      scrollerRef.current.scrollTo({
        top: scrollerRef.current.scrollHeight,
        behavior,
      });

      setIsScrolledUp(false);
    }
  }, []);

  const clearReplyingMsg = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();

    const element = scrollerRef.current?.querySelector(`[data-message-id="${msg.id}"]`);

    if (element) {
      element.classList.remove('message-highlight-no-anim');
      element.classList.remove('move-msg-up');
    }

    setReplyingMgID(null);
  };

  const handleReplyToMessage = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();

    const element = scrollerRef.current?.querySelector(`[data-message-id="${msg.id}"]`);
    const isLastMessage = messages[messages.length - 1]?.id === msg.id;

    if (element) {
      element.classList.add('message-highlight-no-anim');

      if (isLastMessage) {
        element.classList.add('move-msg-up');

        /*
        setTimeout(() => {
          element.scrollIntoView({
            behavior: 'smooth',
            block: 'start',
          });
        }, 50); */ //figure out a reliable way to scroll
      }
    }

    setReplyingMgID(msg.id);
  };

  const handleShowMsgContextMenu = (e: React.MouseEvent, msg: Message) => {
    e.preventDefault();
    e.stopPropagation();

    const OFFSET = 4;
    const x = e.clientX + OFFSET;
    const y = e.clientY + OFFSET;

    openContextMenu(
      x,
      y,
      <div className='context-menu-out msg-context-menu'>
        {msg.author.id === user?.id && (
          <div
            className='button'
            onClick={() => {
              setEditingMsgID(msg.id);
            }}
          >
            Edit
          </div>
        )}
        <div
          className='button'
          onClick={() => {
            void navigator.clipboard.writeText(msg.id);
          }}
        >
          Copy ID
        </div>
        <div
          className='button'
          onClick={() => {
            openModal('CONFIRMATION_DELETE', { id: msg.id, type: 'message' });
          }}
        >
          Delete
        </div>
      </div>,
    );
  };

  useEffect(() => {
    if (autoScroll.current) scrollToBottom();
  }, [scrollToBottom]);

  useEffect(() => {
    setSelectedIndex(0);
  }, []);

  useEffect(() => {
    if (popupType === 'GIF_PICKER') {
      updatePopup<'GIF_PICKER'>({ gifs, gifCategories });
    }
  }, [gifs, gifCategories, popupType, updatePopup]);

  useEffect(() => {
    if (popupType === 'GIF_PICKER' && gifSearchQuery === '') {
      const fetchTrending = async () => {
        try {
          const data = await get<GifTrendingResponse>('/gifs/trending?locale=en');

          setGifCategories(data.categories);
        } catch (err) {
          logger.error(`MAIN_CONTENT`, `Failed to metch trending gifs`, err);
        }
      };

      void fetchTrending();
    }
  }, [popupType, gifSearchQuery]);

  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      if (e.clipboardData && e.clipboardData.files.length > 0) {
        const files = Array.from(e.clipboardData.files);

        addFiles(files);
        e.preventDefault();
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => {
      window.removeEventListener('paste', handlePaste);
    };
  }, [addFiles]);

  const fetchMessages = useCallback(
    async (limit: number, before?: string) => {
      const url = `/channels/${selectedChannel.id}/messages?limit=${String(
        limit,
      )}${before ? `&before=${before}` : ''}`;

      try {
        const response = await get(url);

        return MessageListSchema.parse(response);
      } catch (error) {
        console.error('Failed to fetch messages: ', error);
        return [];
      }
    },
    [selectedChannel.id],
  );

  const resolveMentions = (text: string): string => {
    const emoticons = [
      '¯\\\\\\_(ツ)_/¯',
      '(∩ ͡° ͜ʖ ͡°)⊃━☆ﾟ. o ･ ｡ﾟ',
      '(∩ ͡° ͜ʖ ͡°)⊃━✿✿✿✿✿✿',
      '༼ つ ◕_◕ ༽つ',
      '(◕‿◕✿)',
      '(⁄ ⁄•⁄ω⁄•⁄ ⁄)',
      '(╯°□°）╯︵ ┻━┻',
      'ಠ_ಠ',
      '¯\\\\\\(°_o)/¯',
      '（✿ ͡◕ ᴗ◕)つ━━✫・o。',
      'ヽ༼ ಠ益ಠ ༽ﾉ',
    ];

    const channelMap = new Map(
      selectedGuild?.channels.map((c) => [c.name?.toLowerCase(), c.id]) ?? [],
    );
    const roleMap = new Map(selectedGuild?.roles.map((r) => [r.name.toLowerCase(), r.id]) ?? []);

    const emojiMap = new Map(
      guilds.flatMap((g) => g.emojis || []).map((e) => [e.name.toLowerCase(), e]),
    );

    const memberMap = new Map<string, string>();

    if (selectedGuild) {
      const memberState = memberLists?.[selectedGuild.id];
      const listItems: MemberListItem[] = Array.isArray(memberState)
        ? memberState
        : memberState?.items || [];

      listItems.forEach((item) => {
        if ('member' in item && item.member) {
          const m = item.member;

          if (m.nick) {
            memberMap.set(m.nick.toLowerCase(), m.user.id);
          }

          if (m.user.global_name) {
            memberMap.set(m.user.global_name.toLowerCase(), m.user.id);
          }

          memberMap.set(m.user.username.toLowerCase(), m.user.id);
        }
      });
    } else if (selectedChannel.recipients) {
      selectedChannel.recipients.forEach((user) => {
        if (user.id && user.username) {
          memberMap.set(user.global_name ?? user.username.toLowerCase(), user.id);
        } //probs the worst practice but shut up linter and we do need these values there
      });
    }

    if (text.includes('@someone')) {
      const memberNames: string[] = Array.from(memberMap.keys());

      if (memberNames.length > 0) {
        const randomMember = memberNames[Math.floor(Math.random() * memberNames.length)];
        const randomEmote = emoticons[Math.floor(Math.random() * emoticons.length)];

        if (randomMember && randomEmote) {
          const replacement = `**@someone** ${randomEmote} ***(${randomMember})***`;
          text = text.replace(/@someone/g, replacement);
        }
      }
    }

    return text.replace(
      /(<a?:\w+:\d+>|<@&?\d+>|<#\d+>)|([@#:])([\w-]+(?:#\d{4})?)(:?)/g,
      (match: string, alreadyFormatted: string, symbol: string, name: string): string => {
        if (alreadyFormatted) return match;

        let lowName = name.toLowerCase();

        if (match === '@someone') return match;

        if (symbol === '@') {
          if (lowName.includes('#')) {
            lowName = lowName.split('#')[0] ?? lowName;
          }

          const userId = memberMap.get(lowName);
          if (userId) return `<@${userId}>`;

          const roleId = roleMap.get(lowName);
          if (roleId) return `<@&${roleId}>`;
        }

        if (symbol === '#' && lowName && name) {
          const isId = /^\d+$/.test(name);
          if (isId) return `<#${name}>`;

          const chId = channelMap.get(lowName);
          if (chId) return `<#${chId}>`;
        }

        if (symbol === ':' && lowName) {
          const emoji = emojiMap.get(lowName);
          if (emoji && 'id' in emoji && 'name' in emoji) {
            const prefix = emoji.animated ? 'a:' : ':';
            const emojiName = emoji.name;
            const emojiId = emoji.id;
            return `<${prefix}${emojiName}:${emojiId}>`;
          }
        }

        return match;
      },
    );
  };

  const handleSendMessage = async (e?: React.SyntheticEvent) => {
    e?.preventDefault();

    let finalContent = chatMessage;

    if (!finalContent.trim() && attachments.length === 0) return;

    if (finalContent.startsWith('/')) {
      const args = chatMessage.slice(1).split(' ');
      const commandName = args.shift()?.toLowerCase();
      const command = commands.find((c) => c.name === commandName);

      if (command) {
        const transformed = command.onUse(args);
        if (transformed) {
          finalContent = transformed;
          setChatMessage('');
        } else {
          setChatMessage('');
          return;
        }
      }
    }

    const formData = new FormData();

    const nonce = Math.floor(Math.random() * 1000000000).toString();
    const repliedMessage = messages.find((m) => m.id === replyingMsgID);

    const ghostMessage: Message = {
      id: `temp-${nonce}`,
      nonce: `flicker-${nonce}`,
      channel_id: selectedChannel.id,
      content: finalContent,
      author: user,
      timestamp: new Date().toISOString(),
      attachments: attachments.map((at) => ({
        id: at.id,
        filename: at.file.name,
        url: at.preview,
        size: at.file.size,
        proxy_url: at.preview,
      })),
      referenced_message: repliedMessage,
      message_reference: replyingMsgID
        ? {
            message_id: replyingMsgID,
            channel_id: selectedChannel.id,
            guild_id: selectedGuild?.id,
          }
        : undefined,
      embeds: [],
      mentions: [],
      pinned: false,
      tts: false,
      type: 0,
      state: MESSAGE_STATE.PENDING, //0 = sending (1 = sent, -1 = failed)
    } as LocalMessage;

    const payload = {
      content: resolveMentions(finalContent),
      nonce: `flicker-${nonce}`,
      tts: false,
      embeds: [],
      message_reference: replyingMsgID
        ? {
            message_id: replyingMsgID,
            channel_id: selectedChannel.id,
            guild_id: selectedGuild?.id,
            fail_if_not_exists: false,
          }
        : undefined,
    };

    formData.append('payload_json', JSON.stringify(payload));

    attachments.forEach((at, index) => {
      formData.append(`files[${index.toString()}]`, at.file);
    });

    setMessages((prev) => [...prev, ghostMessage]);
    setChatMessage('');
    setReplyingMgID(null);

    if (replyingMsgID) {
      const el = scrollerRef.current?.querySelector(`[data-message-id="${replyingMsgID}"]`);
      el?.classList.remove('move-msg-up', 'message-highlight-no-anim');
    }

    setAttachments([]);

    try {
      const response = await request<Message>(`/channels/${selectedChannel.id}/messages`, 'POST', {
        body: formData,
        onProgress: (loaded, total) => {
          setUploadProgress((prev) => ({
            ...prev,
            [nonce]: { loaded, total },
          }));
        },
      });

      setUploadProgress((prev) => {
        const filteredEntries = Object.entries(prev).filter(([key]) => key !== nonce);
        return Object.fromEntries(filteredEntries);
      });

      if (onChannelSeen && response.id) {
        void onChannelSeen(selectedGuild?.id ?? null, selectedChannel.id, response.id);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      setMessages((prev) =>
        prev.map((m) =>
          m.nonce === `flicker-${nonce}` ? { ...m, state: MESSAGE_STATE.FAILED } : m,
        ),
      );
    }

    lastTypingSent.current = 0;
  };

  const handleScroll = async () => {
    const container = scrollerRef.current;
    if (!container) return;

    const distanceFromBottom =
      container.scrollHeight - container.scrollTop - container.clientHeight;

    if (distanceFromBottom > 2000) {
      setIsScrolledUp(true);
    } else {
      setIsScrolledUp(false);
    }

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
    autoScroll.current = scroller.scrollTop + scroller.clientHeight >= scroller.scrollHeight;
  };

  useEffect(() => {
    if (!selectedChannel.id) {
      setMessages([]);
      return;
    }

    isloadingMore.current = true;
    setFirstLoad(true);
    setMessages([]);

    void fetchMessages(50).then((data) => {
      if (data.length > 0) {
        setMessages([...data].reverse());
        autoScroll.current = true;
      }
      isloadingMore.current = false;
      setFirstLoad(false);
    });
  }, [selectedChannel.id, fetchMessages]);

  useEffect(() => {
    const handleNewMessage = (event: CustomEvent<MessageCreate>) => {
      const newMessage = event.detail as LocalMessage;

      if (newMessage.channel_id !== selectedChannel.id) return;

      setMessages((prev) => {
        const matchIdx = prev.findIndex(
          (m) =>
            (newMessage.nonce && String(m.nonce) === newMessage.nonce) || m.id === newMessage.id,
        );

        if (matchIdx !== -1) {
          const copy = [...prev];
          copy[matchIdx] = { ...newMessage, state: MESSAGE_STATE.SENT };
          return copy;
        }

        return [...prev, { ...newMessage, state: MESSAGE_STATE.SENT }];
      });

      scrollToBottom();
    };
    //MessageCreate, MessageUpdate and MessageDelete need types
    const handleUpdateMessage = (event: CustomEvent<MessageUpdate>) => {
      const updatedMessage = event.detail as LocalMessage;

      if (updatedMessage.channel_id !== selectedChannel.id) return;

      setMessages((prev) => {
        const exists = prev.some((m) => m.id === updatedMessage.id);

        if (exists) {
          return prev.map((old) =>
            old.id === updatedMessage.id ? { ...old, ...updatedMessage } : old,
          );
        }

        return [...prev, MessageSchema.parse(updatedMessage)];
      });
    };

    const handleDeleteMessage = (event: CustomEvent<MessageDelete>) => {
      const deletedMessage = event.detail;

      if (deletedMessage.channel_id === selectedChannel.id) {
        setMessages((prev) => prev.filter((msg) => msg.id !== deletedMessage.id));
      }
    };

    window.addEventListener('gateway_message_create', handleNewMessage);
    window.addEventListener('gateway_message_update', handleUpdateMessage);
    window.addEventListener('gateway_message_delete', handleDeleteMessage);

    return () => {
      window.removeEventListener('gateway_message_create', handleNewMessage);
      window.removeEventListener('gateway_message_update', handleUpdateMessage);
      window.removeEventListener('gateway_message_delete', handleDeleteMessage);
    };
  }, [selectedChannel.id, scrollToBottom]);

  const scrollToMessage = async (messageId: string) => {
    //Check if we already have it in the silly dom

    const element = scrollerRef.current?.querySelector(`[data-message-id="${messageId}"]`);

    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); //Everything else overflows it seems, pretty weird.

      element.classList.add('message-highlight');

      setTimeout(() => {
        element.classList.remove('message-highlight');
      }, 3000);
    } else {
      //No? OK.

      try {
        isloadingMore.current = true;

        const response = await get(
          `/channels/${selectedChannel.id}/messages?limit=50&around=${messageId}`,
        );
        const data = MessageListSchema.parse(response);

        if (data.length > 0) {
          setMessages([...data].reverse()); //api should return them from new to old so we reverse CHRONOLOGICAL Order dis bitch
          autoScroll.current = false; //make sure we dont scroll to the fucking bottom (owo)

          requestAnimationFrame(() => {
            const newElement = scrollerRef.current?.querySelector(
              `[data-message-id="${messageId}"]`,
            );

            //lets try again

            if (newElement) {
              newElement.scrollIntoView({
                behavior: 'smooth',
                block: 'nearest',
              });
              newElement.classList.add('message-highlight');

              setTimeout(() => {
                newElement.classList.remove('message-highlight');
                isloadingMore.current = false;
              }, 3000);
            }
          });
        }
      } catch (error) {
        logger.error(`MAIN_CONTENT`, 'Failed to jump to message', error);

        isloadingMore.current = false;
      }
    }
  };

  const renderMessages = () => {
    const allMessages = messages;

    if (allMessages.length === 0) {
      if (firstLoad)
        return (
          <div className='no-messages chat-loading-skeleton' aria-live='polite'>
            <div className='skeleton-message-group'>
              <div className='skeleton-avatar' />
              <div className='skeleton-message-content'>
                <div className='skeleton-line skeleton-line-name' />
                <div className='skeleton-line skeleton-line-short' />
                <div className='skeleton-line skeleton-line-medium' />
                <div className='skeleton-line skeleton-line-long' />
                <div className='skeleton-attachment skeleton-attachment-large' />
              </div>
            </div>
            <div className='skeleton-message-group'>
              <div className='skeleton-avatar' />
              <div className='skeleton-message-content'>
                <div className='skeleton-line skeleton-line-name' />
                <div className='skeleton-line skeleton-line-medium' />
                <div className='skeleton-line skeleton-line-short' />
                <div className='skeleton-attachment skeleton-attachment-small' />
              </div>
            </div>
            <div className='skeleton-message-group'>
              <div className='skeleton-avatar' />
              <div className='skeleton-message-content'>
                <div className='skeleton-line skeleton-line-name' />
                <div className='skeleton-line skeleton-line-long' />
                <div className='skeleton-line skeleton-line-medium' />
              </div>
            </div>
          </div>
        );
      else
        return (
          <div className='no-messages'>
            <h1>There are no messages here yet!</h1>
            <p>This is the start of something exciting!</p>
          </div>
        );
    }

    const AuthorAvatar = ({ msg, member }: { msg: Message; member?: Member }) => {
      const { url: defaultAvatarUrl, rollover } = useAssetsUrl(
        `/assets/${getDefaultAvatar(msg.author)}.png`,
      );
      const { cdnUrl } = useConfig();

      const avatarUrl = msg.author.avatar
        ? `${cdnUrl ?? ''}/avatars/${msg.author.id ?? ''}/${msg.author.avatar}.png`
        : defaultAvatarUrl;

      const presence = getPresence(msg.author.id);
      const status = presence?.status ?? 'offline';

      const memberObj: Member = member ?? {
        id: msg.author.id || '',
        user: msg.author as User,
        presence: {
          user: msg.author as User,
          status: status,
          activities: presence?.activities ?? [],
        },
        joined_at: new Date().toISOString(),
        roles: [],
      };

      return (
        <img
          src={avatarUrl}
          className='avatar-img'
          alt=''
          style={{ cursor: 'pointer' }}
          onError={() => {
            rollover();
          }}
          onClick={(e) => {
            void openUserProfile(e, memberObj);
          }}
        />
      );
    };

    return allMessages.map((msg: LocalMessage, index: number) => {
      const messageKey = msg.nonce || msg.id;
      const prevMsg = allMessages[index - 1];

      const isNewGroup =
        msg.message_reference ||
        prevMsg?.author.id !== msg.author.id ||
        new Date(msg.timestamp).getTime() - new Date(prevMsg?.timestamp ?? '').getTime() > 420000;

      const referencedMessage = msg.message_reference?.message_id
        ? messageMap.get(msg.message_reference.message_id)
        : null;

      const pendingClass = msg.state == MESSAGE_STATE.PENDING ? 'message-pending' : '';
      const pendingStyle =
        msg.state == MESSAGE_STATE.PENDING ? { opacity: 0.5, filter: 'grayscale(100%)' } : {};

      const isMentioned =
        msg.mentions.some((m) => m.id === user?.id) ||
        (user?.username ? msg.content?.includes(`@${user.username}`) : false) ||
        msg.content?.includes(`<@${user?.id ?? ''}>`) ||
        msg.mention_everyone;

      const mentionClass = isMentioned ? 'message-mention' : '';

      const isEditing = editingMsgID === msg.id;
      const progressKey = msg.nonce?.replace('flicker-', '');
      const progress = progressKey ? uploadProgress[progressKey] : null;

      const handleEditSave = async (newContent: string) => {
        if (newContent.trim() !== msg.content) {
          try {
            await patch(`/channels/${msg.channel_id}/messages/${msg.id}`, {
              content: newContent,
            });
          } catch (error) {
            logger.error(`MAIN_CONTENT`, `Failed to update message`, error);
          }
        }
        setEditingMsgID(null);
      };

      const msgContent = (
        <>
          <div
            className={`message-content ${
              msg.state === MESSAGE_STATE.FAILED ? 'message-failed' : ''
            } ${msg.content?.includes('@someone') ? 'april-fools' : ''}`}
          >
            <div
              className={`msg-text-contents`}
              style={
                isEditing
                  ? {
                      width: '100%',
                    }
                  : {}
              }
            >
              {isEditing ? (
                <MessageEditInput
                  initialContent={msg.content ?? ''}
                  onSave={(newContent) => {
                    void handleEditSave(newContent);
                  }}
                  onCancel={() => {
                    setEditingMsgID(null);
                  }}
                />
              ) : (
                <>
                  {renderDfm(msg.content, selectedGuild?.id)}
                  {msg.edited_timestamp && (
                    <span className='edited-tag' title={formatTimestamp(msg.edited_timestamp)}>
                      (edited)
                    </span>
                  )}
                </>
              )}
              {!isEditing && msg.attachments.length > 0 && (
                <div className='message-attachments'>
                  {msg.attachments.map(
                    (attachment: NonNullable<Message['attachments']>[number]) => {
                      return (
                        <div key={attachment.id} className='attachment-upload-container'>
                          <ChatAttachment attachment={attachment} msg={msg} />
                          {msg.state === MESSAGE_STATE.PENDING && progress && (
                            <UploadProgressCircle loaded={progress.loaded} total={progress.total} />
                          )}
                        </div>
                      );
                    },
                  )}
                </div>
              )}
            </div>

            {!isEditing && (
              <div id={`msg-context-tools`}>
                <button
                  className={`msg-context-btn`}
                  onClick={(e) => {
                    handleReplyToMessage(e, msg);
                  }}
                >
                  <span
                    className='material-symbols-rounded'
                    style={{ fontSize: '20px', marginRight: '5px' }}
                  >
                    reply
                  </span>
                </button>
                <button className={`msg-context-btn`}>
                  <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                    add_reaction
                  </span>
                </button>
                {(msg.author.id === user?.id ||
                  (selectedGuild && contextPerms.canManageMessages)) && (
                  <button
                    className={`msg-context-btn`}
                    onClick={(e) => {
                      handleShowMsgContextMenu(e, msg);
                    }}
                  >
                    <span className='material-symbols-rounded' style={{ fontSize: '20px' }}>
                      more_vert
                    </span>
                  </button>
                )}
              </div>
            )}
          </div>
        </>
      );

      if (isNewGroup) {
        const userPresence = getPresence(msg.author.id);
        const currentStatus = userPresence?.status || 'offline';

        const member = (selectedGuild ? getMember(selectedGuild.id, msg.author.id) : null) ?? {
          id: msg.author.id || '', //Look into this..
          user: msg.author as User,
          presence: {
            user: msg.author as User,
            status: currentStatus,
            activities: userPresence?.activities || [],
          },
          joined_at: new Date().toISOString(),
          roles: [],
        };

        const color = getMemberColor(member, selectedGuild);
        return (
          <>
            {referencedMessage && (
              <ReplyPreview
                referencedMessage={referencedMessage as Message}
                selectedGuildId={selectedGuild?.id}
                scrollToMessage={scrollToMessage}
              />
            )}
            <div
              key={messageKey}
              data-message-id={msg.id}
              className={`message-group ${pendingClass} ${mentionClass}`}
              style={pendingStyle}
            >
              <AuthorAvatar msg={msg} member={member} />
              <div className='message-details'>
                <div className='message-header'>
                  <span
                    className='author-name'
                    style={{ color: color, cursor: 'pointer' }}
                    onClick={(e) => {
                      void openUserProfile(e, member);
                    }}
                  >
                    {member.nick || msg.author.global_name || msg.author.username}
                  </span>
                  <span className='timestamp'>{formatTimestamp(msg.timestamp)}</span>
                </div>
                {msgContent}
              </div>
            </div>
          </>
        );
      }

      return (
        <div
          key={messageKey}
          data-message-id={msg.id}
          className={`message-details message-sub ${pendingClass} ${mentionClass}`}
          style={pendingStyle}
        >
          {msgContent}
        </div>
      );
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestionsTrigger && filteredSuggestions.length > 0) {
      if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filteredSuggestions.length);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex(
          (prev) => (prev - 1 + filteredSuggestions.length) % filteredSuggestions.length,
        );
      } else if (e.key === 'Enter' || e.key === 'Tab') {
        e.preventDefault();
        const suggestion = filteredSuggestions[selectedIndex];
        if (suggestion) {
          applySuggestion(suggestion);
        }
      } else if (e.key === 'Escape') {
        e.preventDefault();
        setSuggestionTrigger(null);
        setFilteredSuggestions([]);
      }
    }
  };

  const handleSearchAndSetGif = async (term: string) => {
    setGifSearchQuery(term);

    setGifs([]);

    if (!term.trim()) return;

    try {
      const data = await get<RawGifResponse[]>(
        `/gifs/search?locale=en&q=${encodeURIComponent(term)}&limit=50`,
      );
      const mappedGifs: GifResult[] = data.map((g) => ({
        id: g.id,
        title: g.title,
        previewUrl: g.gif_src,
        fullUrl: g.gif_src,
        aspectRatio: g.width / g.height,
      }));

      setGifs(mappedGifs);
    } catch (error) {
      logger.error(`MAIN_CONTENT`, `Failed to search gifs for term: ${term}`, error);
    }
  };

  const filterSuggestions = (type: SuggestionsType, query: string) => {
    const q = query.toLowerCase();

    if (type === SuggestionsType.USER) {
      let userSource: Member[] = [];

      const specialMentions = [
        {
          name: 'everyone',
          suggestionType: SuggestionsType.ROLE,
          isSpecial: true,
          role: null,
          description: 'Notify everyone who has permission to view this channel.',
        },
        {
          name: 'here',
          suggestionType: SuggestionsType.ROLE,
          role: null,
          isSpecial: true,
          description: 'Notify everyone online who has permission to view this channel.',
        },
        {
          name: 'someone',
          suggestionType: SuggestionsType.USER,
          isSpecial: true,
          user: null,
          description: "Help I've fallen and I need @someone.",
        },
      ] as Suggestion[];

      if (selectedGuild) {
        const memberState = memberLists?.[selectedGuild.id];
        const listItems = (
          Array.isArray(memberState) ? memberState : memberState?.items || []
        ) as MemberListItem[];

        userSource = listItems
          .filter((item): item is { member: Member } => !!item.member)
          .map((item) => item.member);
      } else if (selectedChannel.recipients) {
        userSource = selectedChannel.recipients.map((user) => ({
          user,
          nick: null,
          roles: [],
          joined_at: new Date().toISOString(),
        })) as unknown as Member[];
      }

      const filteredSpecials = specialMentions.filter((m) => {
        if (!m.name.includes(q)) return false;

        if (m.name === 'someone') return true;

        return contextPerms.canMentionEveryone;
      });

      const guildRoles = selectedGuild?.roles || [];
      const recentSpeakerIds = Array.from(new Set(messages.map((m) => m.author.id))).reverse();

      const filteredUsers = userSource
        .filter(
          (m) =>
            m.user.username.toLowerCase().includes(q) ||
            m.nick?.toLowerCase().includes(q) ||
            m.user.global_name?.toLowerCase().includes(q),
        )
        .map(
          (m) =>
            ({
              suggestionType: SuggestionsType.USER,
              user: m,
              isSpecial: false,
            }) as Suggestion,
        );

      const filteredRoles = guildRoles
        .filter((role) => role.name.toLowerCase().includes(q) && role.name !== '@everyone')
        .map(
          (r) =>
            ({
              role: r,
              suggestionType: SuggestionsType.ROLE,
              isSpecial: false,
              name: r.name,
            }) as Suggestion,
        );

      const combined = [...filteredSpecials, ...filteredUsers, ...filteredRoles]
        .sort((a: Suggestion, b: Suggestion) => {
          const getName = (item: Suggestion): string => {
            if (item.suggestionType === SuggestionsType.USER && item.user) {
              return (
                item.user.nick ||
                item.user.user.global_name ||
                item.user.user.username
              ).toLowerCase();
            }

            if (item.name) {
              return item.name.toLowerCase();
            }
            return '';
          };

          const nameA = getName(a);
          const nameB = getName(b);

          const startsA = nameA.startsWith(q);
          const startsB = nameB.startsWith(q);

          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;

          if (
            a.suggestionType === SuggestionsType.USER &&
            b.suggestionType === SuggestionsType.USER &&
            a.user &&
            b.user
          ) {
            const indexA = recentSpeakerIds.indexOf(a.user.id);
            const indexB = recentSpeakerIds.indexOf(b.user.id);

            if (indexA !== -1 && indexB !== -1) return indexA - indexB;
            if (indexA !== -1) return -1;
            if (indexB !== -1) return 1;
          }

          return nameA.localeCompare(nameB);
        })
        .slice(0, 8);

      setFilteredSuggestions(combined);
    } else if (type === SuggestionsType.EMOJI) {
      const guildEmojis = guilds.flatMap((g) =>
        (g.emojis || []).map(
          (e) =>
            ({
              emoji: e,
              suggestionType: SuggestionsType.EMOJI,
              name: e.name,
              sourceGuildName: g.name,
            }) as Suggestion,
        ),
      );

      const builtinEmojis: Suggestion[] = [];

      Object.keys(EMOJI_SHORTCODE_MAP).forEach((key) => {
        builtinEmojis.push({
          emoji: EMOJI_SHORTCODE_MAP[key],
          suggestionType: SuggestionsType.EMOJI,
          name: key,
        } as Suggestion);
      });

      const filteredEmojis = guildEmojis
        .filter((e: Suggestion) => {
          const GuildEmoji = EmojiSchema.parse(e.emoji);
          if (GuildEmoji) {
            return GuildEmoji.name.toLowerCase().includes(q) && GuildEmoji.require_colons;
          }
          return;
        })
        .concat(builtinEmojis)
        .sort((a: Suggestion, b: Suggestion) => {
          const startsA = a.name.toLowerCase().startsWith(q);
          const startsB = b.name.toLowerCase().startsWith(q);
          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);

      setFilteredSuggestions(filteredEmojis);
    } else if (type === SuggestionsType.CHANNEL) {
      if (!selectedGuild?.channels) {
        setFilteredSuggestions([]);
        return;
      }

      const filteredChannels = selectedGuild.channels
        .filter((c: Channel) => c.name?.toLowerCase().includes(q) && c.type !== 4)
        .map(
          (c: Channel) =>
            ({
              channel: c,
              suggestionType: SuggestionsType.CHANNEL,
              name: c.name,
              description: 'Channel',
              isSpecial: false,
            }) as Suggestion,
        )
        .sort((a: Suggestion, b: Suggestion) => {
          const startsA = a.name.toLowerCase().startsWith(q);
          const startsB = b.name.toLowerCase().startsWith(q);
          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);

      setFilteredSuggestions(filteredChannels);
    } else if (type === SuggestionsType.COMMAND) {
      const filteredCommands = commands
        .filter((x) => x.name.toLowerCase().includes(q))
        .map(
          (c: Command) =>
            ({
              command: c,
              suggestionType: SuggestionsType.COMMAND,
              description: c.description,
              name: c.name,
              isSpecial: false,
            }) as Suggestion,
        )
        .sort((a: Suggestion, b: Suggestion) => {
          const startsA = a.name.toLowerCase().startsWith(q);
          const startsB = b.name.toLowerCase().startsWith(q);
          if (startsA && !startsB) return -1;
          if (!startsA && startsB) return 1;
          return a.name.localeCompare(b.name);
        })
        .slice(0, 8);

      setFilteredSuggestions(filteredCommands);
    }
  };

  const updateChat = (message: string) => {
    setChatMessage(message);

    const mentionMatch = /(@|<@!?|#|:|\/)([\w\s]*)$/.exec(message);

    if (mentionMatch) {
      const symbol = mentionMatch[1];
      const query = mentionMatch[2];

      let type: SuggestionsType = SuggestionsType.USER;

      if (symbol === '#') type = SuggestionsType.CHANNEL;
      else if (symbol === ':') type = SuggestionsType.EMOJI;
      else if (symbol === '/') type = SuggestionsType.COMMAND;

      setSuggestionTrigger({
        type: type,
        query: query ?? '',
        startIndex: mentionMatch.index,
      });
      filterSuggestions(type, query ?? '');
    } else {
      setSuggestionTrigger(null);
      setFilteredSuggestions([]);
    }

    const now = Date.now();

    if (now - lastTypingSent.current > 3000 && message.length > 0) {
      lastTypingSent.current = now;
      void sendTypingStart();
    }
  };

  const sendTypingStart = async () => {
    try {
      await post(`/channels/${selectedChannel.id}/typing`, {});
    } catch (e) {
      console.error('Failed to send typing status', e);
    }
  };

  const TypingName = ({ userId }: { userId: string }) => {
    const member = getMember(selectedGuild?.id, userId);

    if (member?.nick || member?.user.username) {
      return <strong>{member.nick || member.user.username}</strong>;
    }

    const cachedUser = useUserStore.getState().users[userId];
    if (cachedUser?.username) {
      return <strong>{cachedUser.username}</strong>;
    }

    return <strong>Someone</strong>;
  };

  const handleTypingStatus = () => {
    if (!selectedChannel.id) return null;

    const channelTypingMap = typingUsers[selectedChannel.id] ?? {};
    let typingIds: string[] = Object.keys(channelTypingMap);
    if (user != null) typingIds = typingIds.filter((id) => id !== user.id);

    if (typingIds.length === 0) return null;

    const typingId0 = typingIds[0];
    if (!typingId0) {
      return null;
    }

    const typingId1 = typingIds[1];
    if (!typingId1) {
      return (
        <p>
          <TypingName userId={typingId0} /> is typing...
        </p>
      );
    }

    const typingId2 = typingIds[2];
    if (!typingId2) {
      return (
        <p>
          <TypingName userId={typingId0} /> and <TypingName userId={typingId1} /> are typing...
        </p>
      );
    }

    const typingId3 = typingIds[3];
    if (!typingId3) {
      return (
        <p>
          <TypingName userId={typingId0} />, <TypingName userId={typingId1} /> and{' '}
          <TypingName userId={typingId2} /> are typing...
        </p>
      );
    }

    return <p>Several people are typing...</p>;
  };

  const applySuggestion = (item: Suggestion) => {
    if (!suggestionsTrigger) return;

    const before = chatMessage.substring(0, suggestionsTrigger.startIndex);
    const queryLength = suggestionsTrigger.query.length + 1;
    const after = chatMessage.substring(suggestionsTrigger.startIndex + queryLength);

    const insertion = (() => {
      if (item.isSpecial) return `@${item.name} `;
      if (item.suggestionType === SuggestionsType.USER && item.user) {
        const { username, discriminator } = item.user.user;
        return `@${username}#${discriminator} `;
      }
      if (item.suggestionType === SuggestionsType.ROLE) return `@${item.name} `;
      if (item.suggestionType === SuggestionsType.EMOJI) return `:${item.name}: `;
      if (item.suggestionType === SuggestionsType.COMMAND) return `/${item.name} `;
      return `#${item.name} `;
    })();

    setChatMessage(before + insertion + after);
    setSuggestionTrigger(null);
    setFilteredSuggestions([]);
  };

  const canMessage = contextPerms.canMessage;
  const canSendAttachments = contextPerms.canSendAttachments;
  const replyingMsg = replyingMsgID != null && messages.find((x) => x.id === replyingMsgID);
  const isSingleDm = isDmView && selectedChannel.type === 1;

  return (
    <main
      className='chat-main'
      onDragEnter={handleDrag}
      onDragOver={handleDrag}
      onDragLeave={handleDrag}
      onDrop={handleDrop}
    >
      <header className='header'>
        <div className='header-left'>
          <div className='header-icon'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              {isGuildView ? 'tag' : 'alternate_email'}
            </span>
          </div>
          <span
            className='header-title'
            onClick={(e: React.MouseEvent) => {
              const firstRecipient = selectedChannel.recipients?.[0];

              if (isSingleDm && firstRecipient?.id) {
                const presence = getPresence(firstRecipient.id);
                const status = presence?.status ?? 'offline';

                const memberObj: Member = {
                  id: firstRecipient.id,
                  user: firstRecipient as User,
                  presence: {
                    user: firstRecipient as User,
                    status: status,
                    activities: [],
                  },
                  joined_at: new Date().toISOString(),
                  roles: [],
                };

                e.preventDefault();
                e.stopPropagation();

                void openFullProfile(memberObj);
              }
            }}
            style={
              isSingleDm
                ? {
                    cursor: 'pointer',
                  }
                : {}
            }
          >
            {selectedChannel.name || selectedChannel.recipients?.[0]?.username || 'Direct Message'}
          </span>
          {selectedChannel.topic && (
            <>
              <div className='vertical-divider' />
              <span className='header-topic'>{selectedChannel.topic}</span>
            </>
          )}
        </div>
        <div className='header-right'>
          <div className='header-right-left'>
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
            <button className={`icon-btn ${channelPinsVisible ? 'active-input-btn' : ''}`}>
              <span
                className='material-symbols-rounded'
                style={{ fontSize: '24px' }}
                onClick={() => {
                  setChannelPinsVisible(!channelPinsVisible);
                }}
              >
                push_pin
              </span>
            </button>
            {isGuildView &&
              (selectedChannel.type === 1 ? null : (
                <button
                  className='icon-btn'
                  onClick={() => {
                    setMemberListVisible(!memberListVisible);
                  }}
                >
                  <span
                    className={`material-symbols-rounded ${memberListVisible ? 'active-input-btn' : ''}`}
                    style={{ fontSize: '24px' }}
                  >
                    group
                  </span>
                </button>
              ))}
            <div className='search-bar'>
              <input type='text' placeholder='Search' />
              <span className='material-symbols-rounded search-icon'>search</span>
            </div>
          </div>
          <div className='vertical-divider'></div>
          <button className='icon-btn'>
            <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
              inbox
            </span>
          </button>
        </div>
      </header>

      {isDragging && (
        <div className='drag-overlay'>
          <div className='drag-content'>
            <span className='material-symbols-rounded'>attach_file_add</span>
            <p>Drop files to upload</p>
          </div>
        </div>
      )}

      <div className='chat-content-row'>
        <div className='chat-view'>
          {isScrolledUp && (
            <div
              className='jump-to-present-bar'
              onClick={() => {
                scrollToBottom('smooth');
              }}
            >
              <span className='material-symbols-rounded'>arrow_downward</span>
              <span>{`Whoa.. looks like you're in the past!`}</span>
              <button className='jump-btn'>Jump to Present</button>
            </div>
          )}

          {channelPinsVisible && (
            <PinnedMessagesShelf
              channelId={selectedChannel.id}
              onClose={() => {
                setChannelPinsVisible(false);
              }}
              scrollToMessage={scrollToMessage}
            />
          )}
          {replyingMsg && (
            <div className='reply-bar'>
              <span>
                Replying to <strong>{replyingMsg.author.username}</strong>
              </span>
              <button
                onClick={(e) => {
                  clearReplyingMsg(e, replyingMsg);
                }}
              >
                <span className='material-symbols-rounded vc-icon-state'>close</span>
              </button>
            </div>
          )}

          <OverlayScrollbarsComponent
            element='div'
            options={{
              scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' },
            }}
            className='messages-scroller scroller'
            ref={(os) => {
              if (os) {
                const instance = os.osInstance();
                if (instance) {
                  const { scrollOffsetElement } = instance.elements();
                  (scrollerRef as { current: HTMLElement | null }).current = scrollOffsetElement;
                }
              }
            }}
            onScroll={() => {
              void handleScroll();
            }}
          >
            {renderMessages()}
          </OverlayScrollbarsComponent>
          <form
            className='chat-input-area'
            onSubmit={(e) => {
              void handleSendMessage(e);
            }}
          >
            {suggestionsTrigger && filteredSuggestions.length > 0 && popupType !== 'GIF_PICKER' && (
              <SuggestionsBar
                suggestionsTrigger={suggestionsTrigger}
                filteredSuggestions={filteredSuggestions}
                selectedIndex={selectedIndex}
                applySuggestion={applySuggestion}
                setSelectedIndex={setSelectedIndex}
              ></SuggestionsBar>
            )}
            <div className='input-wrapper'>
              {attachments.length > 0 && (
                <OverlayScrollbarsComponent
                  element='div'
                  options={{
                    scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' },
                  }}
                  className='attachment-shelf-scroll'
                >
                  <div className='attachment-shelf'>
                    {attachments.map((at) => {
                      const isVideo = at.file.type.startsWith('video/');

                      return (
                        <div key={at.id} className='attachment-container'>
                          {isVideo ? (
                            <video src={at.preview} className='attachment-preview' muted />
                          ) : (
                            <img
                              src={at.preview}
                              className='attachment-preview'
                              alt='Attachment preview'
                            />
                          )}
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
                      );
                    })}
                  </div>
                </OverlayScrollbarsComponent>
              )}
              <div className='input-row'>
                {canMessage && canSendAttachments && (
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
                )}
                <ChatInput
                  disabled={!canMessage}
                  placeholder={
                    !canMessage
                      ? 'You do not have permission to send messages in this channel.'
                      : selectedChannel.name
                        ? `Message #${selectedChannel.name}`
                        : selectedChannel.recipients?.[0]
                          ? `Message @${
                              selectedChannel.recipients[0].global_name ??
                              selectedChannel.recipients[0].username ??
                              'someone'
                            }`
                          : 'Message...'
                  }
                  value={chatMessage}
                  onChange={(e) => {
                    updateChat(e.target.value);
                  }}
                  onKeyDown={handleKeyDown}
                  onSubmit={(e) => {
                    void handleSendMessage(e);
                  }}
                />
                {canMessage && (
                  <>
                    <div className='input-icons'>
                      <button
                        type='button'
                        className={`input-icon-btn ${
                          popupType === 'GIF_PICKER' ? 'active-input-btn' : ''
                        }`}
                        title={`Search gifs`}
                        onClick={(e) => {
                          if (popupType === 'GIF_PICKER') {
                            closePopup();
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            openPopup<'GIF_PICKER'>('GIF_PICKER', {
                              x: rect.left,
                              y: rect.top,
                              pointerX: e.clientX,
                              pointerY: e.clientY,
                              gifCategories,
                              gifs,
                              onSearch: handleSearchAndSetGif,
                              onSelectGif: (url) => {
                                setChatMessage(url);
                                closePopup();
                              },
                            });
                          }
                        }}
                      >
                        <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                          gif_box
                        </span>
                      </button>
                      <button
                        type='button'
                        className='input-icon-btn'
                        title={`Search stickers`}
                        onClick={() => {
                          setStickernatorActive(!stickernatorActive);
                        }}
                      >
                        <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                          sticky_note_2
                        </span>
                      </button>
                      <button
                        type='button'
                        className={`input-icon-btn ${
                          popupType === 'EMOJI_PICKER' ? 'active-input-btn' : ''
                        }`}
                        title={`Search emojis`}
                        onClick={(e) => {
                          if (popupType === 'EMOJI_PICKER') {
                            closePopup();
                          } else {
                            const rect = e.currentTarget.getBoundingClientRect();
                            openPopup<'EMOJI_PICKER'>('EMOJI_PICKER', {
                              x: rect.left,
                              y: rect.top,
                              pointerX: e.clientX,
                              pointerY: e.clientY,
                              guilds,
                              onSelectEmoji: (emoji: EmojiChooserEmoji) => {
                                const builtInUnicode = emoji.unicode;
                                if (emoji.isBuiltin && builtInUnicode) {
                                  setChatMessage((prev) => `${prev}${builtInUnicode} `);
                                  return;
                                }

                                const emojiId = emoji.id;
                                if (!emojiId) {
                                  return;
                                }

                                const prefix = emoji.animated ? 'a:' : ':';
                                setChatMessage(
                                  (prev) => `${prev}<${prefix}${emoji.name}:${emojiId}> `,
                                );
                              },
                            });
                          }
                        }}
                      >
                        <span className='material-symbols-rounded' style={{ fontSize: '24px' }}>
                          mood
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
                  </>
                )}
              </div>
            </div>
          </form>
          <div className='typing-status-wrapper'>{handleTypingStatus()}</div>
        </div>

        {isGuildView && selectedGuild && (
          <MemberList
            key={selectedChannel.id}
            selectedGuild={selectedGuild}
            selectedChannel={selectedChannel}
            active={memberListVisible}
          />
        )}
      </div>
    </main>
  );
};

export default MainContent;
