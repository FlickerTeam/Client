import { Image, Text, TouchableOpacity, View } from 'react-native';
import { sharedAssets, type User } from 'shared';

import { styles } from './mobileHomeStyles';
import { renderMaterialIcon } from './mobileHomeUtils';

interface MobileBottomNavProps {
  user?: User | null;
  cdnUrl: string;
}

export function MobileBottomNav({ user, cdnUrl }: MobileBottomNavProps) {
  return (
    <View style={styles.bottomNav}>
      <TouchableOpacity style={styles.bottomNavButton}>
        <Image source={{ uri: sharedAssets.flickerLogo }} style={styles.bottomLogoIcon} />
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavButton}>
        <Text style={styles.materialIconText}>{renderMaterialIcon('group')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavButton}>
        <Text style={styles.materialIconText}>{renderMaterialIcon('search')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavButton}>
        <Text style={styles.materialIconText}>{renderMaterialIcon('alternate_email')}</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.bottomNavButton}>
        <View style={styles.userAvatarWrap}>
          {user?.id && user.avatar ? (
            <Image
              source={{ uri: `${cdnUrl}/avatars/${user.id}/${user.avatar}.png` }}
              style={styles.userAvatar}
            />
          ) : (
            <View style={styles.userAvatarFallback}>
              <Text style={styles.userAvatarFallbackText}>
                {(user?.global_name ?? user?.username ?? 'U').charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
          <View style={styles.userStatusShell}>
            <View style={styles.userStatusDot} />
          </View>
        </View>
      </TouchableOpacity>
    </View>
  );
}
