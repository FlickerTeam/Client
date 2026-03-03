import './dfm.css';

import { type JSX, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { Channel } from 'shared';
import type { Guild, Member, Role } from 'shared';
import type { User } from 'shared';
import { useUserStore } from 'shared';
import { get, post } from 'shared';
import { logger } from 'shared';

import { useConfig } from '@/context/configContext';
import { useGateway } from '@/context/gatewayContext';
import { parseTwemojiWithOverrides, resolveShortcodeFromUnicode } from '@/utils/emoji';
import { useUiUtilityActions } from '@/utils/uiUtils';

export interface InviteData {
  code: string;
  guild?: {
    id: string;
    name: string;
    icon?: string;
    banner?: string;
    description?: string;
    verification_level?: number;
    features?: string[];
  };
  channel?: {
    id: string;
    name: string;
    type: number;
  };
  inviter?: {
    id: string;
    username: string;
    avatar?: string;
    discriminator: string;
  };
  approximate_presence_count?: number;
  approximate_member_count?: number;
}

export const MemberMention = ({
  guild_id,
  user_id,
}: {
  guild_id: string | undefined;
  user_id: string;
}): JSX.Element => {
  const { getMember, guilds, getPresence } = useGateway();
  const getUser = useUserStore((state) => state.getUser);
  const contextGuild = guilds.find((x: Guild) => x.id === guild_id);

  const { openUserProfile } = useUiUtilityActions(contextGuild ?? null);
  const [fetchedUser, setFetchedUser] = useState<User | null>(null);

  const member = getMember(guild_id, user_id);

  useEffect(() => {
    let isMounted = true;

    const loadUser = async () => {
      const user = await getUser(user_id);

      if (isMounted && user) {
        setFetchedUser(user as User);
      }
    };

    void loadUser();
    return () => {
      isMounted = false;
    };
  }, [user_id, getUser]);

  const name: string = member?.nick || fetchedUser?.global_name || fetchedUser?.username || '...';

  let fakeMemberObj: Member = {
    id: user_id,
    user: {
      id: user_id,
      username: 'someone',
      discriminator: '0000',
    },
    roles: [],
    joined_at: new Date().toISOString(),
  };

  if (fetchedUser) {
    const presence = getPresence(fetchedUser.id);
    const status = presence?.status ?? 'offline';

    fakeMemberObj = {
      id: fetchedUser.id,
      user: fetchedUser,
      presence: {
        user: fetchedUser,
        status: status,
        activities: [],
      },
      joined_at: new Date().toISOString(),
      roles: [],
    };
  }

  return (
    <strong
      onClick={(e) => {
        if (fetchedUser) {
          void openUserProfile(e, member ?? fakeMemberObj);
        }
      }}
      className='inline-msg-mention'
    >
      @{name}
    </strong>
  );
};

export const RoleMention = ({
  guild_id,
  role_id,
}: {
  guild_id: string | undefined;
  role_id: string;
}): JSX.Element => {
  const render = (role: Role | undefined) => {
    return <strong>@{role?.name ?? 'unknown'}</strong>;
  };

  const { guilds } = useGateway();
  const guild: Guild | undefined = guilds.find((guild) => guild.id == guild_id);
  if (!guild) return render(undefined);

  const role: Role | undefined = guild.roles.find((role) => role.id === role_id);
  return render(role);
};

export const EveryoneMention = (): JSX.Element => {
  return <strong>@everyone</strong>;
};

export const HereMention = (): JSX.Element => {
  return <strong>@here</strong>;
};

export const ChannelMention = ({
  guild_id,
  channel_id,
}: {
  guild_id: string | undefined;
  channel_id: string;
}): JSX.Element => {
  const navigate = useNavigate();
  const render = (channel: Channel | undefined) => {
    return (
      <strong
        className='inline-msg-mention'
        onClick={(e) => {
          e.stopPropagation();
          void navigate(`/channels/${channel?.guild_id ?? ''}/${channel?.id ?? ''}`);
        }}
      >
        #{channel?.name ?? 'unknown'}
      </strong>
    );
  };

  const { guilds } = useGateway();
  const guild: Guild | undefined = guilds.find((guild) => guild.id == guild_id);
  if (!guild) return render(undefined);

  const channel: Channel | undefined = guild.channels.find((channel) => channel.id === channel_id);
  return render(channel);
};

export const EmojiMention = ({
  name,
  emoji_id,
  unicode,
}: {
  name?: string;
  emoji_id?: string;
  unicode?: string;
}): JSX.Element => {
  const { guilds } = useGateway();
  const contextGuild = guilds.find((g) => g.emojis?.some((e) => e.id === emoji_id));
  const { openEmojiPopout } = useUiUtilityActions(contextGuild || null);
  const { cdnUrl } = useConfig();

  // Get guild emojis
  if (emoji_id) {
    const invalid = /\D/.test(emoji_id);
    if (invalid) return <></>; //Invalid and probably dangerous. Do not render or just a fucking idiot made these.

    const emojiUrl = `${cdnUrl ?? ''}/emojis/${emoji_id}.png`;

    return (
      <img
        className='emoji'
        alt={name ?? ''}
        src={emojiUrl}
        onClick={(e) => {
          openEmojiPopout(e, { name: name ?? '', id: emoji_id });
        }}
      />
    );
  }

  // Get built-in Unicode Emojis
  const twemojiHtml = parseTwemojiWithOverrides(unicode ?? '', { className: 'emoji' });
  const srcMatch = /<img[^>]*\ssrc="([^"]+)"[^>]*>/i.exec(twemojiHtml);
  const src = srcMatch?.[1];

  if (!unicode || !src) {
    return <>{unicode ?? ''}</>;
  }

  return (
    <img
      className='emoji'
      alt={unicode}
      src={src}
      onClick={(e) => {
        openEmojiPopout(e, {
          name: name ?? resolveShortcodeFromUnicode(unicode) ?? unicode,
          unicode,
          isBuiltin: true,
        });
      }}
    />
  );
};

export const OffsiteMedia = ({ src }: { src: string }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const type = src.toLowerCase().endsWith('.gif') ? 'gif' : 'img';

  return (
    <div className='gif-embed-container'>
      <img
        src={`https://staging.oldcordapp.com/proxy/${encodeURIComponent(src)}`} //you're welcome. make this use the instance configured's proxy ASAP.
        alt={type.toUpperCase()}
        className={`chat-gif-render ${isExpanded ? 'is-big' : ''}`}
        loading='lazy'
        onError={(e) => (e.currentTarget.style.display = 'none')}
        onClick={() => {
          setIsExpanded(!isExpanded);
        }}
      />
    </div>
  );
};

export const InviteMention = ({ code }: { code: string }): JSX.Element => {
  const { guilds } = useGateway();
  const navigate = useNavigate();
  const [inviteData, setInviteData] = useState<InviteData | null>(null);
  const [loading, setLoading] = useState(true);
  const { cdnUrl } = useConfig();

  useEffect(() => {
    let isMounted = true;

    const fetchInvite = async () => {
      try {
        const response = await get<InviteData>(`/invites/${code}?with_counts=true`);

        if (isMounted) {
          setInviteData(response);
        }
      } catch (err) {
        logger.error(`INVITE_MENTION`, `Failed to fetch invite: ${code}`, err);
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    void fetchInvite();
    return () => {
      isMounted = false;
    };
  }, [code]);

  if (loading) {
    return (
      <div className='invite-card invite-card-loading'>
        <div className='invite-card-inner'>
          <div className='invite-header'>LOADING INVITE...</div>
          <div className='invite-body'>
            <div className='invite-guild-icon-placeholder loading-shimmer' />
            <div className='invite-text'>
              <div className='loading-bar long' />
              <div className='loading-bar short' />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!inviteData) {
    return (
      <div className='invite-card invite-card-error'>
        <div className='invite-card-inner'>
          <div className='invite-header'>YOU WERE SENT AN INVITE, BUT...</div>
          <div className='invite-body no-gap'>
            <span className='material-symbols-rounded invite-error-icon'>close</span>
            <div className='invite-text'>
              <div className='invite-error-title'>Invalid Invite</div>
              <div className='invite-error-sub'>Try sending a new invite!</div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const joinAndGotoServer = async (code: string) => {
    try {
      const response = await post<{
        guild_id?: string;
        guild?: Guild;
      }>(`/invites/${code}`, {});
      const guild_id = response.guild_id || response.guild?.id;

      if (guild_id) {
        void navigate(`/channels/${guild_id}`);
      }
    } catch (err) {
      setInviteData(null);

      logger.error(`INVITE_MENTION`, `Failed to join server from invite: ${code}`, err);
    }
  };

  const guild = inviteData.guild;
  const bannerUrl = guild?.banner
    ? `${cdnUrl ?? ''}/banners/${guild.id}/${guild.banner}.png`
    : null;
  const iconUrl = guild?.icon ? `${cdnUrl ?? ''}/icons/${guild.id}/${guild.icon}.png` : null;
  const inviterAvatar = inviteData.inviter?.avatar
    ? `${cdnUrl ?? ''}/avatars/${inviteData.inviter.id}/${inviteData.inviter.avatar}.png`
    : null;
  const inServerAlready = guilds.some((g: Guild) => g.id === guild?.id);

  return (
    <div className='invite-card'>
      {bannerUrl && (
        <div className='invite-banner' style={{ backgroundImage: `url(${bannerUrl})` }} />
      )}
      <div className='invite-card-inner'>
        <div className='invite-header'>{`YOU'VE BEEN INVITED TO JOIN A SERVER`}</div>
        <div className='invite-body'>
          <div className='invite-guild-info'>
            {iconUrl ? (
              <img src={iconUrl} className='invite-guild-icon' alt='' />
            ) : (
              <div className='invite-guild-icon-placeholder'>{guild?.name.charAt(0) ?? ''}</div>
            )}
            <div className='invite-text'>
              <div className='invite-guild-name'>{guild?.name ?? ''}</div>
              <div className='invite-channel-row'>
                <span className='invite-channel-name'>#{inviteData.channel?.name}</span>
              </div>

              {inviteData.inviter && (
                <div className='invite-inviter'>
                  {inviterAvatar && <img src={inviterAvatar} alt='' />}
                  <span>Invited by {inviteData.inviter.username}</span>
                </div>
              )}
            </div>
          </div>
          <button
            className='invite-join-button'
            onClick={() => {
              if (inServerAlready) {
                void navigate(`/channels/${guild?.id ?? ''}`);
              } else {
                void joinAndGotoServer(code);
              }
            }}
          >
            {inServerAlready ? 'Joined' : 'Join'}
          </button>
        </div>
      </div>
    </div>
  );
};
