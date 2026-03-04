import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';
import { type JSX, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import type { Channel, GatewayContextSchema, Guild, Relationship, User } from 'shared';
import { type LogEntry, logger, post, useGuildChannelMemoryStore } from 'shared';
import ChannelSidebar from '@/components/chat/channelSidebar';
import { FriendsList } from '@/components/chat/friendsList';
import GuildSidebar from '@/components/chat/guildSidebar';
import MainContent from '@/components/chat/mainContent';
import NoTextChannels from '@/components/chat/noTextChannels';
import Settings from '@/components/chat/settings';
import { useGateway } from '@/context/gatewayContext';
import { useIsMobileWeb } from '@/context/mobileWebContext';
import { useVoice } from '@/hooks/useVoice';
import { useModal } from '@/layering/modalContext';
import { ChatApp as MobileChatApp } from '../../../mobile/src/pages/chat';

import LoadingScreen from './loading';

interface DeveloperSettings {
  webrtc_p2p?: boolean;
  popout_console?: boolean;
}

interface GatewayMessageCreateDetail {
  guild_id?: string | null;
  channel_id: string;
  id: string;
  author: { id?: string };
  mentions?: User[];
  mention_everyone?: boolean;
}

type ChatViewMode = 'friends' | 'dm_channel' | 'guild_channel' | 'guild_empty';

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null;

const resolveGuildTextChannel = (guild: Guild): Channel | null =>
  guild.channels.find((channel) => channel.type === 0) ?? null;

const resolveChatViewMode = (
  selectedGuild: Guild | null,
  selectedChannel: Channel | null,
): ChatViewMode => {
  if (selectedGuild && selectedChannel) return 'guild_channel';
  if (selectedGuild && !selectedChannel) return 'guild_empty';
  if (!selectedGuild && selectedChannel) return 'dm_channel';
  return 'friends';
};

const getDeveloperSettings = (): DeveloperSettings => {
  const raw = localStorage.getItem('developerSettings');
  if (!raw) return {};

  const parsed: unknown = JSON.parse(raw);
  if (!isRecord(parsed)) return {};

  return {
    webrtc_p2p: typeof parsed.webrtc_p2p === 'boolean' ? parsed.webrtc_p2p : undefined,
    popout_console: typeof parsed.popout_console === 'boolean' ? parsed.popout_console : undefined,
  };
};

const ChatApp = (): JSX.Element => {
  const isMobileWeb = useIsMobileWeb();
  const {
    isReady,
    guilds,
    user,
    relationships,
    requestMembers,
    privateChannels,
    updateReadState,
  }: GatewayContextSchema = useGateway();
  const { guildId, channelId } = useParams();
  const { openModal } = useModal();
  const { connectToVoice } = useVoice();
  const setBoth = useGuildChannelMemoryStore((s) => s.setBoth);
  const navigate = useNavigate();
  const [logs, setLogs] = useState<LogEntry[]>(logger.entries);
  const [consolePos, setConsolePos] = useState({ x: 100, y: 100, w: 400, h: 300 });
  const isDragging = useRef(false);
  const isResizing = useRef(false);
  const [showSettings, setShowSettings] = useState(false);
  const [localFriends, setLocalFriends] = useState<Relationship[] | []>([]);
  const [passedGuilds, setPassedGuilds] = useState<Guild[]>([]);
  const [unreads, setUnreads] = useState<Map<string, Set<string>>>(new Map());
  const [mentions, setMentions] = useState<Map<string, Map<string, number>>>(new Map());
  const [newPrivateChannels, setNewPrivateChannels] = useState<Channel[] | []>([]);
  const [privateChannelMentions, setPrivateChannelMentions] = useState<Map<string, number>>(
    new Map(),
  );

  const clearChannelReadState = useCallback(
    async (gId: string | null, cId: string, lastMsgId: string | null) => {
      const key = gId ?? 'direct_messages';
      const channelIdToClear = cId;

      setUnreads((prev) => {
        const next = new Map(prev);
        const guildSet = next.get(key);

        if (guildSet) {
          const newSet = new Set(guildSet);

          newSet.delete(channelIdToClear);

          if (newSet.size === 0) {
            next.delete(key);
          } else {
            next.set(key, newSet);
          }
        }
        return next;
      });

      setMentions((prev) => {
        const next = new Map(prev);
        const guildMap = next.get(key);

        if (guildMap) {
          const newMap = new Map(guildMap);

          newMap.delete(channelIdToClear);

          if (newMap.size === 0) {
            next.delete(key);
          } else {
            next.set(key, newMap);
          }
        }
        return next;
      });

      if (lastMsgId && updateReadState) {
        updateReadState(channelIdToClear, lastMsgId);
      }

      if (!lastMsgId) return;

      try {
        await post(`/channels/${cId}/messages/${lastMsgId}/ack`, {
          token: null,
        });

        logger.info('CHAT_APP', 'Ack sent for channel', cId);
      } catch (err) {
        logger.error('CHAT_APP', 'Failed to send ack', err);
      }
    },
    [updateReadState],
  );

  const selectedGuild = passedGuilds.find((g) => g.id === guildId) ?? null;
  const selectedChannel = selectedGuild
    ? (selectedGuild.channels.find((c) => c.id === channelId) ?? null)
    : ((privateChannels as Channel[])?.find((c) => c.id === channelId) ?? null);
  const chatViewMode = resolveChatViewMode(selectedGuild, selectedChannel);

  const developerSettings = getDeveloperSettings();
  const isUsingWebRTCP2P = developerSettings.webrtc_p2p ?? false;
  const isUsingPopoutConsole = developerSettings.popout_console ?? false;

  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).classList.contains('popout-console-titlebar')) {
      isDragging.current = true;
    } else if ((e.target as HTMLElement).classList.contains('resizer')) {
      isResizing.current = true;
    }

    const startX = e.clientX;
    const startY = e.clientY;
    const startPos = { ...consolePos };

    const onMouseMove = (moveEvent: MouseEvent) => {
      if (isDragging.current) {
        setConsolePos((prev) => ({
          ...prev,
          x: startPos.x + (moveEvent.clientX - startX),
          y: startPos.y + (moveEvent.clientY - startY),
        }));
      } else if (isResizing.current) {
        setConsolePos((prev) => ({
          ...prev,
          w: Math.max(200, startPos.w + (moveEvent.clientX - startX)),
          h: Math.max(150, startPos.h + (moveEvent.clientY - startY)),
        }));
      }
    };

    const onMouseUp = () => {
      isDragging.current = false;
      isResizing.current = false;

      document.removeEventListener('mousemove', onMouseMove);
      document.removeEventListener('mouseup', onMouseUp);
    };

    document.addEventListener('mousemove', onMouseMove);
    document.addEventListener('mouseup', onMouseUp);
  };

  useEffect(() => {
    setBoth(selectedGuild?.id ?? null, selectedChannel?.id ?? null);
  }, [selectedGuild?.id, selectedChannel?.id, setBoth]);

  useEffect(() => {
    if (!selectedGuild || channelId) {
      return;
    }

    const firstTextChannel = resolveGuildTextChannel(selectedGuild);
    if (firstTextChannel?.id) {
      void navigate(`/channels/${selectedGuild.id}/${firstTextChannel.id}`, { replace: true });
    }
  }, [channelId, navigate, selectedGuild]);

  useEffect(() => {
    const handleUpdate = () => {
      setLogs([...logger.entries]);
    };

    window.addEventListener('logger_update', handleUpdate);
    return () => {
      window.removeEventListener('logger_update', handleUpdate);
    };
  }, []);

  useEffect(() => {
    if (isReady && guildId && channelId && requestMembers && selectedChannel?.id === channelId) {
      requestMembers(guildId, channelId);
    }
  }, [guildId, channelId, isReady, requestMembers, selectedChannel?.id]);

  useEffect(() => {
    if (guilds.length > 0) {
      setPassedGuilds(guilds);
    }
  }, [guilds]);

  useEffect(() => {
    setLocalFriends(relationships);
  }, [relationships]);

  useEffect(() => {
    const handleNewGuild = (event: Event) => {
      const newGuild = (event as CustomEvent<Guild>).detail;

      setPassedGuilds((prev) => {
        if (prev.some((x) => x.id === newGuild.id)) return prev;

        const firstTextChannel = newGuild.channels.find((c: Channel) => c.type === 0);

        if (firstTextChannel) {
          void navigate(`/channels/${newGuild.id}/${firstTextChannel.id}`);
        } else {
          void navigate(`/channels/${newGuild.id}`);
        }

        return [...prev, newGuild];
      });
    };

    const handleGuildRemove = (event: Event) => {
      const deletedId = (event as CustomEvent<Guild>).detail.id;

      setPassedGuilds((prev) => prev.filter((guild) => guild.id !== deletedId));

      if (window.location.pathname.includes(deletedId)) {
        void navigate('/channels/@me');
      }
    };

    const handleRelationshipAdd = (event: Event) => {
      const newRelationship = (event as CustomEvent<Relationship>).detail;

      setLocalFriends((prev) => {
        if (prev.some((f) => f.id === newRelationship.id)) {
          return prev.map((f) => (f.id === newRelationship.id ? newRelationship : f));
        }

        return [...prev, newRelationship];
      });
    };

    const handleRelationshipRemove = (event: Event) => {
      const removedRelationship = (event as CustomEvent<Relationship>).detail;

      setLocalFriends((prev) => prev.filter((f) => f.id !== removedRelationship.id));
    };

    const handleNewMessage = (event: Event) => {
      const newMessage = (event as CustomEvent<GatewayMessageCreateDetail>).detail;
      const { guild_id: gId, channel_id: cId, id: msgId, author } = newMessage;
      const guildKey = gId ?? 'direct_messages';

      setPassedGuilds((prev) =>
        prev.map((g) =>
          g.id === gId
            ? {
                ...g,
                channels: g.channels.map((c) =>
                  c.id === cId ? { ...c, last_message_id: msgId } : c,
                ),
              }
            : g,
        ),
      );

      if (cId === selectedChannel?.id) {
        void clearChannelReadState(gId ?? null, cId, msgId);
        if (updateReadState) {
          updateReadState(cId, msgId);
        }
        return;
      }

      const targetChannel = (privateChannels as Channel[])?.find((c) => c.id === cId);

      if (targetChannel && author.id && author.id !== user?.id) {
        setPrivateChannelMentions((prev) => {
          const newMap = new Map(prev);
          const currentCount = newMap.get(cId) ?? 0;
          newMap.set(cId, currentCount + 1);
          return newMap;
        });

        setNewPrivateChannels((prev) => {
          const otherChannels = prev.filter((c) => c.id !== cId);

          const updatedChannel = { ...targetChannel, last_message_id: msgId };

          return [...otherChannels, updatedChannel].sort((a, b) => {
            const idA = BigInt(a.last_message_id || '0');
            const idB = BigInt(b.last_message_id || '0');
            return idB > idA ? 1 : -1;
          });
        });
      }

      const isMentioned =
        newMessage.mentions?.some((m: User) => m.id === user?.id) || newMessage.mention_everyone;

      if (isMentioned) {
        setMentions((prev) => {
          const next = new Map(prev);
          const guildMap = new Map(next.get(guildKey) ?? []);
          const currentCount = guildMap.get(cId) ?? 0;

          guildMap.set(cId, currentCount + 1);
          next.set(guildKey, guildMap);
          return next;
        });
      } else {
        setUnreads((prev) => {
          const next = new Map(prev);
          const guildSet = new Set(next.get(guildKey) ?? []);

          guildSet.add(cId);
          next.set(guildKey, guildSet);
          return next;
        });
      }
    };

    window.addEventListener('gateway_relationship_add', handleRelationshipAdd);
    window.addEventListener('gateway_relationship_remove', handleRelationshipRemove);
    window.addEventListener('gateway_guild_create', handleNewGuild);
    window.addEventListener('gateway_message_create', handleNewMessage);
    window.addEventListener('gateway_guild_delete', handleGuildRemove);

    return () => {
      window.removeEventListener('gateway_guild_create', handleNewGuild);
      window.removeEventListener('gateway_guild_delete', handleGuildRemove);
      window.removeEventListener('gateway_message_create', handleNewMessage);
      window.removeEventListener('gateway_relationship_add', handleRelationshipAdd);
      window.removeEventListener('gateway_relationship_remove', handleRelationshipRemove);
    };
  }, [
    clearChannelReadState,
    navigate,
    privateChannels,
    selectedChannel?.id,
    updateReadState,
    user,
  ]);

  useEffect(() => {
    if (selectedGuild?.id && selectedChannel?.id) {
      setUnreads((prev) => {
        if (!prev.has(selectedGuild.id)) {
          return prev;
        }

        const next = new Map(prev);
        const guildSet = new Set(next.get(selectedGuild.id));

        guildSet.delete(selectedChannel.id);

        if (guildSet.size === 0) {
          next.delete(selectedGuild.id);
        } else {
          next.set(selectedGuild.id, guildSet);
        }

        return next;
      });

      setMentions((prev) => {
        if (!prev.has(selectedGuild.id)) {
          return prev;
        }

        const next = new Map(prev);
        const guildMap = new Map(next.get(selectedGuild.id));

        guildMap.delete(selectedChannel.id);

        if (guildMap.size === 0) {
          next.delete(selectedGuild.id);
        } else {
          next.set(selectedGuild.id, guildMap);
        }

        return next;
      });
    }

    if (selectedChannel?.id && (selectedChannel.type === 1 || selectedChannel.type === 3)) {
      const exists = newPrivateChannels.some((c: Channel) => c.id === selectedChannel.id);

      if (exists) {
        setPrivateChannelMentions((prev) => {
          const newMap = new Map(prev);
          newMap.set(selectedChannel.id, 0);
          return newMap;
        });

        setNewPrivateChannels((prev) => {
          const otherChannels = prev.filter((c) => c.id !== selectedChannel.id);

          return [...otherChannels].sort((a, b) => {
            const idA = BigInt(a.last_message_id ?? '0');
            const idB = BigInt(b.last_message_id ?? '0');
            return idB > idA ? 1 : -1;
          });
        });
      }
    }
  }, [newPrivateChannels, selectedGuild, selectedChannel]);

  const handleManualRemoveFriend = (userId: string) => {
    setLocalFriends((prev) => prev.filter((f) => f.id !== userId));
  };

  const handleManualUpdateFriend = (updatedFriend: Relationship) => {
    setLocalFriends((prev) => prev.map((f) => (f.id === updatedFriend.id ? updatedFriend : f)));
  };

  useEffect(() => {
    const handleOpenSettings = () => {
      setShowSettings(true);
    };

    window.addEventListener('ui_open_settings', handleOpenSettings);

    return () => {
      window.removeEventListener('ui_open_settings', handleOpenSettings);
    };
  }, []);

  const handleSelectGuild = (guild: Guild | null) => {
    if (!guild) {
      void navigate(`/channels/@me`);
    } else {
      const firstTextChannel = resolveGuildTextChannel(guild);
      if (firstTextChannel?.id) {
        void navigate(`/channels/${guild.id}/${firstTextChannel.id}`);
        return;
      }

      void navigate(`/channels/${guild.id}`);
    }
  };

  const handleVoiceConnection = (channel: Channel) => {
    if (!selectedGuild) {
      return; //only support guild calls for now
    }

    if (isUsingWebRTCP2P) {
      openModal('CONFIRMATION_CONNECT_P2P', {
        channel: channel,
        name: channel.name ?? '',
        guild_id: channel.guild_id ?? null,
      });
    } else {
      connectToVoice(channel.guild_id ?? null, channel);
    }
  };

  const handleSelectChannel = (channel: Channel | null) => {
    if (channel?.type === 2) {
      handleVoiceConnection(channel);
    }
    const gId = guildId ?? '@me';
    if (!channel?.id) {
      void navigate(`/channels/${gId}`);
      return;
    }
    void navigate(`/channels/${gId}/${channel.id}`);
  };

  const handleMarkGuildAsRead = async (guild_id: string) => {
    try {
      const apiVerRaw = localStorage.getItem('defaultApiVersion') ?? 'v9';
      const apiVerPart = apiVerRaw.startsWith('v') ? apiVerRaw.slice(1) : apiVerRaw;
      const apiVer = parseInt(apiVerPart, 10) || 0;

      if (apiVer < 9) {
        await post(`/guilds/${guild_id}/ack`, {});
      } else {
        const guildUnreadSet = unreads.get(guild_id);
        if (!guildUnreadSet || guildUnreadSet.size === 0) return;

        const targetGuild = guilds.find((g) => g.id === guild_id);
        if (!targetGuild) return;

        const read_states = Array.from(guildUnreadSet)
          .map((channelId) => {
            const channel = targetGuild.channels.find((c) => c.id === channelId);

            if (channel?.last_message_id) {
              return {
                channel_id: channel.id,
                message_id: channel.last_message_id,
                read_state_type: 0,
              };
            }
            return null;
          })
          .filter((entry) => entry !== null);

        if (read_states.length === 0) return;

        await post(`/read-states/ack-bulk`, {
          read_states: read_states,
        });
      }

      setUnreads((prev) => {
        const next = new Map(prev);
        next.delete(guild_id);
        return next;
      });

      setMentions((prev) => {
        const next = new Map(prev);
        next.delete(guild_id);
        return next;
      });

      logger.info(`GUILD_SIDEBAR`, `Bulk ack sent in guild`, guild_id);
    } catch (err) {
      logger.error(`GUILD_SIDEBAR`, `Failed to bulk-ack in guild: ${guild_id}`, err);
    }
  };

  if (!isReady) {
    return <LoadingScreen />;
  }

  if (isMobileWeb) {
    return (
      <div
        className='page-wrapper'
        style={{ height: '100dvh', display: 'flex', flexDirection: 'column' }}
      >
        <MobileChatApp
          guilds={passedGuilds}
          relationships={localFriends}
          privateChannels={newPrivateChannels}
          user={user}
          selectedGuildId={guildId}
          selectedChannelId={channelId}
          onSelectGuild={handleSelectGuild}
          onSelectChannel={handleSelectChannel}
        />
      </div>
    );
  }

  const settingsPortal =
    typeof document !== 'undefined' ? document.getElementById('secondary-layer-portal') : null;

  return (
    <div className='page-wrapper'>
      {isUsingPopoutConsole && !showSettings && (
        <div
          className='popout-console'
          onMouseDown={handleMouseDown}
          style={{
            left: consolePos.x,
            top: consolePos.y,
            width: consolePos.w,
            height: consolePos.h,
          }}
        >
          <div className='popout-console-titlebar'>
            <span>Console</span>
          </div>
          <OverlayScrollbarsComponent
            element='div'
            options={{ scrollbars: { theme: 'os-theme-dark', autoHide: 'scroll' } }}
            className='popout-console-entries'
          >
            {logs.map((log, i) => (
              <div key={i} className={`log-line ${log.level.toLowerCase()}`}>
                <span className='timestamp'>[{log.timestamp}]</span>
                <span className='origin'>({log.source})</span>
                <span className='message'>{log.message}</span>
                {log.formattedData && <pre className='log-data'>{log.formattedData}</pre>}
              </div>
            ))}
          </OverlayScrollbarsComponent>
          <div className='resizer' />
        </div>
      )}
      <div className='chat-layout layer-base' aria-hidden={showSettings}>
        <GuildSidebar
          guilds={passedGuilds}
          selectedGuildId={guildId}
          onSelectGuild={handleSelectGuild}
          privateChannels={newPrivateChannels}
          privateChannelMentions={privateChannelMentions}
          unreads={unreads}
          mentions={mentions}
          markAsRead={handleMarkGuildAsRead}
        />
        <ChannelSidebar
          selectedGuild={selectedGuild}
          selectedChannel={selectedChannel}
          onSelectChannel={handleSelectChannel}
          unreads={unreads}
          mentions={mentions}
        />

        {selectedChannel && (chatViewMode === 'guild_channel' || chatViewMode === 'dm_channel') ? (
          <MainContent
            key={selectedChannel.id}
            selectedChannel={selectedChannel}
            selectedGuild={selectedGuild}
            viewMode={chatViewMode}
            onChannelSeen={clearChannelReadState}
          />
        ) : chatViewMode === 'friends' ? (
          <FriendsList
            friends={localFriends}
            onRequestUpdate={handleManualUpdateFriend}
            onRequestDelete={handleManualRemoveFriend}
          />
        ) : (
          <NoTextChannels />
        )}
      </div>
      {showSettings &&
        (settingsPortal ? (
          createPortal(
            <Settings
              user={user}
              onClose={() => {
                setShowSettings(false);
              }}
            ></Settings>,
            settingsPortal,
          )
        ) : (
          <Settings
            user={user}
            onClose={() => {
              setShowSettings(false);
            }}
          ></Settings>
        ))}
    </div>
  );
};

export default ChatApp;
