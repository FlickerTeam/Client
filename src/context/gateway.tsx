import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import { GatewayProviderProps } from '../interfaces/gatewayproviderprops';
import { Guild } from '../interfaces/guild';

export interface GatewayContextType {
    isReady: boolean | null;
    guilds: Guild[] | [];
    user: any | null;
    user_settings: any;
    requestMembers?: (guildId: string, channelId: string, ranges?: number[][]) => void;
    typingUsers: Record<string, Record<string, number>>;
    memberLists?: Record<string, any>;
}

const GatewayContext = createContext<GatewayContextType | null>(null);

export const GatewayProvider = ({ children, ...props }: GatewayProviderProps) => {
    const socket: any = useRef(null);
    const [isReady, setIsReady] = useState(false);
    const [guilds, setGuilds] = useState([]);
    const [user, setUser] = useState(null);
    const [userSettings, setUserSettings] = useState(null);
    const [memberLists, setMemberLists] = useState<Record<string, any>>({});
    const [typingUsers, setTypingUsers] = useState<Record<string, Record<string, number>>>({});

    const requestMembers = useCallback((guildId: string, channelId: string, ranges = [[0, 99]]) => {
        if (socket.current?.readyState === WebSocket.OPEN) {
            socket.current.send(JSON.stringify({
                op: 14,
                d: {
                    guild_id: guildId,
                    channels: { [channelId]: ranges }
                }
            }));
        }
    }, []);

    const connect = () => {
        const token = localStorage.getItem("Authorization")!;
        const gatewayUrl = localStorage.getItem("selectedGatewayUrl")!;

        socket.current = new WebSocket(gatewayUrl);

        socket.current.onopen = () => {
            const identifyPayload = {
                op: 2,
                d: {
                    token: token,
                    capabilities: 125,
                    properties: { os: "Windows", browser: "Chrome" }
                }
            };
            socket.current.send(JSON.stringify(identifyPayload));
        };

        socket.current.onmessage = (event: any) => {
            const payload = JSON.parse(event.data);
            const { op, t, d } = payload;

            switch (op) {
                case 0:
                    handleDispatch(t, d);
                    break;
                case 10:
                    startHeartbeat(d.heartbeat_interval);
                    break;
            }
        };
        /*
        Discord clients determine that typing has stopped somewhat heuristically. If a message is sent, or if there has been no activity for 5 to 10 seconds, typing is assumed to have stopped.
        */
    };

    const handleDispatch = (type: string, data: any) => {
        switch (type) {
            case "READY":
                console.log("Gateway Ready", data);
                setUser(data.user);
                setUserSettings(data.user_settings);
                setGuilds(data.guilds);
                setIsReady(true);
                break;
            case "MESSAGE_CREATE":
                window.dispatchEvent(new CustomEvent('gateway_message', { detail: data }));

                setTypingUsers(prev => {
                    const channelTyping = { ...prev[data.channel_id] };

                    delete channelTyping[data.author.id];

                    return { ...prev, [data.channel_id]: channelTyping };
                });
                break;
            case "GUILD_CREATE":
                window.dispatchEvent(new CustomEvent('gateway_guild_create', { detail: data }));
                break;
            case "GUILD_MEMBER_LIST_UPDATE":
                setMemberLists(prev => {
                    const existing = prev[data.guild_id] || { ops: [], member_count: 0, groups: [] };

                    return {
                        ...prev,
                        [data.guild_id]: {
                            ...existing,
                            ...data,
                            groups: data.groups || existing.groups,
                            member_count: data.member_count ?? existing.member_count
                        }
                    };
                });
            break;
            case "TYPING_START":
                setTypingUsers(prev => {
                    const channelId = data.channel_id;
                    const userId = data.user_id;
                    
                    return {
                        ...prev,
                        [channelId]: {
                            ...(prev[channelId] || {}),
                            [userId]: Date.now()
                        }
                    };
                });
            break;
            default:
                break;
        }
    };

    const startHeartbeat = (interval: number) => {
        setInterval(() => {
            socket.current.send(JSON.stringify({ op: 1, d: null }));
        }, interval);
    };

    useEffect(() => {
        connect();

        return () => socket.current?.close();
    }, []);

    const gatewayProps: GatewayContextType = {
        isReady,
        guilds,
        user,
        user_settings: userSettings,
        requestMembers,
        typingUsers,
        memberLists
    };

    return (
        <GatewayContext.Provider value={gatewayProps}>
            {children}
        </GatewayContext.Provider>
    );
};

export const useGateway = () => {
    const context = useContext(GatewayContext);

    if (!context) {
        throw new Error("useGateway must be used within a GatewayProvider");
    }

    return context;
};