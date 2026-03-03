export const PermissionBits = {
  // General
  CREATE_INSTANT_INVITE: 1n << 0n,
  KICK_MEMBERS: 1n << 1n,
  BAN_MEMBERS: 1n << 2n,
  ADMINISTRATOR: 1n << 3n,
  MANAGE_CHANNELS: 1n << 4n,
  MANAGE_GUILD: 1n << 5n,
  CHANGE_NICKNAME: 1n << 26n,
  MANAGE_NICKNAMES: 1n << 27n,
  MANAGE_ROLES: 1n << 28n,
  MANAGE_WEBHOOKS: 1n << 29n,
  MANAGE_EMOJIS: 1n << 30n,
  VIEW_AUDIT_LOG: 1n << 7n,

  // Text

  READ_MESSAGES: 1n << 10n,
  SEND_MESSAGES: 1n << 11n,
  SEND_TSS_MESSAGES: 1n << 12n,
  MANAGE_MESSAGES: 1n << 13n,
  EMBED_LINKS: 1n << 14n,
  ATTACH_FILES: 1n << 15n,
  READ_MESSAGE_HISTORY: 1n << 16n,
  MENTION_EVERYONE: 1n << 17n,
  USE_EXTERNAL_EMOJIS: 1n << 18n,
  ADD_REACTIONS: 1n << 6n,

  // Voice

  CONNECT: 1n << 20n,
  SPEAK: 1n << 21n,
  MUTE_MEMBERS: 1n << 22n,
  DEAFEN_MEMBERS: 1n << 23n,
  MOVE_MEMBERS: 1n << 24n,
  USE_VAD: 1n << 25n,
};

export class PermissionHelper {
  private bitfield: bigint;
  private ownerOrAdmin: boolean;

  constructor(bitfield: string | number | bigint, ownerOrAdmin: boolean) {
    this.bitfield = BigInt(bitfield);
    this.ownerOrAdmin = ownerOrAdmin;
  }

  has(permission: bigint): boolean {
    if (this.ownerOrAdmin) {
      return true;
    }

    if ((this.bitfield & PermissionBits.ADMINISTRATOR) === PermissionBits.ADMINISTRATOR) {
      return true;
    }

    return (this.bitfield & permission) === permission;
  }

  get isOwnerOrAdmin() {
    return this.ownerOrAdmin;
  }
  get canManageRoles() {
    return this.has(PermissionBits.MANAGE_ROLES);
  }
  get canKick() {
    return this.has(PermissionBits.KICK_MEMBERS);
  }
  get canBan() {
    return this.has(PermissionBits.BAN_MEMBERS);
  }
  get canManageMessages() {
    return this.has(PermissionBits.MANAGE_MESSAGES);
  }
  get canAddReactions() {
    return this.has(PermissionBits.ADD_REACTIONS);
  }
  get canMentionEveryone() {
    return this.has(PermissionBits.MENTION_EVERYONE);
  }
  get canMessage() {
    return this.has(PermissionBits.SEND_MESSAGES);
  }
  get canSendAttachments() {
    return this.has(PermissionBits.ATTACH_FILES);
  }
}
