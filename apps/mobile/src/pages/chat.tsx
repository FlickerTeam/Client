import { useRef, useState } from 'react';
import { type GestureResponderEvent, Pressable, View } from 'react-native';
import type { Channel, Guild, Relationship, User } from 'shared';

import { MobileBottomNav } from '../components/chat/bottomNav';
import { MobileChannelSidebar } from '../components/chat/channelSidebar';
import { MobileGuildSidebar } from '../components/chat/guildSidebar';
import { MobileMainContent } from '../components/chat/mainContent';
import { type DmEntry, getCdnUrl, resolveAvatarUrl } from '../utils/chatUtils';
import { styles } from './chatStyles';

export interface ChatAppProps {
  guilds?: Guild[];
  relationships?: Relationship[];
  privateChannels?: Channel[];
  user?: User | null;
  selectedGuildId?: string | null;
  selectedChannelId?: string | null;
  onSelectGuild?: (guild: Guild | null) => void;
  onSelectChannel?: (channel: Channel | null) => void;
}

export const ChatApp = ({
  guilds = [],
  relationships = [],
  privateChannels = [],
  user,
  selectedGuildId,
  selectedChannelId,
  onSelectGuild,
  onSelectChannel,
}: ChatAppProps) => {
  const cdnUrl = getCdnUrl();
  const isHomeSelected = !selectedGuildId || selectedGuildId === '@me';
  const selectedGuild = guilds.find((guild) => guild.id === selectedGuildId) ?? null;
  const selectedChannelFromGuild =
    selectedGuild?.channels.find((channel) => channel.id === selectedChannelId) ?? null;
  const selectedPrivateChannel =
    privateChannels.find((channel) => channel.id === selectedChannelId) ?? null;
  const isGuildView = selectedGuild != null;
  const selectedChannel = isGuildView ? selectedChannelFromGuild : selectedPrivateChannel;
  const [isDrawerOpen, setIsDrawerOpen] = useState(selectedChannel == null);
  const isDrawerVisible = selectedChannel ? isDrawerOpen : true;
  const touchStartX = useRef<number | null>(null);

  const dmEntries: DmEntry[] = [];

  if (privateChannels.length > 0) {
    privateChannels.forEach((channel) => {
      const recipient = channel.recipients?.[0];
      const name = recipient?.global_name ?? recipient?.username ?? channel.name;

      if (!name) return;

      dmEntries.push({
        id: channel.id,
        name,
        subtitle: channel.status ?? undefined,
        avatarUrl: resolveAvatarUrl(recipient?.id, recipient?.avatar, cdnUrl),
        status: 'online',
        channel,
      });
    });
  } else {
    relationships.forEach((relationship) => {
      const relUser = relationship.user;
      dmEntries.push({
        id: relationship.id,
        name: relUser.global_name ?? relUser.username,
        subtitle: undefined,
        avatarUrl: resolveAvatarUrl(relUser.id, relUser.avatar, cdnUrl),
        status: relationship.status ?? undefined,
      });
    });
  }

  const onlineCount = relationships.filter(
    (relationship) => relationship.status === 'online',
  ).length;

  const handleSwipeStart = (event: GestureResponderEvent) => {
    touchStartX.current = event.nativeEvent.pageX;
  };

  const handleSwipeMove = (event: GestureResponderEvent) => {
    const startX = touchStartX.current;
    if (startX == null || isDrawerVisible) return;
    if (startX > 24) return;

    const deltaX = event.nativeEvent.pageX - startX;
    if (deltaX > 44) {
      setIsDrawerOpen(true);
      touchStartX.current = null;
    }
  };

  const handleSwipeEnd = () => {
    touchStartX.current = null;
  };

  return (
    <View style={styles.container}>
      <View style={styles.mainLayer}>
        {selectedChannel || selectedGuild ? (
          <MobileMainContent
            selectedChannel={selectedChannel}
            selectedGuild={selectedGuild}
            user={user}
            onBack={() => {
              setIsDrawerOpen(true);
            }}
          />
        ) : null}
      </View>

      {!isDrawerVisible && (
        <Pressable
          style={styles.leftSwipeArea}
          onTouchStart={handleSwipeStart}
          onTouchMove={handleSwipeMove}
          onTouchEnd={handleSwipeEnd}
        />
      )}

      {isDrawerVisible && (
        <>
          <Pressable
            style={styles.drawerScrim}
            onPress={() => {
              if (selectedChannel) {
                setIsDrawerOpen(false);
              }
            }}
          />
          <View style={styles.drawerShell}>
            <MobileGuildSidebar
              guilds={guilds}
              cdnUrl={cdnUrl}
              isHomeSelected={isHomeSelected}
              selectedGuildId={selectedGuildId}
              onlineCount={onlineCount}
              onSelectHome={() => {
                onSelectGuild?.(null);
                setIsDrawerOpen(true);
              }}
              onSelectGuild={(guild) => {
                onSelectGuild?.(guild);
                setIsDrawerOpen(true);
              }}
            />

            <MobileChannelSidebar
              selectedGuild={selectedGuild}
              dmEntries={dmEntries}
              selectedChannelId={selectedChannelId}
              onSelectChannel={(channel) => {
                onSelectChannel?.(channel);
                if (channel) {
                  setIsDrawerOpen(false);
                }
              }}
            />
          </View>
        </>
      )}

      {(!selectedChannel || isDrawerVisible) && <MobileBottomNav user={user} cdnUrl={cdnUrl} />}
    </View>
  );
};
