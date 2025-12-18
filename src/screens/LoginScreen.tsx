import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TextInput,
  ActivityIndicator,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import { USERS_MOCK } from '../data/mockUsers';

const PRIMARY_GREEN = '#2E7D32';
const BG = '#FAFAFA';
const WHITE = '#FFFFFF';
const TEXT = '#212121';
const MUTED = '#757575';
const BORDER = '#E0E0E0';
const ERROR_RED = '#D32F2F';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
};

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [loading, setLoading] = useState(true);

  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  const activeUsers = useMemo(() => USERS_MOCK.filter((u) => u.active), []);

  const selectedUser = useMemo(() => {
    if (!selectedUserId) return null;
    return activeUsers.find((u) => u.id === selectedUserId) || null;
  }, [selectedUserId, activeUsers]);

  useEffect(() => {
    // Se o usuário selecionado ficou inválido (ex: desativado), limpa.
    if (selectedUserId && !selectedUser) {
      setSelectedUserId(null);
      setPin('');
      setError(null);
    }
  }, [selectedUserId, selectedUser]);

  useEffect(() => {
    let alive = true;

    async function boot() {
      try {
        const savedName = await AsyncStorage.getItem(STORAGE_KEYS.attendantName);

        if (savedName && savedName.trim().length >= 2) {
          navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
          return;
        }
      } catch {
        // se der erro, só continua no login normal
      } finally {
        if (alive) setLoading(false);
      }
    }

    boot();
    return () => {
      alive = false;
    };
  }, [navigation]);

  function handleSelectUser(id: string) {
    setSelectedUserId(id);
    setPin('');
    setError(null);
  }

  function handleChangePin(text: string) {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
    if (error) setError(null);
  }

  async function handleLogin() {
    if (!selectedUser) {
      setError('Escolha um atendente.');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Digite o PIN.');
      return;
    }

    // ✅ PIN por usuário (pode ser igual para todos por enquanto)
    if (pin !== selectedUser.pin) {
      setError('PIN incorreto.');
      return;
    }

    try {
      await AsyncStorage.setItem(STORAGE_KEYS.attendantName, selectedUser.name);

      navigation.reset({
        index: 0,
        routes: [{ name: 'MainTabs' }],
      });
    } catch {
      setError('Não consegui salvar o login. Tente de novo.');
    }
  }

  if (loading) {
    return (
      <View style={styles.loadingWrap}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Carregando...</Text>
      </View>
    );
  }

  const pinEnabled = !!selectedUser;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <View style={styles.brand}>
          <View style={styles.logoCircle}>
            <Ionicons name="fish-outline" size={36} color={PRIMARY_GREEN} />
          </View>
          <Text style={styles.appTitle}>Banca do Robalo</Text>
        </View>

        <Text style={styles.sectionTitle}>Quem está usando?</Text>

        <View style={styles.usersBox}>
          {activeUsers.map((u) => {
            const selected = u.id === selectedUserId;

            return (
              <TouchableOpacity
                key={u.id}
                activeOpacity={0.85}
                style={[styles.userBtn, selected && styles.userBtnSelected]}
                onPress={() => handleSelectUser(u.id)}
              >
                <Text style={[styles.userBtnText, selected && styles.userBtnTextSelected]}>
                  {u.name}
                </Text>
                {selected ? (
                  <Ionicons name="checkmark-circle" size={20} color={PRIMARY_GREEN} />
                ) : (
                  <Ionicons name="chevron-forward" size={18} color={MUTED} />
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={styles.pinArea}>
          <Text style={styles.pinLabel}>PIN da banca</Text>

          <TextInput
            value={pin}
            onChangeText={handleChangePin}
            keyboardType="number-pad"
            secureTextEntry
            placeholder="••••"
            placeholderTextColor="#9E9E9E"
            style={[styles.pinInput, !pinEnabled && styles.pinInputDisabled]}
            editable={pinEnabled}
            maxLength={6}
          />

          <Text style={styles.pinHelper}>
            {pinEnabled ? 'PIN simples só pra ninguém de fora mexer.' : 'Escolha um atendente para digitar o PIN.'}
          </Text>

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <TouchableOpacity
            style={[styles.primaryButton, (!selectedUser || pin.length < 4) && styles.primaryButtonDisabled]}
            onPress={handleLogin}
            disabled={!selectedUser || pin.length < 4}
          >
            <Text style={styles.primaryButtonText}>Entrar</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  loadingWrap: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#424242',
  },
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  inner: {
    flex: 1,
    paddingHorizontal: 22,
    justifyContent: 'center',
    paddingBottom: 24,
  },

  brand: {
    alignItems: 'center',
    marginBottom: 26,
  },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 999,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: TEXT,
  },

  sectionTitle: {
    fontSize: 14,
    color: MUTED,
    fontWeight: '800',
    marginBottom: 10,
    textAlign: 'center',
  },

  usersBox: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 10,
    marginBottom: 18,
  },
  userBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    backgroundColor: WHITE,
    paddingVertical: 14,
    paddingHorizontal: 14,
    borderRadius: 12,
    marginBottom: 10,
  },
  userBtnSelected: {
    borderColor: PRIMARY_GREEN,
    backgroundColor: '#E8F5E9',
  },
  userBtnText: {
    fontSize: 16,
    fontWeight: '900',
    color: TEXT,
  },
  userBtnTextSelected: {
    color: PRIMARY_GREEN,
  },

  pinArea: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 14,
    padding: 14,
  },
  pinLabel: {
    fontSize: 14,
    fontWeight: '900',
    color: TEXT,
    marginBottom: 8,
  },
  pinInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    backgroundColor: WHITE,
    color: TEXT,
    letterSpacing: 4,
  },
  pinInputDisabled: {
    backgroundColor: '#F3F3F3',
    color: '#9E9E9E',
  },
  pinHelper: {
    marginTop: 8,
    fontSize: 12,
    color: MUTED,
    fontWeight: '700',
  },
  error: {
    marginTop: 10,
    color: ERROR_RED,
    fontSize: 13,
    fontWeight: '800',
  },

  primaryButton: {
    marginTop: 14,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonDisabled: {
    opacity: 0.55,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
  },
});
