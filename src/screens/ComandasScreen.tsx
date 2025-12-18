// src/screens/ComandasScreen.tsx
import React, { useEffect, useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  FlatList,
  Modal,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useComandas } from '../context/ComandaContext';

const PRIMARY_GREEN = '#2E7D32';
const SECONDARY_BLUE = '#1976D2';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';
const TEXT = '#212121';
const MUTED = '#757575';
const BORDER = '#E0E0E0';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
};

export default function ComandasScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { comandas, seedIfEmpty, createComanda } = useComandas();

  const [attendantName, setAttendantName] = useState('Atendente');

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  useEffect(() => {
    let alive = true;

    async function loadAttendant() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.attendantName);
        const name = (saved || '').trim();
        if (alive) setAttendantName(name.length >= 2 ? name : 'Atendente');
      } catch {
        if (alive) setAttendantName('Atendente');
      }
    }

    loadAttendant();
    return () => {
      alive = false;
    };
  }, []);

  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [nickname, setNickname] = useState('');

  const openComandas = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (comandas || [])
      .filter((c) => c.status === 'OPEN')
      .filter((c) => !s || (c.nickname || '').toLowerCase().includes(s));
  }, [comandas, search]);

  const openComanda = (id: string, nick: string) => {
    navigation.navigate('ComandaDetalhe', { id, nickname: nick });
  };

  const onCreate = () => {
    createComanda(nickname.trim(), attendantName);
    setCreateOpen(false);
    setNickname('');
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.topArea}>
        <TouchableOpacity style={styles.newBtn} onPress={() => setCreateOpen(true)}>
          <Ionicons name="add" size={18} color={WHITE} />
          <Text style={styles.newBtnText}>Nova comanda</Text>
        </TouchableOpacity>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar por apelido..."
          placeholderTextColor="#9E9E9E"
          style={styles.search}
        />
      </View>

      {openComandas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sem comandas abertas</Text>
          <Text style={styles.emptyText}>Toque em “Nova comanda” para começar.</Text>
        </View>
      ) : (
        <FlatList
          data={openComandas}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => openComanda(item.id, item.nickname)}>
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.nickname || 'Sem apelido'}</Text>
                  <Text style={styles.cardSub}>Atendente: {item.currentAttendant || '—'}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal transparent visible={createOpen} animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.modalOverlay}
        >
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova comanda</Text>

            <Text style={styles.modalLabel}>Apelido (opcional)</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Ex: Boné azul"
              placeholderTextColor="#9E9E9E"
              style={styles.modalInput}
              maxLength={30}
            />

            <Text style={styles.helper}>Atendente: {attendantName}</Text>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setCreateOpen(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={onCreate}>
                <Text style={styles.modalBtnPrimaryText}>Criar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },
  topArea: { padding: 16 },

  newBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: SECONDARY_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  newBtnText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },

  search: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
  },

  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT, marginBottom: 6 },
  emptyText: { fontSize: 14, color: MUTED, textAlign: 'center' },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  cardTitle: { fontSize: 16, fontWeight: 'bold', color: TEXT },
  cardSub: { marginTop: 4, fontSize: 14, color: MUTED },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    padding: 18,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: 'bold', color: TEXT, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: 'bold', color: TEXT, marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: WHITE,
    color: TEXT,
  },
  helper: { marginTop: 10, fontSize: 13, color: MUTED, fontWeight: '700' },

  modalButtonsRow: { flexDirection: 'row', gap: 10, marginTop: 16 },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: WHITE, fontSize: 16, fontWeight: 'bold' },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  modalBtnSecondaryText: { color: SECONDARY_BLUE, fontSize: 16, fontWeight: 'bold' },
});
