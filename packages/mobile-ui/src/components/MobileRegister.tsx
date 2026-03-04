import { useMemo, useState } from 'react';
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

const patternDots = Array.from({ length: 180 }).map((_, index) => {
  const columns = 12;
  const col = index % columns;
  const row = Math.floor(index / columns);
  return {
    id: `dot-${index.toString()}`,
    left: 14 + col * 32,
    top: 12 + row * 44,
  };
});

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
  const [isInstanceMenuOpen, setIsInstanceMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const selectedInstanceLabel = useMemo(() => {
    if (selectedInstanceUrl === 'custom-instance') return 'Custom Instance';
    return instances.find((instance) => instance.url === selectedInstanceUrl)?.name ?? 'Select';
  }, [instances, selectedInstanceUrl]);

  const resolveStatusTone = (message: string | null | undefined) => {
    if (!message) return null;
    const lowered = message.toLowerCase();
    if (lowered.includes('invalid') || lowered.includes('error') || lowered.includes('network')) {
      return styles.statusError;
    }
    if (lowered.includes('online') || lowered.includes('valid')) {
      return styles.statusValid;
    }
    return styles.statusNeutral;
  };

  return (
    <View style={styles.container}>
      <View style={styles.patternLayer} pointerEvents='none'>
        {patternDots.map((dot) => (
          <View key={dot.id} style={[styles.dot, { top: dot.top, left: dot.left }]} />
        ))}
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Register an account</Text>

        <Text style={styles.label}>Instance</Text>
        <TouchableOpacity
          style={styles.selectTrigger}
          onPress={() => {
            setIsInstanceMenuOpen((prev) => !prev);
          }}
        >
          <Text style={styles.selectTriggerText}>{selectedInstanceLabel}</Text>
          <Text style={styles.selectTriggerIcon}>{isInstanceMenuOpen ? '▴' : '▾'}</Text>
        </TouchableOpacity>

        {isInstanceMenuOpen ? (
          <View style={styles.selectMenu}>
            {instances.map((instance) => (
              <TouchableOpacity
                key={instance.url}
                style={styles.selectOption}
                onPress={() => {
                  onSelectInstance(instance.url);
                  setIsInstanceMenuOpen(false);
                }}
              >
                <Text
                  style={[
                    styles.selectOptionText,
                    selectedInstanceUrl === instance.url ? styles.selectOptionTextActive : null,
                  ]}
                >
                  {instance.name}
                </Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={styles.selectOption}
              onPress={() => {
                onSelectInstance('custom-instance');
                setIsInstanceMenuOpen(false);
              }}
            >
              <Text
                style={[
                  styles.selectOptionText,
                  selectedInstanceUrl === 'custom-instance' ? styles.selectOptionTextActive : null,
                ]}
              >
                Custom Instance
              </Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {selectedInstanceUrl === 'custom-instance' ? (
          <>
            <Text style={styles.label}>Instance URL</Text>
            <TextInput
              value={customInstance}
              onChangeText={onChangeCustomInstance}
              autoCapitalize='none'
              placeholder='example.com'
              placeholderTextColor='#777C87'
              style={styles.input}
            />
          </>
        ) : null}

        {instanceStatus ? (
          <Text style={[styles.status, resolveStatusTone(instanceStatus)]}>{instanceStatus}</Text>
        ) : null}

        <Text style={styles.label}>Username</Text>
        <TextInput
          value={username}
          onChangeText={onChangeUsername}
          autoCapitalize='none'
          placeholder='Username'
          placeholderTextColor='#777C87'
          style={styles.input}
        />

        <Text style={styles.label}>Email</Text>
        <TextInput
          value={email}
          onChangeText={onChangeEmail}
          autoCapitalize='none'
          keyboardType='email-address'
          placeholder='Email'
          placeholderTextColor='#777C87'
          style={styles.input}
        />

        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordRow}>
          <TextInput
            value={password}
            onChangeText={onChangePassword}
            secureTextEntry={!showPassword}
            placeholder='Password'
            placeholderTextColor='#777C87'
            style={styles.passwordInput}
          />
          <TouchableOpacity
            style={styles.passwordToggle}
            onPress={() => {
              setShowPassword((prev) => !prev);
            }}
          >
            <Text style={styles.passwordToggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        {status ? <Text style={[styles.status, resolveStatusTone(status)]}>{status}</Text> : null}

        <TouchableOpacity
          style={styles.agreementRow}
          onPress={() => {
            setAcceptedTerms((prev) => !prev);
          }}
        >
          <View style={[styles.agreementBox, acceptedTerms ? styles.agreementBoxChecked : null]} />
          <Text style={styles.agreementText}>
            I have read the Terms and Conditions of this instance.
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.primaryButton} onPress={onSubmit}>
          <Text style={styles.primaryButtonText}>Register</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkButton} onPress={onOpenLogin}>
          <Text style={styles.linkText}>Already have an account?</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#363A44',
    alignSelf: 'stretch',
    width: '100%',
    minHeight: '100%',
  },
  patternLayer: {
    ...StyleSheet.absoluteFillObject,
  },
  dot: {
    position: 'absolute',
    width: 2,
    height: 2,
    borderRadius: 1,
    backgroundColor: '#7E8492',
    opacity: 0.24,
  },
  scroll: {
    flex: 1,
  },
  content: {
    minHeight: '100%',
    paddingHorizontal: 12,
    paddingTop: 72,
    paddingBottom: 28,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 30,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  subtitle: {
    color: '#C2C6CF',
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    marginBottom: 22,
    fontFamily: 'Inter',
  },
  label: {
    color: '#D0D4DD',
    fontSize: 12,
    fontWeight: '700',
    marginBottom: 6,
    marginTop: 2,
    fontFamily: 'Inter',
  },
  selectTrigger: {
    height: 44,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2E36',
    backgroundColor: '#1F2228',
    paddingHorizontal: 12,
    alignItems: 'center',
    justifyContent: 'space-between',
    flexDirection: 'row',
    marginBottom: 12,
  },
  selectTriggerText: {
    color: '#E3E5EA',
    fontSize: 13,
    fontFamily: 'Inter',
  },
  selectTriggerIcon: {
    color: '#9AA0AD',
    fontFamily: 'Inter',
  },
  selectMenu: {
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#2A2E36',
    backgroundColor: '#1F2228',
    marginTop: -4,
    marginBottom: 12,
    overflow: 'hidden',
  },
  selectOption: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#2B303A',
  },
  selectOptionText: {
    color: '#9FA4B3',
    fontFamily: 'Inter',
  },
  selectOptionTextActive: {
    color: '#E3D6FA',
  },
  input: {
    backgroundColor: '#1F2228',
    borderWidth: 1,
    borderColor: '#2A2E36',
    color: '#E7E9EE',
    borderRadius: 6,
    height: 44,
    paddingHorizontal: 12,
    marginBottom: 12,
    fontFamily: 'Inter',
  },
  passwordRow: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  passwordInput: {
    flex: 1,
    backgroundColor: '#1F2228',
    borderWidth: 1,
    borderColor: '#2A2E36',
    borderRadius: 6,
    borderTopRightRadius: 0,
    borderBottomRightRadius: 0,
    color: '#E7E9EE',
    height: 44,
    paddingHorizontal: 12,
    fontFamily: 'Inter',
  },
  passwordToggle: {
    width: 62,
    borderWidth: 1,
    borderLeftWidth: 0,
    borderColor: '#2A2E36',
    borderTopRightRadius: 6,
    borderBottomRightRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#282C35',
  },
  passwordToggleText: {
    color: '#A9AFBC',
    fontSize: 11,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  status: {
    marginBottom: 10,
    fontSize: 12,
    fontFamily: 'Inter',
  },
  statusNeutral: {
    color: '#A7ACB9',
  },
  statusError: {
    color: '#F17070',
  },
  statusValid: {
    color: '#7FD88B',
  },
  agreementRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  agreementBox: {
    width: 16,
    height: 16,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#6A7180',
    marginTop: 2,
  },
  agreementBoxChecked: {
    backgroundColor: '#BB9AF7',
    borderColor: '#BB9AF7',
  },
  agreementText: {
    flex: 1,
    color: '#BBC0CC',
    fontSize: 11,
    lineHeight: 16,
    fontFamily: 'Inter',
  },
  primaryButton: {
    backgroundColor: '#BB9AF7',
    borderRadius: 6,
    alignItems: 'center',
    paddingVertical: 12,
    marginTop: 6,
  },
  primaryButtonText: {
    color: '#1A1D24',
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
});
