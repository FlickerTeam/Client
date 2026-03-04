import { Platform } from 'react-native';
import type { Channel } from 'shared';

export interface DmEntry {
  id: string;
  name: string;
  subtitle?: string;
  avatarUrl?: string;
  status?: string;
  channel?: Channel;
}

export const getStatusColor = (status?: string): string => {
  switch (status) {
    case 'online':
      return '#23A55A';
    case 'idle':
      return '#F0B132';
    case 'dnd':
      return '#F23F43';
    default:
      return '#747F8D';
  }
};

export const getCdnUrl = (): string => {
  const maybeStorage = (
    globalThis as { localStorage?: { getItem: (key: string) => string | null } }
  ).localStorage;

  if (maybeStorage) {
    const selectedCdn = maybeStorage.getItem('selectedCdnUrl');
    if (selectedCdn) return selectedCdn;

    const legacyCdn = maybeStorage.getItem('cdnUrl');
    if (legacyCdn) return legacyCdn;
  }

  return '';
};

export const resolveAvatarUrl = (
  userId: string | null | undefined,
  avatar: string | null | undefined,
  cdnUrl: string,
): string | undefined => {
  if (!userId || !avatar) return undefined;
  return `${cdnUrl}/avatars/${userId}/${avatar}.png`;
};

export const resolveGuildIconUrl = (
  guildId: string | null | undefined,
  icon: string | null | undefined,
  cdnUrl: string,
): string | undefined => {
  if (!guildId || !icon) return undefined;
  return `${cdnUrl}/icons/${guildId}/${icon}.png`;
};

export const renderMaterialIcon = (name: string): string => {
  if (Platform.OS === 'web') return name;
  if (name === 'group') return '👥';
  if (name === 'search') return '🔍';
  if (name === 'alternate_email') return '@';
  if (name === 'add') return '+';
  if (name === 'more_vert') return '⋮';
  if (name === 'tag') return '#';
  if (name === 'volume_up') return '🔊';
  if (name === 'arrow_back') return '←';
  if (name === 'send') return '➤';
  if (name === 'chevron_right') return '›';
  if (name === 'expand_more') return '⌄';
  return name;
};
