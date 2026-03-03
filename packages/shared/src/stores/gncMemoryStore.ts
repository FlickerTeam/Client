import { create } from 'zustand';

interface GuildChannelMemoryStore {
  currentGuildId: string | null;
  currentChannelId: string | null;

  setGuild: (guildId: string | null) => void;
  setChannel: (channelId: string | null) => void;
  setBoth: (guildId: string | null, channelId: string | null) => void;

  clear: () => void;
}

export const useGuildChannelMemoryStore = create<GuildChannelMemoryStore>((set) => ({
  currentGuildId: null,
  currentChannelId: null,

  setGuild: (guildId) => {
    set(() => ({
      currentGuildId: guildId,
    }));
  },

  setChannel: (channelId) => {
    set(() => ({
      currentChannelId: channelId,
    }));
  },

  setBoth: (guildId, channelId) => {
    set(() => ({
      currentGuildId: guildId,
      currentChannelId: channelId,
    }));
  },

  clear: () => {
    set(() => ({
      currentGuildId: null,
      currentChannelId: null,
    }));
  },
}));
