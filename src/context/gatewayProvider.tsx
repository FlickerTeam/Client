import { type ReactNode, useCallback, useEffect, useRef, useState } from 'react';

import {
  GatewayPayloadSchema,
  GuildMemberListUpdateSchema,
  HelloSchema,
  MessageCreateSchema,
  ReadyEventSchema,
  TypingStartSchema,
} from '@/types/gateway';
import type { GatewayContextSchema } from '@/types/gatewayContext';
import type { Guild } from '@/types/guilds';
import type { Relationship } from '@/types/relationship';
import type { User } from '@/types/users';
import type { UserSettings } from '@/types/userSettings';

import { GatewayContext } from './gatewayContext';

interface GatewayProviderProps {
  children?: ReactNode;
  isReady?: boolean;
  guilds?: Guild[];
  user?: User;
}

export const GatewayProvider = ({ children }: GatewayProviderProps) => {
  const socket = useRef<WebSocket | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [guilds, setGuilds] = useState<Guild[]>([]);
  const [user, setUser] = useState<User | null>(null);
  const [relationships, setRelationships] = useState<Relationship[]>([]);
  const [userSettings, setUserSettings] = useState<UserSettings | null>(null);
  const [memberLists, setMemberLists] = useState<GatewayContextSchema['memberLists'] | undefined>(
    {},
  );
  const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, number>>>({});

  const requestMembers = useCallback((guildId: string, channelId: string, ranges = [[0, 99]]) => {
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

  const connect = useCallback(() => {
    const token = localStorage.getItem('Authorization') ?? '';
    const gatewayUrl = localStorage.getItem('selectedGatewayUrl');

    if (gatewayUrl && gatewayUrl.length > 0) {
      socket.current = new WebSocket(gatewayUrl);

      socket.current.onopen = () => {
        const identifyPayload = {
          op: 2,
          d: {
            token: token,
            capabilities: 125,
            properties: { os: 'Windows', browser: 'Chrome' },
          },
        };
        socket.current?.send(JSON.stringify(identifyPayload));
      };

      socket.current.onmessage = (event: MessageEvent<string>) => {
        const payload = GatewayPayloadSchema.parse(JSON.parse(event.data));
        const { op, t, d } = payload;

        switch (op) {
          case 0:
            handleDispatch(t ?? '', d);
            break;
          case 10:
            startHeartbeat(HelloSchema.parse(d).heartbeat_interval);
            break;
        }
      };
    }
    /*
        Discord clients determine that typing has stopped somewhat heuristically. If a message is sent, or if there has been no activity for 5 to 10 seconds, typing is assumed to have stopped.
        */
  }, []);

  const handleDispatch = (type: string, data: unknown) => {
    switch (type) {
      case 'READY': {
        const parsed = ReadyEventSchema.parse(data);
        setUser(parsed.user);
        setRelationships(parsed.relationships);
        setUserSettings(parsed.user_settings);
        setGuilds(parsed.guilds);
        setIsReady(true);
        break;
      }

      case 'MESSAGE_CREATE': {
        const parsed = MessageCreateSchema.parse(data);
        window.dispatchEvent(new CustomEvent('gateway_message', { detail: parsed }));

        setTypingUsers((prev) => {
          const channelTyping = { ...prev[parsed.channel_id] };
          // eslint-disable-next-line @typescript-eslint/no-unused-vars -- Idk how to not remove the _ while making linter happy lol
          const { [parsed.author.id ?? '']: _, ...remainingTyping } = channelTyping;
          return { ...prev, [parsed.channel_id]: remainingTyping };
        });
        break;
      }

      case 'GUILD_CREATE':
        window.dispatchEvent(new CustomEvent('gateway_guild_create', { detail: data }));
        break;
      case 'GUILD_DELETE':
        window.dispatchEvent(new CustomEvent('gateway_guild_delete', { detail: data }));
        break;

      case 'GUILD_MEMBER_LIST_UPDATE': {
        const parsed = GuildMemberListUpdateSchema.parse(data);
        setMemberLists((prev) => {
          const existing = prev?.[parsed.guild_id] ?? {
            ops: [],
            member_count: 0,
            groups: [],
          };
          return {
            ...prev,
            [parsed.guild_id]: {
              ...existing,
              ...parsed,
              groups: parsed.groups,
              member_count: parsed.member_count ?? existing.member_count,
            },
          };
        });
        break;
      }

      case 'RELATIONSHIP_ADD':
        window.dispatchEvent(new CustomEvent('gateway_relationship_add', { detail: data }));
        break;
      case 'RELATIONSHIP_REMOVE':
        window.dispatchEvent(new CustomEvent('gateway_relationship_remove', { detail: data }));
        break;

      case 'TYPING_START': {
        const parsed = TypingStartSchema.parse(data);
        setTypingUsers((prev) => ({
          ...prev,
          [parsed.channel_id]: {
            ...(prev[parsed.channel_id] ?? {}),
            [parsed.user_id]: Date.now(),
          },
        }));
        break;
      }

      default:
        break;
    }
  };

  const startHeartbeat = (interval: number) => {
    setInterval(() => {
      socket.current?.send(JSON.stringify({ op: 1, d: null }));
    }, interval);
  };

  useEffect(() => {
    connect();

    return () => socket.current?.close();
  }, [connect]);

  const gatewayProps: GatewayContextSchema = {
    isReady,
    guilds,
    user,
    relationships,
    user_settings: userSettings,
    requestMembers,
    typingUsers,
    memberLists,
  };

  return <GatewayContext value={gatewayProps}>{children}</GatewayContext>;
};
