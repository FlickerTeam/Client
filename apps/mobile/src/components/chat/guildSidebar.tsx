import { Image, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import type { Guild } from 'shared';

import { styles } from '../../pages/chatStyles';
import { renderMaterialIcon, resolveGuildIconUrl } from '../../utils/chatUtils';

interface MobileGuildSidebarProps {
  guilds: Guild[];
  cdnUrl: string;
  isHomeSelected: boolean;
  selectedGuildId?: string | null;
  onlineCount: number;
  onSelectHome: () => void;
  onSelectGuild: (guild: Guild) => void;
}

export function MobileGuildSidebar({
  guilds,
  cdnUrl,
  isHomeSelected,
  selectedGuildId,
  onlineCount,
  onSelectHome,
  onSelectGuild,
}: MobileGuildSidebarProps) {
  return (
    <View style={styles.serverSidebar}>
      <View style={styles.homeSection}>
        <TouchableOpacity style={styles.homeButtonWrapper} onPress={onSelectHome}>
          {isHomeSelected ? (
            <View style={styles.homeSelectionBackground}>
              <View style={styles.homeSelectionFade} />
            </View>
          ) : null}
          <View style={styles.homeIconContainer}>
            <Text style={styles.materialIconText}>{renderMaterialIcon('message')}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.onlineBlock}>
          <Text style={styles.onlineText}>{onlineCount} ONLINE</Text>
          <View style={styles.onlineDivider} />
        </View>
      </View>

      <ScrollView
        style={styles.serverList}
        contentContainerStyle={styles.serverListContent}
        showsVerticalScrollIndicator={false}
      >
        {guilds.map((guild) => {
          const guildIcon = resolveGuildIconUrl(guild.id, guild.icon, cdnUrl);
          const isSelected = selectedGuildId === guild.id;

          return (
            <TouchableOpacity
              key={guild.id}
              style={styles.serverButton}
              onPress={() => {
                onSelectGuild(guild);
              }}
            >
              <View style={[styles.serverCircle, isSelected ? styles.serverCircleSelected : null]}>
                {guildIcon ? (
                  <Image source={{ uri: guildIcon }} style={styles.serverImage} />
                ) : (
                  <Text style={styles.serverInitial}>{guild.name?.slice(0, 2) ?? '?'}</Text>
                )}
              </View>
            </TouchableOpacity>
          );
        })}

        <TouchableOpacity style={styles.serverButton}>
          <View style={styles.serverCircleOutline}>
            <Text style={styles.plusText}>+</Text>
          </View>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}
