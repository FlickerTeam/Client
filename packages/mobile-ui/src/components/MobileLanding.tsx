import { useEffect, useState } from 'react';
import {
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { clientPreviewImages, webAssets } from 'shared';

interface MobileLandingProps {
  onOpenClient: () => void;
  onOpenGithub: () => void;
  onOpenRegister: () => void;
}

const patternDots = Array.from({ length: 260 }).map((_, index) => {
  const columns = 14;
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    id: `dot-${index.toString()}`,
    left: 10 + col * 30,
    top: 6 + row * 34,
  };
});

export function MobileLanding({ onOpenClient, onOpenGithub, onOpenRegister }: MobileLandingProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const previews = clientPreviewImages.length > 0 ? clientPreviewImages : [webAssets.flickerLogo];
  const isNative = Platform.OS !== 'web';

  useEffect(() => {
    if (!isNative || previews.length <= 1) return;

    const timer = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % previews.length);
    }, 3800);

    return () => {
      clearInterval(timer);
    };
  }, [isNative, previews.length]);

  if (!isNative) {
    return (
      <View style={styles.webContainer}>
        <View style={styles.webBottomShape} />

        <ScrollView style={styles.scroll} contentContainerStyle={styles.webContent}>
          <View style={styles.navbar}>
            <View style={styles.brandRow}>
              <Image source={{ uri: webAssets.flickerLogo }} style={styles.logo} />
              <Text style={styles.brandText}>FLICKER</Text>
            </View>
            <View style={styles.navIcons}>
              <TouchableOpacity style={styles.iconBtn} onPress={onOpenClient}>
                <Image source={{ uri: webAssets.arrow }} style={styles.navIcon} />
              </TouchableOpacity>
              <TouchableOpacity style={styles.iconBtn} onPress={onOpenGithub}>
                <Image source={{ uri: webAssets.github }} style={styles.navIcon} />
              </TouchableOpacity>
            </View>
          </View>

          <View style={styles.hero}>
            <Image
              source={{ uri: previews[activeIndex] ?? '' }}
              style={styles.preview}
              resizeMode='cover'
            />
            <View style={styles.heroWords}>
              <Text style={styles.wordMuted}>SLEEK</Text>
              <Text style={styles.wordAccent}>FAST</Text>
              <Text style={styles.wordMain}>MODERN</Text>
            </View>
            <Text style={styles.tagline}>THE ONLY CLIENT YOU NEED</Text>
            <Text style={styles.subtitle}>
              Flicker is designed to be a drop in daily driver for those wishing to jump ship from
              Discord to Spacebar/Oldcord instances.
            </Text>
          </View>

          <TouchableOpacity style={styles.primaryButton} onPress={onOpenClient}>
            <Text style={styles.primaryButtonText}>OPEN CLIENT</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onOpenRegister}>
            <Text style={styles.secondaryButtonText}>TRY IT HERE</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={styles.nativeContainer}>
      <View style={styles.nativePatternLayer} pointerEvents='none'>
        {patternDots.map((dot) => (
          <View key={dot.id} style={[styles.patternDot, { top: dot.top, left: dot.left }]} />
        ))}
      </View>

      <View style={styles.nativeHeader}>
        <Image source={{ uri: webAssets.flickerLogo }} style={styles.nativeLogo} />
        <Text style={styles.nativeBrandText}>FLICKER</Text>
      </View>

      <View style={styles.nativeHeroWrap}>
        <View style={styles.nativeHero}>
          <Image
            source={{ uri: previews[activeIndex] ?? '' }}
            style={styles.nativePreview}
            resizeMode='cover'
          />
          <View style={styles.nativeDots}>
            {previews.map((_, idx) => (
              <View
                key={`slide-dot-${idx.toString()}`}
                style={[styles.nativeDot, idx === activeIndex ? styles.nativeDotActive : null]}
              />
            ))}
          </View>
          <Text style={styles.nativeTagline}>The only client you need</Text>
          <Text style={styles.nativeSubtitle}>
            Flicker is a modern drop-in daily driver for Spacebar and Oldcord instances.
          </Text>
        </View>
      </View>

      <View style={styles.nativeActions}>
        <TouchableOpacity style={styles.nativePrimaryBtn} onPress={onOpenClient}>
          <Text style={styles.nativePrimaryBtnText}>Login</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.nativeGhostBtn} onPress={onOpenRegister}>
          <Text style={styles.nativeGhostBtnText}>Register</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1,
  },
  webContainer: {
    flex: 1,
    backgroundColor: '#16161E',
  },
  webBottomShape: {
    position: 'absolute',
    left: -120,
    right: -120,
    bottom: -220,
    height: 360,
    backgroundColor: '#BB9AF7',
    transform: [{ rotate: '-12deg' }],
  },
  webContent: {
    padding: 16,
    paddingTop: 20,
    paddingBottom: 90,
    gap: 16,
  },
  navbar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logo: {
    width: 34,
    height: 34,
  },
  brandText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '800',
    fontFamily: 'Inter',
  },
  navIcons: {
    flexDirection: 'row',
    gap: 10,
  },
  iconBtn: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  navIcon: {
    width: 22,
    height: 22,
    opacity: 0.8,
    tintColor: '#FFFFFF',
  },
  hero: {
    marginTop: 6,
    gap: 12,
  },
  preview: {
    width: '100%',
    height: 210,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#313347',
    shadowColor: '#000',
    shadowOpacity: 0.3,
    shadowRadius: 18,
    shadowOffset: { width: 0, height: 6 },
    elevation: 6,
  },
  heroWords: {
    position: 'absolute',
    top: 12,
    left: 14,
  },
  wordMuted: {
    color: '#FFFFFF',
    opacity: 0.4,
    fontWeight: '900',
    fontSize: 28,
    lineHeight: 28,
    fontFamily: 'Inter',
  },
  wordAccent: {
    color: '#BB9AF7',
    opacity: 0.75,
    fontWeight: '900',
    fontSize: 23,
    lineHeight: 24,
    fontFamily: 'Inter',
  },
  wordMain: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 34,
    lineHeight: 34,
    fontFamily: 'Inter',
  },
  tagline: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    letterSpacing: 1.6,
    fontFamily: 'Inter',
  },
  subtitle: {
    color: '#B5BAC1',
    fontSize: 14,
    lineHeight: 20,
    backgroundColor: '#1E1F2A',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#2E3140',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontFamily: 'Inter',
  },
  primaryButton: {
    marginTop: 10,
    borderRadius: 10,
    backgroundColor: '#BB9AF7',
    alignItems: 'center',
    paddingVertical: 12,
  },
  primaryButtonText: {
    color: '#16161E',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  secondaryButton: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#3C3F51',
    alignItems: 'center',
    paddingVertical: 12,
  },
  secondaryButtonText: {
    color: '#E3E4E8',
    fontWeight: '600',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  nativeContainer: {
    flex: 1,
    backgroundColor: '#1B1E2A',
    paddingTop: 20,
  },
  nativePatternLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  patternDot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#4A5263',
    opacity: 0.22,
  },
  nativeHeader: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 8,
    marginBottom: 10,
  },
  nativeLogo: {
    width: 64,
    height: 64,
    marginBottom: 6,
  },
  nativeBrandText: {
    color: '#FFFFFF',
    fontSize: 26,
    fontWeight: '900',
    letterSpacing: 2.2,
    fontFamily: 'Inter',
  },
  nativeHeroWrap: {
    flex: 1,
    marginHorizontal: 12,
  },
  nativeHero: {
    flex: 1,
    backgroundColor: '#2F3340',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#454A58',
    padding: 12,
  },
  nativePreview: {
    width: '100%',
    height: 186,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#444B5B',
  },
  nativeDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 10,
  },
  nativeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#586074',
  },
  nativeDotActive: {
    backgroundColor: '#BB9AF7',
    width: 14,
  },
  nativeTagline: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
    lineHeight: 28,
    textAlign: 'center',
    marginTop: 10,
    fontFamily: 'Inter',
  },
  nativeSubtitle: {
    color: '#C5CAD5',
    fontSize: 13,
    lineHeight: 18,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 4,
    fontFamily: 'Inter',
  },
  nativeActions: {
    marginTop: 10,
    marginHorizontal: 12,
    marginBottom: 16,
    gap: 10,
  },
  nativePrimaryBtn: {
    backgroundColor: '#BB9AF7',
    borderRadius: 10,
    alignItems: 'center',
    paddingVertical: 12,
  },
  nativePrimaryBtnText: {
    color: '#1B1E2A',
    fontSize: 15,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  nativeGhostBtn: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#4A5161',
    backgroundColor: 'rgba(24, 28, 38, 0.55)',
    alignItems: 'center',
    paddingVertical: 11,
  },
  nativeGhostBtnText: {
    color: '#E3E6ED',
    fontSize: 14,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
