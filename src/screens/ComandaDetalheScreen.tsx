// src/screens/ComandaDetalheScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useComandas } from "../context/ComandaContext";
import type { PaymentMethod } from "../models/firestoreModels";
import { USERS_MOCK } from "../data/mockUsers";

type RouteParams = { id: string; nickname: string };

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BORDER = "#E0E0E0";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const ERROR_RED = "#D32F2F";

function paymentLabel(p: PaymentMethod) {
  if (p === "cash") return "Dinheiro";
  if (p === "card") return "Cartao";
  return "Pix";
}

export default function ComandaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = (route.params || {}) as RouteParams;
  const comandaId = params.id;
  const nickname = params.nickname || "Comanda";

  const {
    getComandaById,
    getComandaTotal,
    isComandaClosed,
    updateItemQty,
    removeItemFromComanda,
    closeComanda,
    changeAttendant,
    cancelEmptyComanda,
    subscribeToComandaItems,
  } = useComandas();

  const comanda = getComandaById(comandaId);
  const total = getComandaTotal(comandaId);
  const closed = isComandaClosed(comandaId);
  const items = useMemo(() => comanda?.items ?? [], [comanda]);

  useEffect(() => {
    if (!comandaId) return;
    const unsub = subscribeToComandaItems(comandaId);
    return () => unsub();
  }, [comandaId]);

  // editar item
  const [editingItemId, setEditingItemId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [qtyText, setQtyText] = useState("1");

  // fechar comanda
  const [closing, setClosing] = useState(false);
  const [payment, setPayment] = useState<PaymentMethod>("pix");

  // trocar atendente (modal por lista)
  const [attModal, setAttModal] = useState(false);

  const activeUsers = useMemo(
    () => (USERS_MOCK || []).filter((u: any) => u && u.active !== false),
    []
  );

  const openEdit = (itemId: string, name: string, qty: number) => {
    if (closed) {
      Alert.alert("Comanda fechada", "Essa comanda ja foi fechada. Nao da pra editar.");
      return;
    }
    setEditingItemId(itemId);
    setEditingName(name);
    setQtyText(String(qty));
  };

  const closeEdit = () => {
    setEditingItemId(null);
    setEditingName("");
    setQtyText("1");
  };

  const parseQty = () => {
    const onlyDigits = qtyText.replace(/[^\d]/g, "");
    const n = Number(onlyDigits);
    if (!Number.isFinite(n) || n <= 0) return 1;
    return Math.max(1, Math.round(n));
  };

  const saveQty = async () => {
    if (!editingItemId) return;
    const ok = await updateItemQty(comandaId, editingItemId, parseQty());
    if (!ok) Alert.alert("Comanda fechada", "Nao da pra editar itens depois de fechar.");
    closeEdit();
  };

  const onLongPressItem = (itemId: string, name: string) => {
    if (closed) return;

    Alert.alert("Remover item", `Remover "${name}" da comanda?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Remover",
        style: "destructive",
        onPress: async () => {
          const ok = await removeItemFromComanda(comandaId, itemId);
          if (!ok) Alert.alert("Comanda fechada", "Nao da pra remover itens depois de fechar.");
        },
      },
    ]);
  };

  const openClose = () => {
    if (closed) return;
    if (items.length === 0) {
      Alert.alert("Sem itens", "Adicione pelo menos 1 item antes de fechar.");
      return;
    }
    setPayment("pix");
    setClosing(true);
  };

  const confirmClose = () => {
    Alert.alert("Fechar comanda", `Confirmar fechamento no ${paymentLabel(payment)}?`, [
      { text: "Cancelar", style: "cancel" },
      {
        text: "Confirmar",
        onPress: async () => {
          const ok = await closeComanda(comandaId, payment);
          setClosing(false);

          if (!ok) {
            Alert.alert("Ops", "Essa comanda ja estava fechada.");
            return;
          }

          Alert.alert("Comanda fechada", `Pagamento: ${paymentLabel(payment)}`, [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
  };

  const openTrocarAtendente = () => {
    if (closed) {
      Alert.alert("Comanda fechada", "Essa comanda ja foi fechada. Nao da pra trocar atendente.");
      return;
    }

    if (activeUsers.length === 0) {
      Alert.alert("Sem usuarios", "Nao ha usuarios ativos cadastrados.");
      return;
    }

    setAttModal(true);
  };

  const pickAttendant = async (name: string) => {
    const next = (name || "").trim();
    if (!next || next.length < 2) return;

    if ((comanda?.currentAttendant || "").trim() === next) {
      setAttModal(false);
      return;
    }

    const ok = await changeAttendant(comandaId, next);

    if (!ok) {
      Alert.alert("Erro", "Nao consegui trocar o atendente.");
      return;
    }

    setAttModal(false);
    Alert.alert("Pronto", `Agora o atendente e: ${next}`);
  };

  const confirmCancelarComandaVazia = () => {
    if (closed) return;
    if (items.length > 0) {
      Alert.alert("Nao da", "Essa comanda ja tem itens. So pode fechar, nao cancelar.");
      return;
    }

    Alert.alert("Cancelar comanda", "Essa comanda esta vazia. Quer cancelar/excluir?", [
      { text: "Nao", style: "cancel" },
      {
        text: "Sim, cancelar",
        style: "destructive",
        onPress: async () => {
          const ok = await cancelEmptyComanda(comandaId);
          if (!ok) {
            Alert.alert("Ops", "Nao consegui cancelar. Tente de novo.");
            return;
          }
          Alert.alert("Cancelada", "Comanda vazia cancelada.", [
            { text: "OK", onPress: () => navigation.goBack() },
          ]);
        },
      },
    ]);
  };

  const currentAtt = (comanda?.currentAttendant || "-").trim() || "-";

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{nickname}</Text>

          <View style={styles.subRow}>
            <Text style={styles.subTitle}>{closed ? "Comanda fechada" : "Comanda aberta"}</Text>

            {closed && (comanda as any)?.paymentMethod ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{paymentLabel((comanda as any).paymentMethod)}</Text>
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
            keyExtractor={(it: any) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 12 }}
            renderItem={({ item }: any) => (
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
                      {item.qty}x - R$ {Number(item.price).toFixed(2)}
                    </Text>
                  </View>
                  <Text style={styles.itemTotal}>R$ {(Number(item.price) * Number(item.qty)).toFixed(2)}</Text>
                </View>
              </TouchableOpacity>
            )}
          />
        )}

        {closed ? (
          <Text style={[styles.muted, { marginTop: 12 }]}>Essa comanda esta travada.</Text>
        ) : (
          <Text style={[styles.muted, { marginTop: 12 }]}>Toque no item para editar. Segure para remover.</Text>
        )}
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {Number(total).toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={[styles.primaryBtn, closed && styles.btnDisabled]}
          disabled={closed}
          onPress={() =>
            navigation.navigate("ComandaAdicionarItem", {
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

        {!closed && items.length === 0 ? (
          <TouchableOpacity style={styles.dangerBtn} onPress={confirmCancelarComandaVazia}>
            <Text style={styles.dangerBtnText}>Cancelar comanda</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Modal fechar comanda */}
      <Modal transparent visible={closing} animationType="fade" onRequestClose={() => setClosing(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Fechar comanda</Text>
            <Text style={styles.modalSub}>Escolha a forma de pagamento</Text>

            <View style={{ gap: 10 }}>
              <TouchableOpacity
                style={[styles.payOption, payment === "pix" && styles.payOptionSelected]}
                onPress={() => setPayment("pix")}
              >
                <Text style={styles.payOptionText}>Pix</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, payment === "card" && styles.payOptionSelected]}
                onPress={() => setPayment("card")}
              >
                <Text style={styles.payOptionText}>Cartao</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[styles.payOption, payment === "cash" && styles.payOptionSelected]}
                onPress={() => setPayment("cash")}
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
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Trocar atendente</Text>
            <Text style={styles.modalSub}>Escolha o novo atendente</Text>

            <View style={{ gap: 10 }}>
              {activeUsers.map((u: any) => (
                <TouchableOpacity key={u.id} style={styles.userOption} onPress={() => pickAttendant(u.name)}>
                  <Text style={styles.userOptionText}>{u.name}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={[styles.modalButtonsRow, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={() => setAttModal(false)}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Modal editar item */}
      <Modal transparent visible={!!editingItemId} animationType="fade" onRequestClose={closeEdit}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Editar item</Text>
            <Text style={styles.modalSub}>{editingName}</Text>

            <Text style={styles.modalLabel}>Quantidade</Text>
            <View style={styles.qtyRow}>
              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQtyText((v) => String(Math.max(1, parseQty() - 1)))}
              >
                <Text style={styles.qtyBtnText}>-</Text>
              </TouchableOpacity>

              <View style={styles.qtyMid}>
                <Text style={styles.qtyMidText}>{parseQty()}</Text>
              </View>

              <TouchableOpacity
                style={styles.qtyBtn}
                onPress={() => setQtyText((v) => String(Math.max(1, parseQty() + 1)))}
              >
                <Text style={styles.qtyBtnText}>+</Text>
              </TouchableOpacity>
            </View>

            <View style={[styles.modalButtonsRow, { marginTop: 12 }]}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeEdit}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={saveQty}>
                <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={[styles.modalRemoveBtn, { marginTop: 12 }]}
              onPress={() => {
                if (!editingItemId) return;
                Alert.alert("Remover item", `Remover "${editingName}" da comanda?`, [
                  { text: "Cancelar", style: "cancel" },
                  {
                    text: "Remover",
                    style: "destructive",
                    onPress: async () => {
                      const ok = await removeItemFromComanda(comandaId, editingItemId);
                      if (!ok) Alert.alert("Comanda fechada", "Nao da pra remover itens depois de fechar.");
                      closeEdit();
                    },
                  },
                ]);
              }}
            >
              <Text style={styles.modalRemoveText}>Remover item</Text>
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: BG },

  topBar: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  iconBtn: { paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 18, fontWeight: "800", color: TEXT },

  subRow: { flexDirection: "row", gap: 8, alignItems: "center", marginTop: 2 },
  subTitle: { fontSize: 12, color: MUTED },

  badge: {
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
    backgroundColor: "#E8F5E9",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
  },
  badgeText: { fontSize: 11, fontWeight: "800", color: PRIMARY_GREEN },

  box: {
    margin: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    flex: 1,
  },

  attRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  attLabel: { fontSize: 12, color: MUTED, fontWeight: "700" },
  attValue: { marginTop: 2, fontSize: 16, color: TEXT, fontWeight: "800" },

  attBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
    backgroundColor: WHITE,
  },
  attBtnText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "800" },

  divider: { height: 1, backgroundColor: "#EEEEEE", marginVertical: 12 },

  sectionTitle: { fontSize: 14, fontWeight: "800", color: TEXT, marginBottom: 8 },
  muted: { fontSize: 13, color: MUTED },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#EEEEEE",
    borderRadius: 12,
    padding: 12,
    backgroundColor: WHITE,
  },
  itemRowDisabled: { opacity: 0.7 },
  itemName: { fontSize: 14, fontWeight: "800", color: TEXT },
  itemSub: { marginTop: 2, fontSize: 12, color: MUTED },
  itemTotal: { marginLeft: 12, fontSize: 13, fontWeight: "800", color: PRIMARY_GREEN },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
    backgroundColor: WHITE,
  },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginBottom: 12 },
  totalLabel: { fontSize: 14, fontWeight: "700", color: TEXT },
  totalValue: { fontSize: 14, fontWeight: "800", color: PRIMARY_GREEN },

  primaryBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: "800" },

  secondaryBtn: {
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: PRIMARY_GREEN,
  },
  secondaryBtnText: { color: PRIMARY_GREEN, fontSize: 14, fontWeight: "800" },

  dangerBtn: {
    marginTop: 10,
    backgroundColor: WHITE,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: ERROR_RED,
  },
  dangerBtnText: { color: ERROR_RED, fontSize: 14, fontWeight: "900" },

  btnDisabled: { opacity: 0.5 },
  btnDisabledOutline: { borderColor: "#BDBDBD" },
  btnDisabledText: { color: "#9E9E9E" },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    padding: 18,
    justifyContent: "center",
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 14,
  },
  modalTitle: { fontSize: 16, fontWeight: "900", color: TEXT },
  modalSub: { marginTop: 2, marginBottom: 12, fontSize: 13, color: MUTED },

  modalLabel: { fontSize: 14, fontWeight: "700", color: TEXT, marginBottom: 8 },

  modalButtonsRow: { flexDirection: "row", gap: 10 },

  modalBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnPrimaryText: { color: WHITE, fontSize: 14, fontWeight: "900" },

  modalBtnSecondary: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  modalBtnSecondaryText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "900" },

  modalRemoveBtn: {
    paddingVertical: 10,
    alignItems: "center",
    borderRadius: 10,
    borderWidth: 1,
    borderColor: ERROR_RED,
    backgroundColor: WHITE,
  },
  modalRemoveText: { color: ERROR_RED, fontSize: 14, fontWeight: "900" },

  payOption: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: WHITE,
    alignItems: "center",
  },
  payOptionSelected: { borderColor: PRIMARY_GREEN, backgroundColor: "#E8F5E9" },
  payOptionText: { fontSize: 14, fontWeight: "900", color: TEXT },

  userOption: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: WHITE,
    alignItems: "center",
  },
  userOptionText: { fontSize: 14, fontWeight: "900", color: TEXT },

  qtyRow: {
    flexDirection: "row",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    overflow: "hidden",
  },
  qtyBtn: { paddingHorizontal: 18, paddingVertical: 12, backgroundColor: "#FAFAFA" },
  qtyBtnText: { fontSize: 16, fontWeight: "900", color: TEXT },
  qtyMid: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: WHITE },
  qtyMidText: { fontSize: 14, fontWeight: "900", color: TEXT },
});
