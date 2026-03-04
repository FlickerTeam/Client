import { useState } from 'react';
import { ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Channel, Guild } from 'shared';
import { styles } from '../../pages/chatStyles';
import { type DmEntry, renderMaterialIcon } from '../../utils/chatUtils';
import { MobileDmChannel } from './dmChannel';

interface MobileChannelSidebarProps {
  selectedGuild?: Guild | null;
  dmEntries: DmEntry[];
  selectedChannelId?: string | null;
  onSelectChannel?: (channel: Channel | null) => void;
}

export function MobileChannelSidebar({
  selectedGuild,
  dmEntries,
  selectedChannelId,
  onSelectChannel,
}: MobileChannelSidebarProps) {
  const [collapsedCategories, setCollapsedCategories] = useState<Record<string, boolean>>({});
  const allChannels = [...(selectedGuild?.channels ?? [])].sort((a, b) => a.position - b.position);
  const categoryChannels = allChannels.filter((channel) => channel.type === 4);
  const categorizedChannels = allChannels.filter(
    (channel) =>
      channel.parent_id != null &&
      allChannels.some((candidate) => candidate.id === channel.parent_id),
  );
  const nonCategorizedChannels = allChannels.filter(
    (channel) => !categoryChannels.includes(channel) && !categorizedChannels.includes(channel),
  );

  const renderGuildChannel = (channel: Channel) => {
    if (channel.type !== 0 && channel.type !== 2) return null;

    const isSelected = selectedChannelId === channel.id;

    return (
      <TouchableOpacity
        key={channel.id}
        style={[styles.guildChannelRow, isSelected ? styles.guildChannelRowSelected : null]}
        onPress={() => {
          onSelectChannel?.(channel);
        }}
      >
        <Text style={styles.materialIconText}>
          {renderMaterialIcon(channel.type === 2 ? 'volume_up' : 'tag')}
        </Text>
        <Text numberOfLines={1} style={styles.guildChannelName}>
          {channel.name ?? (channel.type === 2 ? 'voice-channel' : 'text-channel')}
        </Text>
      </TouchableOpacity>
    );
  };

  const guildChannelsEmpty =
    allChannels.filter((channel) => channel.type === 0 || channel.type === 2).length === 0;

  return (
    <View style={styles.channelSidebar}>
      <View style={styles.headerRow}>
        {selectedGuild ? (
          <>
            <Text numberOfLines={1} style={styles.guildHeaderTitle}>
              {selectedGuild.name}
            </Text>
            <TouchableOpacity style={styles.headerAddButton}>
              <Text style={styles.materialIconText}>{renderMaterialIcon('more_vert')}</Text>
            </TouchableOpacity>
          </>
        ) : (
          <>
            <View style={styles.searchField}>
              <Text style={styles.searchText}>Find or start a conversation</Text>
            </View>
            <TouchableOpacity style={styles.headerAddButton}>
              <Text style={styles.materialIconText}>{renderMaterialIcon('add')}</Text>
            </TouchableOpacity>
          </>
        )}
      </View>

      <View style={styles.purpleGlow} />
      <View style={styles.dashedDivider} />

      <ScrollView
        style={styles.listArea}
        contentContainerStyle={styles.listAreaContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedGuild ? (
          <>
            <TouchableOpacity style={styles.guildInviteButton}>
              <Text style={styles.guildInviteText}>Invite Members</Text>
            </TouchableOpacity>

            <View style={styles.guildSectionHeader}>
              <Text style={styles.guildSectionTitle}>TEXT CHANNELS</Text>
              <TouchableOpacity>
                <Text style={styles.materialIconText}>{renderMaterialIcon('add')}</Text>
              </TouchableOpacity>
            </View>

            {nonCategorizedChannels.map((channel) => renderGuildChannel(channel))}

            {categoryChannels.map((category) => {
              const isCollapsed = collapsedCategories[category.id];
              const children = categorizedChannels
                .filter((channel) => channel.parent_id === category.id)
                .sort((a, b) => a.position - b.position);

              return (
                <View key={category.id} style={styles.guildCategoryBlock}>
                  <TouchableOpacity
                    style={styles.guildCategoryHeader}
                    onPress={() => {
                      setCollapsedCategories((prev) => ({
                        ...prev,
                        [category.id]: !prev[category.id],
                      }));
                    }}
                  >
                    <Text style={styles.materialIconText}>
                      {renderMaterialIcon(isCollapsed ? 'chevron_right' : 'expand_more')}
                    </Text>
                    <Text numberOfLines={1} style={styles.guildCategoryTitle}>
                      {(category.name ?? 'category').toUpperCase()}
                    </Text>
                  </TouchableOpacity>
                  {!isCollapsed && children.map((channel) => renderGuildChannel(channel))}
                </View>
              );
            })}

            {guildChannelsEmpty && <Text style={styles.guildEmptyText}>No channels yet.</Text>}
          </>
        ) : (
          <>
            <View style={styles.friendsRow}>
              <Text style={styles.materialIconText}>{renderMaterialIcon('group')}</Text>
              <Text style={styles.friendsText}>Friends</Text>
            </View>

            <Text style={styles.dmTitle}>Direct Messages</Text>
            {dmEntries.map((entry) => (
              <MobileDmChannel
                key={entry.id}
                icon={entry.avatarUrl}
                title={entry.name}
                subtitle={entry.subtitle}
                selected={selectedChannelId === entry.id}
                status={entry.status}
                isTyping={false}
                onClick={() => {
                  onSelectChannel?.(entry.channel ?? null);
                }}
              />
            ))}
          </>
        )}
      </ScrollView>
    </View>
  );
}
