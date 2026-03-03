import { Image, Text, TouchableOpacity, View } from 'react-native';

import { styles } from './mobileHomeStyles';
import { getStatusColor, renderMaterialIcon } from './mobileHomeUtils';

interface MobileDmChannelProps {
  icon?: string;
  title: string;
  subtitle?: string;
  selected: boolean;
  status?: string;
  isTyping?: boolean;
  onClick: () => void;
  onClose?: () => void;
}

export function MobileDmChannel({
  icon,
  title,
  subtitle,
  selected,
  status,
  isTyping = false,
  onClick,
  onClose,
}: MobileDmChannelProps) {
  return (
    <TouchableOpacity
      style={[styles.dmCard, selected ? styles.dmCardSelected : null]}
      onPress={onClick}
      activeOpacity={0.85}
    >
      <View style={styles.dmCardIconWrap}>
        {icon ? (
          <Image source={{ uri: icon }} style={styles.dmCardAvatar} />
        ) : (
          <View style={styles.dmCardAvatarFallback}>
            <Text style={styles.dmCardAvatarFallbackText}>{title.charAt(0).toUpperCase()}</Text>
          </View>
        )}
        <View style={styles.dmCardStatusShell}>
          <View
            style={[
              styles.dmCardStatusDot,
              isTyping ? styles.dmCardTypingDot : { backgroundColor: getStatusColor(status) },
            ]}
          />
        </View>
      </View>

      <View style={styles.dmCardInfo}>
        <Text style={styles.dmCardTitle} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={styles.dmCardSubtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>

      {onClose ? (
        <TouchableOpacity
          style={styles.dmCloseButton}
          onPress={(event) => {
            event.stopPropagation();
            onClose();
          }}
        >
          <Text style={styles.materialIconText}>{renderMaterialIcon('close')}</Text>
        </TouchableOpacity>
      ) : null}
    </TouchableOpacity>
  );
}
