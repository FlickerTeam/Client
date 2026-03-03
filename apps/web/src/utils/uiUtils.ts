import type React from 'react';
import type { Guild, Member, Role } from 'shared';
import { type UserWithPresence, useUserStore } from 'shared';
import { get } from 'shared';
import { logger } from 'shared';

import { type ServerProfileProps } from '@/components/modals/serverProfile';
import { useGateway } from '@/context/gatewayContext';
import { useModal } from '@/layering/modalContext';
import { usePopup } from '@/layering/popupContext';

export const intToHex = (colorInt?: number): string => {
  if (!colorInt) return 'var(--bg-secondary)';
  return `#${colorInt.toString(16).padStart(6, '0')}`;
};

interface LocalEmoji {
  id: string;
  name: string;
  animated?: boolean;
  guild_id?: string | null;
  guild_name?: string;
  managed?: boolean;
  require_colons?: boolean;
  roles?: (string | Role)[];
  user_id?: string | null;
  groups?: Record<string, never> | null;
  is_private?: boolean;
}

export const useUiUtilityActions = (selectedGuild: Guild | null) => {
  const { openPopup } = usePopup();
  const getUser = useUserStore((state) => state.getUser);
  const { getMember, guilds } = useGateway();
  const { openModal, updateModal } = useModal();
  const { closePopup } = usePopup();

  const openUserProfile = async (e: React.MouseEvent<HTMLElement>, member: Member) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left - 310;
    const y = rect.top;

    const userId = member.user.id || member.id;

    if (!userId) return;

    const existingMember = selectedGuild ? getMember(selectedGuild.id, userId) : null;

    let userData: UserWithPresence | null = existingMember?.user || member.user || null;

    if (!userData || !userData.username) {
      try {
        userData = await getUser(userId);
      } catch (err) {
        logger.error('PROFILE', `Failed to hydrate user ${userId}`, err);
      }
    }

    const memberReal: Member = {
      ...(existingMember ?? member),
      id: userId,
      user: userData ?? member.user ?? ({ id: userId, username: 'Unknown' } as UserWithPresence),
      nick: existingMember?.nick || member.nick || null,
      roles: existingMember?.roles || member.roles || [],
      joined_at: existingMember?.joined_at || member.joined_at || new Date().toISOString(),
    };

    const roleIds = memberReal.roles ?? [];
    let memberRoles: Role[] = [];

    if (selectedGuild) {
      memberRoles = roleIds
        .map((id) => selectedGuild.roles.find((r) => r.id === id))
        .filter((role): role is Role => !!role);
    }

    openPopup('USER_PROFILE_POPOUT', {
      x,
      y,
      member: memberReal,
      roles: memberRoles.length === 0 ? null : memberRoles,
    });
  };

  const openFullProfile = async (user: Member) => {
    closePopup();

    openModal('SERVER_PROFILE', { member: user });

    try {
      const query = new URLSearchParams({
        with_mutual_guilds: 'true',
        with_mutual_friends: 'true',
      }).toString();

      const fullProfile = await get<ServerProfileProps>(`/users/${user.id}/profile?${query}`);

      updateModal<'SERVER_PROFILE'>({
        mutual_guilds: fullProfile.mutual_guilds,
        mutual_friends: fullProfile.mutual_friends,
        connected_accounts: fullProfile.connected_accounts,
        premium_since: fullProfile.premium_since,
        premium_type: fullProfile.premium_type,
      });
    } catch (error) {
      logger.error(`SERVER_PROFILE`, `Failed to fetch full user profile from API!`, error);
    }
  };

  const openEmojiPopout = (
    e: React.MouseEvent,
    emojiBase: { name: string; id?: string; unicode?: string; isBuiltin?: boolean },
  ) => {
    e.preventDefault();
    e.stopPropagation();

    const rect = e.currentTarget.getBoundingClientRect();
    const x = rect.left;
    const y = rect.top - 120;

    const cleanName = emojiBase.name.replace(/:/g, '');

    if (emojiBase.isBuiltin) {
      openPopup('EMOJI_DETAILS_POPOUT', {
        x,
        y,
        emoji: {
          id: '',
          name: cleanName,
          animated: false,
          guild_id: null,
          managed: false,
          require_colons: true,
          roles: [],
          user_id: null,
          groups: null,
        },
        guildName: 'Flicker Default Emojis',
        guildIcon: undefined,
        guildId: '',
        isPrivate: false,
        isBuiltin: true,
        unicode: emojiBase.unicode,
        sourceSubtext: 'A default emoji. You can use this emoji everywhere on Flicker.',
      });
      return;
    }

    if (!emojiBase.id) {
      return;
    }

    let emojiDetails: LocalEmoji | null = null;
    let localGuild: Guild | undefined = undefined;

    for (const g of guilds) {
      const found = g.emojis?.find((em) => em.id === emojiBase.id || em.name === cleanName);
      if (found) {
        emojiDetails = {
          ...found,
          roles: found.roles?.map((r: Role) => (typeof r === 'string' ? r : r.id)) || [],
          groups: (found.groups as Record<string, never> | null) || null,
          guild_id: g.id,
          guild_name: g.name,
          is_private: false,
        };
        localGuild = g;
        break;
      }
    }

    if (!emojiDetails) {
      logger.warn(
        'EMOJI_POPOUT',
        `Emoji ${emojiBase.id} not found in local guilds. Using fallback.`,
      );

      emojiDetails = {
        id: emojiBase.id,
        name: cleanName,
        animated: false,
        guild_id: null,
        guild_name: 'Unknown Guild',
        is_private: true,
      };
    }

    const mappedRoles: Role[] = (emojiDetails.roles ?? [])
      .map((roleId) => localGuild?.roles.find((r) => r.id === roleId))
      .filter((role): role is Role => !!role);

    openPopup('EMOJI_DETAILS_POPOUT', {
      x,
      y,
      emoji: {
        id: emojiDetails.id,
        name: emojiDetails.name || emojiBase.name,
        animated: emojiDetails.animated ?? false,
        guild_id: emojiDetails.guild_id,
        managed: emojiDetails.managed ?? false,
        require_colons: emojiDetails.require_colons ?? true,
        roles: mappedRoles,
        user_id: emojiDetails.user_id ?? null,
        groups: null,
      },
      guildName: emojiDetails.guild_name ?? 'Unknown Guild',
      guildIcon: localGuild?.icon ?? undefined,
      guildId: localGuild?.id ?? '',
      isPrivate: emojiDetails.is_private ?? true,
    });
  };

  return { openUserProfile, openFullProfile, openEmojiPopout };
};
