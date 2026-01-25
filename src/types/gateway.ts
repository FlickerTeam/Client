interface GatewayContextType {
  isReady: boolean | null;
  guilds: Guild[] | [];
  user: any | null;
  relationships: any[] | [];
  user_settings: any;
  requestMembers?: (guildId: string, channelId: string, ranges?: number[][]) => void;
  typingUsers: Record<string, Record<string, number>>;
  memberLists?: Record<string, any>;
}

interface GatewayProviderProps {
  children?: React.ReactNode;
  isReady?: boolean;
  guilds?: Guild[];
  user?: any;
}
