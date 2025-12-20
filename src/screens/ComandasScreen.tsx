// src/screens/ComandasScreen.tsx
import React, { useEffect, useMemo, useState } from "react";
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
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useComandas } from "../context/ComandaContext";

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const BORDER = "#E0E0E0";

const STORAGE_KEYS = {
  attendantName: "attendantName",
};

function formatOpenedAgo(value?: string | null) {
  if (!value) return "Aberta agora";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "Aberta agora";
  const diffMin = Math.floor((Date.now() - d.getTime()) / 60000);
  if (diffMin <= 0) return "Aberta agora";
  if (diffMin < 60) return `Aberta ha ${diffMin} min`;
  const hours = Math.floor(diffMin / 60);
  return `Aberta ha ${hours}h`;
}

export default function ComandasScreen() {
  const navigation = useNavigation<any>();
  const insets = useSafeAreaInsets();
  const { comandas, createComanda, ordersError, reloadOrders } = useComandas();

  const [attendantName, setAttendantName] = useState("Atendente");

  useEffect(() => {
    let alive = true;

    async function loadAttendant() {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEYS.attendantName);
        const name = (saved || "").trim();
        if (alive) setAttendantName(name.length >= 2 ? name : "Atendente");
      } catch {
        if (alive) setAttendantName("Atendente");
      }
    }

    loadAttendant();
    return () => {
      alive = false;
    };
  }, []);

  const [search, setSearch] = useState("");
  const [createOpen, setCreateOpen] = useState(false);
  const [nickname, setNickname] = useState("");

  const openComandas = useMemo(() => {
    const s = search.trim().toLowerCase();
    return (comandas || [])
      .filter((c) => c.status === "open")
      .filter((c) => !s || (c.nickname || "").toLowerCase().includes(s));
  }, [comandas, search]);

  const openComanda = (id: string, nick: string) => {
    navigation.navigate("ComandaDetalhe", { id, nickname: nick });
  };

  const onCreate = async () => {
    try {
      await createComanda(nickname.trim(), attendantName);
      setCreateOpen(false);
      setNickname("");
    } catch {
      Alert.alert("Erro", "Nao foi possivel criar a comanda.");
    }
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

      {ordersError ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{ordersError}</Text>
          <TouchableOpacity style={styles.retryBtn} onPress={reloadOrders}>
            <Text style={styles.retryText}>Recarregar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {openComandas.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Sem comandas abertas</Text>
          <Text style={styles.emptyText}>Toque em "Nova comanda" para comecar.</Text>
        </View>
      ) : (
        <FlatList
          style={{ flex: 1 }}
          data={openComandas}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: insets.bottom + 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity activeOpacity={0.8} onPress={() => openComanda(item.id, item.nickname)}>
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.nickname || "Sem apelido"}</Text>
                  <Text style={styles.cardTotal}>R$ {Number(item.total || 0).toFixed(2)}</Text>
                  <Text style={styles.cardSub}>Atendente: {item.currentAttendant || "-"}</Text>
                  <Text style={styles.cardSubMuted}>{formatOpenedAgo(item.openedAt)}</Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={MUTED} />
              </View>
            </TouchableOpacity>
          )}
        />
      )}

      <Modal transparent visible={createOpen} animationType="fade" onRequestClose={() => setCreateOpen(false)}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>Nova comanda</Text>

            <Text style={styles.modalLabel}>Apelido (opcional)</Text>
            <TextInput
              value={nickname}
              onChangeText={setNickname}
              placeholder="Ex: Bone azul"
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
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    backgroundColor: SECONDARY_BLUE,
    borderRadius: 12,
    paddingVertical: 12,
    marginBottom: 12,
  },
  newBtnText: { color: WHITE, fontSize: 16, fontWeight: "bold" },

  search: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
  },

  errorBox: {
    marginHorizontal: 16,
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  errorText: { fontSize: 13, fontWeight: "700", color: MUTED },
  retryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "700" },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "bold", color: TEXT, marginBottom: 6 },
  emptyText: { fontSize: 14, color: MUTED, textAlign: "center" },

  card: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
    marginHorizontal: 16,
    flexDirection: "row",
    alignItems: "center",
  },
  cardTitle: { fontSize: 16, fontWeight: "bold", color: TEXT },
  cardTotal: { marginTop: 4, fontSize: 14, fontWeight: "bold", color: PRIMARY_GREEN },
  cardSub: { marginTop: 4, fontSize: 14, color: MUTED },
  cardSubMuted: { marginTop: 2, fontSize: 12, color: MUTED },

  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    justifyContent: "center",
    padding: 18,
  },
  modalCard: {
    backgroundColor: WHITE,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: BORDER,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", color: TEXT, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "bold", color: TEXT, marginBottom: 8 },
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
  helper: { marginTop: 10, fontSize: 13, color: MUTED, fontWeight: "700" },

  modalButtonsRow: { flexDirection: "row", gap: 10, marginTop: 16 },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnPrimaryText: { color: WHITE, fontSize: 16, fontWeight: "bold" },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  modalBtnSecondaryText: { color: SECONDARY_BLUE, fontSize: 16, fontWeight: "bold" },
});
