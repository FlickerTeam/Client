export const APP_ROUTES = {
  landing: '/',
  login: '/login',
  register: '/register',
  channels: '/channels',
  channelsMe: '/channels/@me',
} as const;

export type AppRouteId = 'landing' | 'login' | 'register' | 'channels_me' | 'channels_guild';

export interface ResolvedRoute {
  id: AppRouteId;
  guildId?: string;
  channelId?: string;
}

export const buildMeRoute = (channelId?: string | null): string =>
  channelId ? `${APP_ROUTES.channelsMe}/${channelId}` : APP_ROUTES.channelsMe;

export const buildGuildRoute = (guildId: string, channelId?: string | null): string =>
  channelId
    ? `${APP_ROUTES.channels}/${guildId}/${channelId}`
    : `${APP_ROUTES.channels}/${guildId}`;

export const resolveRouteFromPath = (pathname: string): ResolvedRoute => {
  if (pathname === APP_ROUTES.landing) return { id: 'landing' };
  if (pathname === APP_ROUTES.login) return { id: 'login' };
  if (pathname === APP_ROUTES.register) return { id: 'register' };

  const meMatch = /^\/channels\/@me(?:\/([^/]+))?$/.exec(pathname);
  if (meMatch) {
    return { id: 'channels_me', channelId: meMatch[1] };
  }

  const guildMatch = /^\/channels\/([^/]+)(?:\/([^/]+))?$/.exec(pathname);
  if (guildMatch) {
    return { id: 'channels_guild', guildId: guildMatch[1], channelId: guildMatch[2] };
  }

  return { id: 'landing' };
};
