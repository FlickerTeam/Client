import { useMemo } from 'react';
import { PermissionBits, PermissionHelper } from 'shared';

import { useGateway } from '@/context/gatewayContext';

export const usePermissions = (guildId?: string, channelId?: string) => {
  const { user, guilds, getMember } = useGateway();

  return useMemo(() => {
    const isDM = !guildId || guildId === '0';

    if (isDM || !user) {
      const dmPermissions =
        PermissionBits.READ_MESSAGES |
        PermissionBits.SEND_MESSAGES |
        PermissionBits.EMBED_LINKS |
        PermissionBits.ATTACH_FILES |
        PermissionBits.READ_MESSAGE_HISTORY |
        PermissionBits.ADD_REACTIONS;

      return new PermissionHelper(dmPermissions, false);
    }

    const guild = guilds.find((x) => x.id === guildId);

    if (!guild) return new PermissionHelper(0n, false);

    const thatsME = getMember?.(guildId, user.id);
    const isOwner = guild.owner_id === user.id;

    const everyoneRole = guild.roles.find((r) => r.id === guildId);
    let permissions = BigInt(everyoneRole?.permissions ?? 0n);

    if (thatsME) {
      thatsME.roles.forEach((roleId) => {
        const role = guild.roles.find((r) => r.id === roleId);
        if (role) permissions |= BigInt(role.permissions);
      });
    }

    const channel = guild.channels?.find((c) => c.id === channelId);

    if (channel?.permission_overwrites) {
      const overwrites = channel.permission_overwrites;

      const everyoneOverwrite = overwrites.find((o) => o.id === guildId);
      if (everyoneOverwrite) {
        permissions &= ~BigInt(everyoneOverwrite.deny);
        permissions |= BigInt(everyoneOverwrite.allow);
      }

      let roleAllow = 0n;
      let roleDeny = 0n;
      if (thatsME) {
        thatsME.roles.forEach((roleId) => {
          const roleOverwrite = overwrites.find((o) => o.id === roleId);
          if (roleOverwrite) {
            roleAllow |= BigInt(roleOverwrite.allow);
            roleDeny |= BigInt(roleOverwrite.deny);
          }
        });
      }
      permissions &= ~roleDeny;
      permissions |= roleAllow;

      const memberOverwrite = overwrites.find((o) => o.id === user.id);
      if (memberOverwrite) {
        permissions &= ~BigInt(memberOverwrite.deny);
        permissions |= BigInt(memberOverwrite.allow);
      }
    }

    return new PermissionHelper(permissions, isOwner);
  }, [guildId, channelId, guilds, user, getMember]);
};
