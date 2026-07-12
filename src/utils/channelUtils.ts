import type { Channel } from '@/types/channel';

export const formatChannelName = (channel: Channel) => {
  if (channel.name) return channel.name;

  if (channel.type === 1) {
    return channel.recipients?.[0]?.username || 'Direct Message';
  }

  if (channel.recipients && channel.recipients.length > 0) {
    const maxVisible = 4;
    const visibleRecipients = channel.recipients.slice(0, maxVisible);
    const joinedNames = visibleRecipients.map((r) => r.username).join(', ');

    if (channel.recipients.length > maxVisible) {
      return `${joinedNames}...
      `;
    }
    return joinedNames;
  }

  return 'Group DM';
};
