import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import type { Channel, ChannelReadState } from 'shared';
import type { GatewayContextSchema } from 'shared';
import type { Relationship } from 'shared';
import type { User } from 'shared';
import type { UserSettings } from 'shared';
import { useUserStore } from 'shared';
import {
  GatewayPayloadSchema,
  type GuildMemberListOperationItem,
  GuildMemberListUpdateSchema,
  HelloSchema,
  MessageCreateSchema,
  MessageDeleteSchema,
  MessageUpdateSchema,
  PresenceUpdateSchema,
  ReadyEventSchema,
  TypingStartSchema,
  UserUpdateSchema,
} from 'shared';
import { type Guild, type Member, type VoiceState, VoiceStateSchema } from 'shared';
import { type Presence, type Session, SessionListSchema } from 'shared';
import { logger } from 'shared';

import { GatewayContext } from './gatewayContext';

interface GatewayProviderProps {
  children?: ReactNode;
  isReady?: boolean;
  guilds?: Guild[];
  user?: User;
}

interface DeveloperSettings {
  log_gateway?: boolean;
}

const getDeveloperSettings = (): DeveloperSettings => {
  const raw = localStorage.getItem('developerSettings');
  if (!raw) return {};

  const parsed: unknown = JSON.parse(raw);
  if (typeof parsed !== 'object' || parsed === null) return {};

  return {
    log_gateway:
      'log_gateway' in parsed && typeof parsed.log_gateway === 'boolean'
        ? parsed.log_gateway
        : undefined,
  };
};

export const GatewayProvider = ({ children }: GatewayProviderProps) => {
  const socket = useRef<WebSocket | null>(null);
  const userRef = useRef<User | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [privateChannels, setPrivateChannels] = useState<Channel[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [presences, setPresences] = useState<GatewayContextSchema['presences']>({});
  const [readStates, setReadStates] = useState<GatewayContextSchema['readStates']>([]);
  const [voiceStates, setVoiceStates] = useState<GatewayContextSchema['voiceStates']>({});
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [memberLists, setMemberLists] = useState<GatewayContextSchema['memberLists']>({});
  const memberListsRef = useRef(memberLists);
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, number>>>({});
  const subscribedChannels = useRef<Record<string, string>>({});

  const sessionId = useRef<string | null>(null);
  const lastSequence = useRef<number | null>(null);
  const resumeGatewayUrl = useRef<string | null>(null);
  const [reconnectCounter, setReconnectTrigger] = useState(0);

  const sendOp = useCallback((op: number, d: unknown) => {
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(JSON.stringify({ op, d }));
    }
  }, []);

  useEffect(() => {
    memberListsRef.current = memberLists;
  }, [memberLists]);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const requestMembers = useCallback((guildId: string, channelId: string, ranges = [[0, 99]]) => {
    subscribedChannels.current[guildId] = channelId;
    if (socket.current?.readyState === WebSocket.OPEN) {
      socket.current.send(
        JSON.stringify({
          op: 14,
          d: {
            guild_id: guildId,
            channels: { [channelId]: ranges },
          },
        }),
      );
    }
  }, []);

  const getMember = useCallback(
    (guild_id: string | null | undefined, user_id: string | null | undefined): Member | null => {
      //lord have mercy
      if (!memberLists || !guild_id) return null;

      return (
        memberLists[guild_id]?.items.find((item) => item.member?.id === user_id)?.member ?? null
      );
    },
    [memberLists],
  );

  const getMemberColor = useCallback(
    (member: Member | null | undefined, guild?: Guild | null): string | undefined => {
      if (!guild || !member || member.roles.length === 0) return undefined;

      const memberRoles = guild.roles.filter((r) => member.roles.includes(r.id));

      memberRoles.sort((a, b) => b.position - a.position);

      const colorRole = memberRoles.find((r) => r.color !== 0);
      if (colorRole) {
        return `#${colorRole.color.toString(16).padStart(6, '0')}`;
      }
      return undefined;
    },
    [],
  );

  const getPresence = useCallback(
    (userId: string | undefined): Presence | null => {
      if (!userId) return null;
      return presences[userId] ?? null;
    },
    [presences],
  );

  const updateReadState = useCallback((channelId: string, messageId: string) => {
    setReadStates((prev) => {
      const currentList = prev;
      const targetCid = channelId;
      const targetMid = messageId;
      const exists = currentList.find((rs) => rs.channel_id === targetCid);

      if (!exists) {
        return [
          ...currentList,
          {
            id: targetCid,
            channel_id: targetCid,
            last_message_id: targetMid,
            last_pin_timestamp: null,
            mention_count: 0,
          } satisfies ChannelReadState,
        ];
      }

      return currentList.map((rs) => {
        if (rs.channel_id === targetCid) {
          const currentAckId = rs.last_message_id ? BigInt(rs.last_message_id) : 0n;
          const newAckId = BigInt(targetMid);

          if (newAckId >= currentAckId) {
            return { ...rs, last_message_id: targetMid, mention_count: 0 };
          }
        }
        return rs;
      });
    });
  }, []);

  const handleDispatch = useCallback(
    (type: string, data: unknown) => {
      const { upsertUsers, updatePresence } = useUserStore.getState();

      switch (type) {
        case 'READY': {
          const parsed = ReadyEventSchema.parse(data);
          const initialPresences: Record<string, Presence> = {};
          const initialVoiceStates: Record<string, VoiceState> = {};

          sessionId.current = parsed.session_id;
          resumeGatewayUrl.current = parsed.resume_gateway_url ?? null;

          upsertUsers([parsed.user]);
          upsertUsers(parsed.relationships.map((r) => r.user));

          if (parsed.presences) {
            parsed.presences.forEach((presence) => {
              if (presence.user?.id) {
                initialPresences[presence.user.id] = presence;

                updatePresence(presence.user.id, presence);
              }
            });
          } //So friend statuses are supposed to be sent here, which oldcord does - but spacebar seemingly doesn't?

          parsed.guilds.forEach((guild: Guild) => {
            (guild.presences ?? []).forEach((presence) => {
              const userId = presence.user.id;
              if (!userId) return;

              upsertUsers([presence.user as User]);
              updatePresence(userId, presence);

              initialPresences[userId] = presence;
            });

            (guild.voice_states ?? []).forEach((vs) => {
              initialVoiceStates[vs.user_id] = { ...vs, guild_id: guild.id };
            });
          }); //So spacebar doesnt actually have this like we do on oldcord, some modern discord engineering bullshit - it'll fix itself on op 14 responses dw
          setUser(parsed.user);
          setPrivateChannels(parsed.private_channels ?? []);

          const readStateData = parsed.read_state;
          const entries = Array.isArray(readStateData)
            ? readStateData
            : readStateData?.entries || [];

          setReadStates(entries);
          setRelationships(parsed.relationships);
          setUserSettings(parsed.user_settings);
          setGuilds(parsed.guilds);
          setSessions(parsed.sessions ?? []);
          setPresences((prev) => ({ ...prev, ...initialPresences }));
          setVoiceStates(initialVoiceStates);
          setIsReady(true);
          break;
        }

        case 'RESUMED':
          setIsReady(true);
          break;

        case 'SESSIONS_REPLACE': {
          const parsed = SessionListSchema.parse(data);
          setSessions(parsed);
          break;
        }

        case 'VOICE_STATE_UPDATE': {
          const parsed = VoiceStateSchema.parse(data);

          setVoiceStates((prev) => {
            if (!parsed.channel_id) {
              const remaining = Object.fromEntries(
                Object.entries(prev).filter(([userId]) => userId !== parsed.user_id),
              ) as Record<string, VoiceState>;
              return remaining;
            } else {
              return {
                ...prev,
                [parsed.user_id]: parsed,
              };
            }
          });

          window.dispatchEvent(new CustomEvent('gateway_voice_state', { detail: data }));
          break;
        }

        case 'VOICE_SERVER_UPDATE':
          window.dispatchEvent(new CustomEvent('gateway_voice_server', { detail: data }));
          break;

        case 'MESSAGE_CREATE': {
          const parsed = MessageCreateSchema.parse(data);

          upsertUsers([parsed.author as User]);

          window.dispatchEvent(new CustomEvent('gateway_message_create', { detail: parsed }));

          setTypingUsers((prev) => {
            const channelTyping = { ...prev[parsed.channel_id] };

            // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Yeah I know and this is completely needed, just shut up about it.
            const { [parsed.author.id ?? '']: _, ...remainingTyping } = channelTyping;
            return { ...prev, [parsed.channel_id]: remainingTyping };
          });

          setPrivateChannels((prev) =>
            prev.map((channel) => {
              if (channel.id === parsed.channel_id) {
                return {
                  ...channel,
                  last_message_id: parsed.id,
                };
              }
              return channel;
            }),
          );
          break;
        }

        case 'MESSAGE_ACK': {
          const { channel_id, message_id } = data as { channel_id: string; message_id: string };

          setReadStates((prev) => {
            return prev.map((rs) => {
              if (rs.channel_id === channel_id) {
                const isNewer =
                  !rs.last_message_id || BigInt(message_id) >= BigInt(rs.last_message_id);

                if (isNewer) {
                  return { ...rs, last_message_id: message_id, mention_count: 0 };
                }
              }
              return rs;
            });
          });
          break;
        }

        case 'CHANNEL_CREATE': {
          const newChannel = data as Channel;

          if (newChannel.type === 1 || newChannel.type === 3) {
            setPrivateChannels((prev) => [newChannel, ...prev]);
          }

          window.dispatchEvent(new CustomEvent('ui_channel_created', { detail: newChannel }));
          break;
        }

        case 'CHANNEL_DELETE': {
          const deleted = data as Channel;
          if (deleted.type === 1 || deleted.type === 3) {
            setPrivateChannels((prev) => prev.filter((c) => c.id !== deleted.id));
          }
          window.dispatchEvent(new CustomEvent('ui_channel_deleted', { detail: deleted }));
          break;
        }

        case 'MESSAGE_UPDATE': {
          const parsed = MessageUpdateSchema.parse(data);
          upsertUsers([parsed.author as User]);

          window.dispatchEvent(new CustomEvent('gateway_message_update', { detail: parsed }));
          break;
        }

        case 'MESSAGE_DELETE': {
          const parsed = MessageDeleteSchema.parse(data);
          window.dispatchEvent(new CustomEvent('gateway_message_delete', { detail: parsed }));
          break;
        }

        case 'GUILD_CREATE':
          window.dispatchEvent(new CustomEvent('gateway_guild_create', { detail: data }));
          break;
        case 'GUILD_DELETE':
          window.dispatchEvent(new CustomEvent('gateway_guild_delete', { detail: data }));
          break;
        case 'USER_UPDATE': {
          const parsed = UserUpdateSchema.parse(data);

          if (parsed.id === userRef.current?.id) {
            setUser((prevUser) => {
              if (!prevUser) return null;
              return { ...prevUser, ...parsed };
            });
          }
          window.dispatchEvent(new CustomEvent('gateway_user_update', { detail: parsed }));
          break;
        }

        case 'GUILD_MEMBER_LIST_UPDATE': {
          const parsed = GuildMemberListUpdateSchema.parse(data);
          const usersToStore: User[] = [];
          const newPresences: Record<string, Presence> = {};
          parsed.ops.forEach((op) => {
            const processItem = (item: GuildMemberListOperationItem) => {
              if (item.member?.user) {
                usersToStore.push(item.member.user);
              }

              if (item.member?.presence) {
                const userId = item.member.user?.id || item.member.id;

                if (userId) {
                  newPresences[userId] = item.member.presence;
                }
              }
            };

            if (op.op === 'SYNC') {
              op.items.forEach(processItem);
            } else if (op.op === 'INSERT' || op.op === 'UPDATE') {
              processItem(op.item);
            }
          });

          if (usersToStore.length > 0) {
            upsertUsers(usersToStore);
          }

          if (Object.keys(newPresences).length > 0) {
            Object.entries(newPresences).forEach(([id, presence]) => {
              updatePresence(id, presence);
            });

            setPresences((prev) => ({ ...prev, ...newPresences }));
          }

          setMemberLists((prev) => {
            /*
              One thing deviated from Discord's implementation is to handle "Partial Sync" states.
              Spacebar's OP14 is broken. The fact is that it thinks range should be [0, online member count] goes
              against what OP14 should be. So once we determine a Spacebar instance by fetching members once to get this "Partial Sync" behavior,
              fetch all online members, and then filter it down to 100 items like Discord.
            */
            const guildId = parsed.guild_id;
            const existing = prev?.[guildId];
            const isSameId = existing?.id === parsed.id;
            let currentItems = isSameId ? [...existing.items] : [];
            let isPartial = isSameId ? (existing.partial ?? false) : false;

            for (const op of parsed.ops) {
              switch (op.op) {
                case 'SYNC': {
                  const [start, end] = op.range;
                  const rangeLength = end - start + 1;

                  const fetchedLength = op.items.length;
                  let onlineMemberCount = parsed.online_count ?? existing?.online_count ?? 0;

                  // Prevent lag lol
                  onlineMemberCount =
                    onlineMemberCount > 100
                      ? Math.ceil(onlineMemberCount * 0.25)
                      : onlineMemberCount;

                  currentItems.splice(start, rangeLength, ...op.items);

                  const isSpacebar =
                    (fetchedLength < rangeLength && end < onlineMemberCount - 1) ||
                    fetchedLength > rangeLength;

                  if (isSpacebar) {
                    if (!isPartial) {
                      isPartial = true;
                      const channelId = subscribedChannels.current[guildId];
                      if (channelId) {
                        setTimeout(() => {
                          requestMembers(guildId, channelId, [[0, onlineMemberCount + 1]]);
                        }, 0);
                      }
                    }

                    const filteredItems = currentItems.filter((item) => {
                      if (item.group?.id === 'offline') return false;
                      if (item.member?.presence?.status === 'offline') return false;
                      return true;
                    });

                    currentItems = filteredItems.slice(0, 100);
                  } else {
                    isPartial = false;
                  }
                  break;
                }
                case 'INSERT': {
                  currentItems.splice(op.index, 0, op.item);
                  break;
                }
                case 'UPDATE': {
                  currentItems[op.index] = op.item;
                  break;
                }
                case 'DELETE': {
                  currentItems.splice(op.index, 1);
                  break;
                }
                case 'INVALIDATE': {
                  const channelId = subscribedChannels.current[guildId];
                  if (channelId) {
                    requestMembers(guildId, channelId, [op.range]);
                  }
                  break;
                }
              }
            }

            return {
              ...prev,
              [guildId]: {
                id: parsed.id,
                items: currentItems,
                groups: parsed.groups,
                member_count: isPartial
                  ? currentItems.length
                  : (parsed.member_count ?? existing?.member_count ?? 0),
                partial: isPartial,
              },
            };
          });
          break;
        }

        case 'TYPING_START': {
          const parsed = TypingStartSchema.parse(data);
          const startTime = Date.now();

          setTypingUsers((prev) => ({
            ...prev,
            [parsed.channel_id]: {
              ...(prev[parsed.channel_id] ?? {}),
              [parsed.user_id]: startTime,
            },
          }));

          setTimeout(() => {
            setTypingUsers((currentTyping) => {
              const channel = currentTyping[parsed.channel_id];

              if (channel?.[parsed.user_id] === startTime) {
                const remainingTyping = Object.fromEntries(
                  Object.entries(channel).filter(([userId]) => userId !== parsed.user_id),
                );

                return {
                  ...currentTyping,
                  [parsed.channel_id]: remainingTyping,
                };
              }

              return currentTyping;
            });
          }, 10000);
          break;
        }

        case 'PRESENCE_UPDATE': {
          const parsed = PresenceUpdateSchema.parse(data);
          const userId = parsed.user.id;
          if (userId) {
            updatePresence(userId, parsed);
            setPresences((prev) => ({
              ...prev,
              [userId]: {
                ...(prev[userId] ?? {}),
                ...parsed,
                user: { ...(prev[userId]?.user ?? {}), ...parsed.user },
              },
            }));
          }
          break;
        }

        default:
          break;
      }
    },
    [requestMembers],
  );

  const startHeartbeat = useCallback((interval: number, ws: WebSocket) => {
    return window.setInterval(() => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({ op: 1, d: null }));
      }
    }, interval);
  }, []);

  const connect = useCallback(() => {
    const token = localStorage.getItem('selectedAuthorization') ?? '';
    const gatewayUrl = resumeGatewayUrl.current ?? localStorage.getItem('selectedGatewayUrl');

    if (gatewayUrl && gatewayUrl.length > 0 && token && token.length > 0) {
      const ws = new WebSocket(gatewayUrl);
      socket.current = ws;
      let heartbeatId: number | undefined;

      ws.onopen = () => {
        if (sessionId.current && lastSequence.current) {
          ws.send(
            JSON.stringify({
              op: 6,
              d: {
                token: token,
                session_id: sessionId.current,
                seq: lastSequence.current,
              },
            }),
          );
        } else {
          const identifyPayload = {
            op: 2,
            d: {
              token: token,
              capabilities: 125,
              properties: { os: 'Windows', browser: 'Chrome' },
            },
          };
          ws.send(JSON.stringify(identifyPayload));
        }
      };

      ws.onmessage = (event: MessageEvent<string>) => {
        if (getDeveloperSettings().log_gateway ?? false) {
          const raw: unknown = JSON.parse(event.data);
          if (typeof raw === 'object' && raw !== null && 'op' in raw) {
            const rawRecord = raw as Record<string, unknown>;
            const op = String(rawRecord.op);
            const eventType = typeof rawRecord.t === 'string' ? rawRecord.t : '';
            const summary = `Incoming OP ${op}${eventType ? ` (${eventType})` : ''}`;

            logger.info('GATEWAY', summary, raw);
          }
        }

        const payload = GatewayPayloadSchema.parse(JSON.parse(event.data));
        const { op, t, d, s } = payload;

        if (s) {
          lastSequence.current = s;
        }

        switch (op) {
          case 0:
            handleDispatch(t ?? '', d);
            break;
          case 7:
            ws.close();
            break;
          case 9:
            if (!d) {
              sessionId.current = null;
              lastSequence.current = null;
            }
            ws.close();
            break;
          case 10:
            heartbeatId = startHeartbeat(HelloSchema.parse(d).heartbeat_interval, ws);
            break;
          case 11:
            break;
        }
      };

      ws.onclose = (event) => {
        if (heartbeatId) clearInterval(heartbeatId);
        if (event.code !== 1000 && event.code !== 1001) {
          setTimeout(
            () => {
              setReconnectTrigger((prev) => prev + 1);
            },
            1000 + Math.random() * 2000,
          );
        }
      };

      return () => {
        if (heartbeatId) clearInterval(heartbeatId);
        ws.onclose = null;
        ws.close();
      };
    }

    return () => {
      /* no-op */
    };
    /*
      Discord clients determine that typing has stopped somewhat heuristically. If a message is sent, or if there has been no activity for 5 to 10 seconds, typing is assumed to have stopped.
    */
  }, [handleDispatch, startHeartbeat]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      cleanup();
    };
  }, [connect, reconnectCounter]);

  const gatewayProps: GatewayContextSchema = {
    isReady,
    guilds,
    user,
    relationships,
    user_settings: userSettings,
    sessions,
    presences,
    voiceStates,
    privateChannels,
    readStates,
    requestMembers,
    getMember,
    getMemberColor,
    getPresence,
    typingUsers,
    memberLists,
    memberListsRef,
    updateReadState,
    sendOp,
  };

  return <GatewayContext value={gatewayProps}>{children}</GatewayContext>;
};
