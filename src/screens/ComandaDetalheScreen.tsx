// src/screens/ComandaDetalheScreen.tsx
import React, { useMemo, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PaymentMethod, useComandas } from '../context/ComandaContext';

type RouteParams = { id: string; nickname: string };

const PRIMARY_GREEN = '#2E7D32';
const SECONDARY_BLUE = '#1976D2';
const BORDER = '#E0E0E0';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';
const TEXT = '#212121';
const MUTED = '#757575';
const ERROR_RED = '#D32F2F';

function paymentLabel(p: PaymentMethod) {
  if (p === 'CASH') return 'Dinheiro';
  if (p === 'CARD') return 'Cartão';
  return 'Pix';
}

export default function ComandaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = (route.params || {}) as RouteParams;
  const comandaId = params.id;
  const nickname = params.nickname || 'Comanda';

  const {
    getComandaById,
    getComandaTotal,
    isComandaClosed,
    updateItemQty,
    removeItemFromComanda,
    closeComanda,
    changeAttendant,
    cancelEmptyComanda,
  } = useComandas();

  const comanda = getComandaById(comandaId);
  const total = getComandaTotal(comandaId);
  const closed = isComandaClosed(comandaId);
  const items = useMemo(() => comanda?.items ?? [], [comanda]);

  // editar item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [qtyText, setQtyText] = useState('1');

  // fechar comanda
  const [closing, setClosing] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>('PIX');

  // trocar atendente
  const [attModal, setAttModal] = useState(false);
  const [newAttendant, setNewAttendant] = useState('');

  const openEdit = (itemId: string, name: string, qty: number) => {
    if (closed) {
      Alert.alert('Comanda fechada', 'Essa comanda já foi fechada. Não dá pra editar.');
      return;
    }
    setEditingItemId(itemId);
    setEditingName(name);
    setQtyText(String(qty));
  };

  const closeEdit = () => {
    setEditingItemId(null);
    setEditingName('');
    setQtyText('1');
  };

  const parseQty = () => {
    const onlyDigits = qtyText.replace(/[^\d]/g, '');
    const n = Number(onlyDigits);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.max(1, Math.round(n));
  };

  const saveQty = () => {
    if (!editingItemId) return;
    const ok = updateItemQty(comandaId, editingItemId, parseQty());
    if (!ok) Alert.alert('Comanda fechada', 'Não dá pra editar itens depois de fechar.');
    closeEdit();
  };

  const confirmRemove = () => {
    if (!editingItemId) return;

    Alert.alert('Remover item', `Remover "${editingName}" da comanda?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const ok = removeItemFromComanda(comandaId, editingItemId);
          if (!ok) Alert.alert('Comanda fechada', 'Não dá pra remover itens depois de fechar.');
          closeEdit();
        },
      },
    ]);
  };

  const onLongPressItem = (itemId: string, name: string) => {
    if (closed) return;

    Alert.alert('Remover item', `Remover "${name}" da comanda?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => {
          const ok = removeItemFromComanda(comandaId, itemId);
          if (!ok) Alert.alert('Comanda fechada', 'Não dá pra remover itens depois de fechar.');
        },
      },
    ]);
  };

  const openClose = () => {
    if (closed) return;
    if (items.length === 0) {
      Alert.alert('Sem itens', 'Adicione pelo menos 1 item antes de fechar.');
      return;
    }
    setPayment('PIX');
    setClosing(true);
  };

  const confirmClose = () => {
    Alert.alert('Fechar comanda', `Confirmar fechamento no ${paymentLabel(payment)}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Confirmar',
        onPress: () => {
          const ok = closeComanda(comandaId, payment);
          setClosing(false);

          if (!ok) {
            Alert.alert('Ops', 'Essa comanda já estava fechada.');
            return;
          }

          Alert.alert('Comanda fechada', `Pagamento: ${paymentLabel(payment)}`, [
            { text: 'OK', onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
  };

  const openTrocarAtendente = () => {
    if (closed) {
      Alert.alert('Comanda fechada', 'Essa comanda já foi fechada. Não dá pra trocar atendente.');
      return;
    }
    setNewAttendant((comanda?.currentAttendant || '').trim());
    setAttModal(true);
  };

  const confirmTrocarAtendente = () => {
    const next = (newAttendant || '').trim();

    if (!next || next.length < 2) {
      Alert.alert('Nome inválido', 'Digite o nome do atendente.');
      return;
    }

    if ((comanda?.currentAttendant || '').trim() === next) {
      setAttModal(false);
      return;
    }

    const ok = changeAttendant(comandaId, next);

    if (!ok) {
      Alert.alert('Erro', 'Não consegui trocar o atendente.');
      return;
    }

    setAttModal(false);
    Alert.alert('Pronto', `Agora o atendente é: ${next}`);
  };

  const confirmCancelarComandaVazia = () => {
    if (closed) return;
    if (items.length > 0) {
      Alert.alert('Não dá', 'Essa comanda já tem itens. Só pode fechar, não cancelar.');
      return;
    }

    Alert.alert('Cancelar comanda', 'Essa comanda está vazia. Quer cancelar/excluir?', [
      { text: 'Não', style: 'cancel' },
      {
        text: 'Sim, cancelar',
        style: 'destructive',
        onPress: () => {
          const ok = cancelEmptyComanda(comandaId);
          if (!ok) {
            Alert.alert('Ops', 'Não consegui cancelar. Tente de novo.');
            return;
          }
          Alert.alert('Cancelada', 'Comanda vazia cancelada.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
        },
      },
    ]);
  };

  const currentAtt = (comanda?.currentAttendant || '—').trim() || '—';

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{nickname}</Text>

          <View style={styles.subRow}>
            <Text style={styles.subTitle}>{closed ? 'Comanda fechada' : 'Comanda aberta'}</Text>

            {closed && comanda?.paymentMethod ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{paymentLabel(comanda.paymentMethod)}</Text>
              </View>
            ) : null}
          </View>
        </View>
      </View>

      <View style={styles.box}>
        <View style={styles.attRow}>
          <View style={{ flex: 1 }}>
            <Text style={styles.attLabel}>Atendente atual</Text>
            <Text style={styles.attValue}>{currentAtt}</Text>
          </View>

          <TouchableOpacity
            style={[styles.attBtn, closed && styles.btnDisabled]}
            disabled={closed}
            onPress={openTrocarAtendente}
          >
            <Ionicons name="person-outline" size={18} color={SECONDARY_BLUE} />
            <Text style={styles.attBtnText}>Trocar</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.divider} />

        <Text style={styles.sectionTitle}>Itens</Text>

        {items.length === 0 ? (
          <Text style={styles.muted}>Sem itens.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.85}
                disabled={closed}
                onPress={() => openEdit(item.id, item.name, item.qty)}
                onLongPress={() => onLongPressItem(item.id, item.name)}
              >
                <View style={[styles.itemRow, closed && styles.itemRowDisabled]}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.itemName}>{item.name}</Text>
                    <Text style={styles.itemSub}>
                      {item.qty}x • R$ {item.price.toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>R$ {(item.price * item.qty).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {closed ? (
          <Text style={[styles.muted, { marginTop: 12 }]}>Essa comanda está travada.</Text>
        ) : (
          <Text style={[styles.muted, { marginTop: 12 }]}>Toque no item para editar. Segure para remover.</Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, closed && styles.btnDisabled]}
          disabled={closed}
          onPress={() =>
            navigation.navigate('ComandaAdicionarItem', {
              id: comandaId,
              nickname,
            })
          }
        >
          <Text style={styles.primaryBtnText}>Adicionar item</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.secondaryBtn, (closed || items.length === 0) && styles.btnDisabledOutline]}
          disabled={closed || items.length === 0}
          onPress={openClose}
        >
          <Text style={[styles.secondaryBtnText, (closed || items.length === 0) && styles.btnDisabledText]}>
            Fechar comanda
          </Text>
        </TouchableOpacity>

        {/* ✅ Só aparece se estiver ABERTA e VAZIA */}
        {!closed && items.length === 0 ? (
          <TouchableOpacity style={styles.dangerBtn} onPress={confirmCancelarComandaVazia}>
            <Text style={styles.dangerBtnText}>Cancelar comanda</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Modal editar item */}
      <Modal transparent visible={!!editingItemId} animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar item</Text>
            <Text style={styles.modalSub}>{editingName}</Text>

            <Text style={styles.modalLabel}>Quantidade</Text>
            <TextInput
              value={qtyText}
              onChangeText={setQtyText}
              keyboardType="number-pad"
              style={styles.modalInput}
              placeholder="1"
              placeholderTextColor="#9E9E9E"
              maxLength={6}
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeEdit}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={saveQty}>
                <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.modalRemoveBtn} onPress={confirmRemove}>
              <Text style={styles.modalRemoveText}>Remover item</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal fechar comanda */}
      <Modal transparent visible={closing} animationType="fade" onRequestClose={() => setClosing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fechar comanda</Text>
            <Text style={styles.modalSub}>Escolha a forma de pagamento</Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.payOption, payment === 'PIX' && styles.payOptionSelected]}
                onPress={() => setPayment('PIX')}
              >
                <Text style={styles.payOptionText}>Pix</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, payment === 'CARD' && styles.payOptionSelected]}
                onPress={() => setPayment('CARD')}
              >
                <Text style={styles.payOptionText}>Cartão</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, payment === 'CASH' && styles.payOptionSelected]}
                onPress={() => setPayment('CASH')}
              >
                <Text style={styles.payOptionText}>Dinheiro</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalButtonsRow, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setClosing(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmClose}>
                <Text style={styles.modalBtnPrimaryText}>Confirmar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal trocar atendente */}
      <Modal transparent visible={attModal} animationType="fade" onRequestClose={() => setAttModal(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Trocar atendente</Text>
            <Text style={styles.modalSub}>Digite o nome do novo atendente</Text>

            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput
              value={newAttendant}
              onChangeText={setNewAttendant}
              style={styles.modalInput}
              placeholder="Ex: Ana"
              placeholderTextColor="#9E9E9E"
              maxLength={40}
              autoCapitalize="words"
            />

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setAttModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={confirmTrocarAtendente}>
                <Text style={styles.modalBtnPrimaryText}>Confirmar</Text>
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

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  iconBtn: { paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT },

  subRow: { flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 2 },
  subTitle: { fontSize: 12, color: MUTED },

  badge: {
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: '800', color: PRIMARY_GREEN },

  box: {
    margin: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    flex: 1,
  },

  attRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  attLabel: { fontSize: 12, color: MUTED, fontWeight: '700' },
  attValue: { marginTop: 2, fontSize: 16, color: TEXT, fontWeight: '800' },

  attBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
    backgroundColor: WHITE,
  },
  attBtnText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: '900' },

  divider: { height: 1, backgroundColor: '#EEEEEE', marginVertical: 12 },

  sectionTitle: { fontSize: 14, fontWeight: '800', color: TEXT, marginBottom: 8 },
  muted: { fontSize: 13, color: MUTED },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  itemRowDisabled: { opacity: 0.7 },
  itemName: { fontSize: 14, fontWeight: '800', color: TEXT },
  itemSub: { marginTop: 2, fontSize: 12, color: MUTED },
  itemTotal: { marginLeft: 12, fontSize: 13, fontWeight: '800', color: PRIMARY_GREEN },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    backgroundColor: WHITE,
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: TEXT },
  totalValue: { fontSize: 14, fontWeight: '800', color: PRIMARY_GREEN },

  primaryBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: '800' },

  secondaryBtn: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
  },
  secondaryBtnText: { color: PRIMARY_GREEN, fontSize: 14, fontWeight: '800' },

  dangerBtn: {
    marginTop: 10,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ERROR_RED,
  },
  dangerBtnText: { color: ERROR_RED, fontSize: 14, fontWeight: '900' },

  btnDisabled: { opacity: 0.5 },
  btnDisabledOutline: { borderColor: '#BDBDBD' },
  btnDisabledText: { color: '#9E9E9E' },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    padding: 18,
    justifyContent: 'center',
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: '900', color: TEXT },
  modalSub: { marginTop: 2, marginBottom: 12, fontSize: 13, color: MUTED },

  modalLabel: { fontSize: 14, fontWeight: '700', color: TEXT, marginBottom: 8 },
  modalInput: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    backgroundColor: WHITE,
    color: TEXT,
    marginBottom: 12,
  },

  modalButtonsRow: { flexDirection: 'row', gap: 10 },

  modalBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  modalBtnPrimaryText: { color: WHITE, fontSize: 14, fontWeight: '900' },

  modalBtnSecondary: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  modalBtnSecondaryText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: '900' },

  modalRemoveBtn: {
    marginTop: 12,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ERROR_RED,
    backgroundColor: WHITE,
  },
  modalRemoveText: { color: ERROR_RED, fontSize: 14, fontWeight: '900' },

  payOption: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: WHITE,
    alignItems: 'center',
  },
  payOptionSelected: { borderColor: PRIMARY_GREEN, backgroundColor: '#E8F5E9' },
  payOptionText: { fontSize: 14, fontWeight: '900', color: TEXT },
});
