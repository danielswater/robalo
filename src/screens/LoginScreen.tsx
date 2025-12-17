import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

const PRIMARY_GREEN = '#2E7D32';
const COR_ERRO = '#D32F2F';

export default function LoginScreen() {
  const navigation = useNavigation<any>();

  const [name, setName] = useState('');
  const [pin, setPin] = useState('');
  const [error, setError] = useState<string | null>(null);

  function handleChangePin(text: string) {
    const digitsOnly = text.replace(/\D/g, '').slice(0, 6);
    setPin(digitsOnly);
  }

  function handleLogin() {
    const trimmedName = name.trim();

    if (!trimmedName || trimmedName.length < 2) {
      setError('Digite seu nome.');
      return;
    }

    if (!pin || pin.length < 4) {
      setError('Digite o PIN da barraca.');
      return;
    }

    const PIN_CORRETO = '1234';
    if (pin !== PIN_CORRETO) {
      setError('PIN incorreto.');
      return;
    }

    setError(null);

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  }

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.inner}>
        <Text style={styles.appTitle}>Barraca do Robalo</Text>
        <Text style={styles.screenTitle}>Entrar</Text>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>Seu nome</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex: João"
            placeholderTextColor="#9E9E9E"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
            returnKeyType="next"
          />
        </View>

        <View style={styles.fieldGroup}>
          <Text style={styles.label}>PIN da barraca</Text>
          <TextInput
            style={styles.input}
            placeholder="••••"
            placeholderTextColor="#9E9E9E"
            value={pin}
            onChangeText={handleChangePin}
            keyboardType="number-pad"
            secureTextEntry
            maxLength={6}
          />
          <Text style={styles.helper}>
            PIN simples só pra ninguém de fora mexer.
          </Text>
        </View>

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.primaryButton} onPress={handleLogin}>
          <Text style={styles.primaryButtonText}>Entrar</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.smallLink}>
          <Text style={styles.smallLinkText}>Trocar atendente depois</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FAFAFA',
  },
  inner: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 64,
  },
  appTitle: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  screenTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 32,
  },
  fieldGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#BDBDBD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
  },
  helper: {
    fontSize: 13,
    color: '#757575',
    marginTop: 4,
  },
  error: {
    color: COR_ERRO,
    fontSize: 14,
    marginBottom: 16,
  },
  primaryButton: {
    marginTop: 8,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  smallLink: {
    marginTop: 16,
    alignItems: 'center',
  },
  smallLinkText: {
    fontSize: 14,
    textDecorationLine: 'underline',
    color: '#424242',
  },
});
