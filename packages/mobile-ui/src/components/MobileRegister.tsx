import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import type { Instance } from 'shared';

export interface MobileRegisterProps {
  instances: Instance[];
  selectedInstanceUrl: string;
  customInstance: string;
  instanceStatus?: string | null;
  onSelectInstance: (url: string) => void;
  onChangeCustomInstance: (value: string) => void;
  username: string;
  email: string;
  password: string;
  onChangeUsername: (value: string) => void;
  onChangeEmail: (value: string) => void;
  onChangePassword: (value: string) => void;
  onSubmit: () => void;
  onOpenLogin: () => void;
  status?: string | null;
}

export function MobileRegister({
  instances,
  selectedInstanceUrl,
  customInstance,
  instanceStatus,
  onSelectInstance,
  onChangeCustomInstance,
  username,
  email,
  password,
  onChangeUsername,
  onChangeEmail,
  onChangePassword,
  onSubmit,
  onOpenLogin,
  status,
}: MobileRegisterProps) {
  return (
    <View style={styles.container}>
      <View style={styles.bottomShape} />
      <View style={styles.brand}>
        <Text style={styles.brandText}>FLICKER</Text>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <View style={styles.card}>
          <Text style={styles.title}>Register an account</Text>
          <Text style={styles.label}>Instance</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.instanceList}>
            {instances.map((instance) => (
              <TouchableOpacity
                key={instance.url}
                style={[
                  styles.instanceChip,
                  selectedInstanceUrl === instance.url ? styles.instanceChipActive : null,
                ]}
                onPress={() => {
                  onSelectInstance(instance.url);
                }}
              >
                <Text
                  style={[
                    styles.instanceChipText,
                    selectedInstanceUrl === instance.url ? styles.instanceChipTextActive : null,
                  ]}
                >
                  {instance.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[
                styles.instanceChip,
                selectedInstanceUrl === 'custom-instance' ? styles.instanceChipActive : null,
              ]}
              onPress={() => {
                onSelectInstance('custom-instance');
              }}
            >
              <Text
                style={[
                  styles.instanceChipText,
                  selectedInstanceUrl === 'custom-instance' ? styles.instanceChipTextActive : null,
                ]}
              >
                Custom Instance
              </Text>
            </TouchableOpacity>
          </ScrollView>
          {selectedInstanceUrl === 'custom-instance' ? (
            <>
              <Text style={styles.label}>Instance URL</Text>
              <TextInput
                value={customInstance}
                onChangeText={onChangeCustomInstance}
                autoCapitalize='none'
                placeholder='example.com'
                placeholderTextColor='#6D7280'
                style={styles.input}
              />
            </>
          ) : null}
          {instanceStatus ? <Text style={styles.status}>{instanceStatus}</Text> : null}
          <Text style={styles.label}>Username</Text>
          <TextInput
            value={username}
            onChangeText={onChangeUsername}
            autoCapitalize='none'
            placeholder='Username'
            placeholderTextColor='#6D7280'
            style={styles.input}
          />
          <Text style={styles.label}>Email</Text>
          <TextInput
            value={email}
            onChangeText={onChangeEmail}
            autoCapitalize='none'
            keyboardType='email-address'
            placeholder='Email'
            placeholderTextColor='#6D7280'
            style={styles.input}
          />
          <Text style={styles.label}>Password</Text>
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry
            placeholder='Password'
            placeholderTextColor='#6D7280'
            style={styles.input}
          />
          {status ? <Text style={styles.status}>{status}</Text> : null}
          <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
            <Text style={styles.primaryButtonText}>Register</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.linkButton} onPress={onOpenLogin}>
            <Text style={styles.linkText}>Already have an account?</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <Text style={styles.footerLine}>
          <Text style={styles.footerDark}>© 2026 - </Text>
          <Text style={styles.footerBright}>The Flicker Team</Text>
        </Text>
        <Text style={styles.footerLine}>
          <Text style={styles.footerDark}>Spacebar server code written by the </Text>
          <Text style={styles.footerBright}>Spacebar Team</Text>
        </Text>
      </View>
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
    bottom: -200,
    height: 340,
    backgroundColor: '#BB9AF7',
    transform: [{ rotate: '-12deg' }],
  },
  brand: {
    marginTop: 20,
    marginLeft: 16,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BB9AF7',
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  brandText: {
    color: '#BB9AF7',
    letterSpacing: 3,
    fontWeight: '800',
    fontSize: 11,
    fontFamily: 'Inter',
  },
  scroll: {
    flex: 1,
  },
  content: {
    minHeight: '100%',
    justifyContent: 'center',
    paddingHorizontal: 14,
    paddingBottom: 100,
    paddingTop: 20,
  },
  card: {
    backgroundColor: '#323449',
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: '#BB9AF7',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingTop: 18,
    paddingBottom: 14,
    shadowColor: '#A274F4',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 18,
    elevation: 8,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  label: {
    color: '#C3C6D0',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  instanceList: {
    marginBottom: 12,
  },
  instanceChip: {
    borderWidth: 1,
    borderColor: '#2E3140',
    borderRadius: 999,
    paddingVertical: 8,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  instanceChipActive: {
    borderColor: '#BB9AF7',
    backgroundColor: '#2A2538',
  },
  instanceChipText: {
    color: '#9FA4B3',
    fontSize: 12,
    fontFamily: 'Inter',
  },
  instanceChipTextActive: {
    color: '#E3D6FA',
  },
  input: {
    backgroundColor: '#1E1F22',
    borderWidth: 1,
    borderColor: '#2E3140',
    color: '#E3E4E8',
    borderRadius: 8,
    height: 44,
    paddingHorizontal: 14,
    marginBottom: 12,
    opacity: 0.85,
    fontFamily: 'Inter',
  },
  status: {
    color: '#949BA4',
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'Inter',
  },
  primaryButton: {
    backgroundColor: '#BB9AF7',
    borderRadius: 8,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#16161E',
    fontWeight: '700',
    fontSize: 15,
    fontFamily: 'Inter',
  },
  linkButton: {
    marginTop: 12,
    alignItems: 'center',
  },
  linkText: {
    color: '#7AA2F7',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  footer: {
    position: 'absolute',
    left: 10,
    right: 10,
    bottom: 12,
    alignItems: 'center',
    gap: 6,
  },
  footerLine: {
    fontSize: 11,
    fontFamily: 'Inter',
  },
  footerDark: {
    color: '#16161E',
  },
  footerBright: {
    color: '#E5E4D9',
    fontWeight: '600',
    fontFamily: 'Inter',
  },
});
