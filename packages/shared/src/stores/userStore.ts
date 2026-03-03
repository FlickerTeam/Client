import { create } from 'zustand';

import type { Presence } from '../types/presences';
import type { User } from '../types/users';
import { get as apiGet } from '../utils/api';
import { logger } from '../utils/logger';

export type UserWithPresence = User & { presence?: Presence };

const pendingQueries: Partial<Record<string, Promise<UserWithPresence | null>>> = {};

export interface UserStore {
  users: Record<string, UserWithPresence>;
  upsertUsers: (newUsers: User[]) => void;
  updatePresence: (userId: string, newPresence: Presence) => void;
  getUser: (userId: string) => Promise<UserWithPresence | null>;
}

export const useUserStore = create<UserStore>((set, get) => ({
  users: {},
  upsertUsers: (newUsers) => {
    set((state) => {
      const nextUsers = { ...state.users };

      newUsers.forEach((user) => {
        nextUsers[user.id] = {
          ...nextUsers[user.id],
          ...user,
        } as UserWithPresence;
      });

      return { users: nextUsers };
    });
  },
  updatePresence: (userId, newPresence) => {
    set((state) => {
      const existingUser = state.users[userId];

      if (!existingUser) {
        return {
          users: {
            ...state.users,
            [userId]: { id: userId, presence: newPresence } as UserWithPresence,
          },
        };
      }

      return {
        users: {
          ...state.users,
          [userId]: {
            ...existingUser,
            presence: newPresence,
          },
        },
      };
    });
  },
  getUser: async (userId: string) => {
    const { users, upsertUsers } = get();

    if (users[userId]) {
      return users[userId];
    }

    const pending = pendingQueries[userId];
    if (pending) {
      return pending;
    }

    const fetchPromise = (async () => {
      try {
        const data = await apiGet<{
          user?: User;
        }>(`/users/${userId}/profile`);

        if (data.user) {
          upsertUsers([data.user]);

          return data.user as UserWithPresence;
        }

        logger.error(`USER_STORE`, `Failed to fetch user's profile from API!`);

        return null;
      } catch (error) {
        logger.error(`USER_STORE`, `Failed to fetch user's profile from API!`, error);
        return null;
      } finally {
        pendingQueries[userId] = undefined;
      }
    })();

    pendingQueries[userId] = fetchPromise;

    return fetchPromise;
  },
}));
