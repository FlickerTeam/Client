import { Image, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { clientPreviewImages, webAssets } from 'shared';

interface MobileLandingProps {
  onOpenClient: () => void;
  onOpenGithub: () => void;
  onOpenRegister: () => void;
}

export function MobileLanding({ onOpenClient, onOpenGithub, onOpenRegister }: MobileLandingProps) {
  const heroPreview = clientPreviewImages[0];

  return (
    <View style={styles.container}>
      <View style={styles.bottomShape} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
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
          {heroPreview ? (
            <Image source={{ uri: heroPreview }} style={styles.preview} resizeMode='cover' />
          ) : null}
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

        <View style={styles.featuresPanel}>
          <Text style={styles.featuresTitle}>WANT FEATURES? WE GOT EM.</Text>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Direct Messaging</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Voice (Confirmed on Oldcord)</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Emoji, role, user, mention auto-complete</Text>
          </View>
          <View style={styles.featureCard}>
            <Text style={styles.featureIcon}>✓</Text>
            <Text style={styles.featureText}>Account, Instance Switching</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.footerText}>© 2026 Flicker Team. Licensed under GPLv3.</Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#16161E',
  },
  bottomShape: {
    position: 'absolute',
    left: -120,
    right: -120,
    bottom: -220,
    height: 360,
    backgroundColor: '#BB9AF7',
    transform: [{ rotate: '-12deg' }],
  },
  scroll: {
    flex: 1,
  },
  content: {
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
  featuresPanel: {
    marginTop: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#3A3852',
    backgroundColor: '#1F2335',
    padding: 14,
    gap: 10,
  },
  featuresTitle: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.8,
    fontFamily: 'Inter',
  },
  featureCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#272A3B',
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#34374A',
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  featureIcon: {
    color: '#3BA55C',
    fontSize: 14,
    marginRight: 10,
    fontFamily: 'Inter',
  },
  featureText: {
    color: '#D5D7DF',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  footer: {
    marginTop: 20,
    alignItems: 'center',
  },
  footerText: {
    color: '#B8BAC3',
    fontSize: 12,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});
