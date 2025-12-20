import React, { useCallback, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Modal,
  KeyboardAvoidingView,
  Platform,
  Switch,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";

import type { Product, UnitType } from "../models/firestoreModels";
import { SHOP_ID } from "../models/firestoreModels";
import { productsRepo } from "../services/repos";

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const BORDER = "#E0E0E0";
const ERROR_RED = "#D32F2F";

function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace(".", ",")}`;
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, "");
  const number = Number(digits) / 100;
  if (!Number.isFinite(number)) return "R$ 0,00";
  return formatMoney(number);
}

function moneyInputToNumber(value: string) {
  const digits = value.replace(/\D/g, "");
  return Number(digits) / 100;
}

function numberToMoneyInput(value: number) {
  if (!Number.isFinite(value) || value < 0) return "R$ 0,00";
  return formatMoney(value);
}

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const loadProducts = useCallback(async (aliveRef?: { current: boolean }) => {
    try {
      setLoading(true);
      setError(null);
      const list = await productsRepo.list();
      if (aliveRef && !aliveRef.current) return;
      setProdutos(list);
    } catch {
      if (!aliveRef || aliveRef.current) {
        setProdutos([]);
        setError("Nao foi possivel carregar os produtos.");
      }
    } finally {
      if (!aliveRef || aliveRef.current) setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      const aliveRef = { current: true };
      loadProducts(aliveRef);
      return () => {
        aliveRef.current = false;
      };
    }, [loadProducts])
  );

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return produtos;
    return produtos.filter((p) => p.name.toLowerCase().includes(s));
  }, [produtos, search]);

  const toggleActive = async (id: string, active: boolean) => {
    try {
      await productsRepo.update(id, { active: !active });
      await loadProducts();
    } catch {
      Alert.alert("Erro", "Nao foi possivel atualizar o produto.");
    }
  };

  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [newName, setNewName] = useState("");
  const [priceInput, setPriceInput] = useState("R$ 0,00");
  const [newUnitType, setNewUnitType] = useState<UnitType>("unidade");
  const [newActive, setNewActive] = useState(true);

  const openCreate = () => {
    setEditingId(null);
    setNewName("");
    setPriceInput("R$ 0,00");
    setNewUnitType("unidade");
    setNewActive(true);
    setModalOpen(true);
  };

  const openEdit = (p: Product) => {
    setEditingId(p.id);
    setNewName(p.name);
    setPriceInput(numberToMoneyInput(p.price));
    setNewUnitType(p.unitType);
    setNewActive(p.active);
    setModalOpen(true);
  };

  const closeModal = () => setModalOpen(false);

  const saveModal = async () => {
    const name = newName.trim();
    if (name.length < 2) {
      Alert.alert("Nome invalido", "Digite o nome do produto.");
      return;
    }

    const price = moneyInputToNumber(priceInput);
    if (!Number.isFinite(price) || price <= 0) {
      Alert.alert("Preco invalido", "Digite um preco valido.");
      return;
    }

    try {
      if (editingId) {
        await productsRepo.update(editingId, {
          name,
          price,
          unitType: newUnitType,
          active: newActive,
        });
      } else {
        await productsRepo.create({
          shopId: SHOP_ID,
          name,
          price,
          unitType: newUnitType,
          active: newActive,
          updatedAt: new Date(),
        } as any);
      }

      await loadProducts();
      setModalOpen(false);
    } catch {
      Alert.alert("Erro", "Nao foi possivel salvar o produto.");
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.topArea}>
        <TouchableOpacity style={styles.newBtn} onPress={openCreate}>
          <Ionicons name="add" size={18} color={WHITE} />
          <Text style={styles.newBtnText}>Novo produto</Text>
        </TouchableOpacity>

        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto..."
          placeholderTextColor="#9E9E9E"
          style={styles.search}
        />
      </View>

      {loading ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Carregando...</Text>
        </View>
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>{error}</Text>
        </View>
      ) : filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>Nenhum produto</Text>
          <Text style={styles.emptyText}>Toque em "Novo produto" para cadastrar.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          contentContainerStyle={{ paddingBottom: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          renderItem={({ item }) => (
            <Pressable
              onPress={() => openEdit(item)}
              style={({ pressed }) => [styles.card, pressed && { opacity: 0.92 }]}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {formatMoney(item.price)} - {item.unitType}
                </Text>
              </View>

              <View style={styles.rightCol}>
                <View style={[styles.badge, item.active ? styles.badgeActive : styles.badgeInactive]}>
                  <Text style={[styles.badgeText, item.active ? styles.badgeTextActive : styles.badgeTextInactive]}>
                    {item.active ? "Ativo" : "Inativo"}
                  </Text>
                </View>

                <Pressable
                  onPress={(e: any) => {
                    e?.stopPropagation?.();
                    toggleActive(item.id, item.active);
                  }}
                  style={[styles.smallBtn, item.active ? styles.smallBtnOff : styles.smallBtnOn]}
                >
                  <Text style={styles.smallBtnText}>{item.active ? "Inativar" : "Ativar"}</Text>
                </Pressable>
              </View>
            </Pressable>
          )}
        />
      )}

      <Modal transparent visible={modalOpen} animationType="fade" onRequestClose={closeModal}>
        <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{editingId ? "Editar produto" : "Novo produto"}</Text>

            <Text style={styles.modalLabel}>Nome</Text>
            <TextInput
              value={newName}
              onChangeText={setNewName}
              placeholder="Ex: Pastel"
              placeholderTextColor="#9E9E9E"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Preco</Text>
            <TextInput
              value={priceInput}
              onChangeText={(v) => setPriceInput(formatMoneyInput(v))}
              keyboardType="number-pad"
              style={styles.modalInput}
            />

            <Text style={styles.modalLabel}>Tipo</Text>
            <View style={styles.unitRow}>
              {(["unidade", "porcao", "kg"] as UnitType[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[styles.unitBtn, newUnitType === t && styles.unitBtnSelected]}
                  onPress={() => setNewUnitType(t)}
                >
                  <Text style={[styles.unitText, newUnitType === t && styles.unitTextSelected]}>{t}</Text>
                </TouchableOpacity>
              ))}
            </View>

            <View style={styles.switchRow}>
              <Text style={styles.switchLabel}>Ativo</Text>
              <Switch value={newActive} onValueChange={setNewActive} />
            </View>

            <View style={styles.modalButtonsRow}>
              <TouchableOpacity style={styles.modalBtnSecondary} onPress={closeModal}>
                <Text style={styles.modalBtnSecondaryText}>Cancelar</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.modalBtnPrimary} onPress={saveModal}>
                <Text style={styles.modalBtnPrimaryText}>Salvar</Text>
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
  newBtnText: { color: WHITE, fontSize: 16, fontWeight: "900" },

  search: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
  },

  empty: { flex: 1, alignItems: "center", justifyContent: "center", padding: 20 },
  emptyTitle: { fontSize: 16, fontWeight: "900", color: TEXT, marginBottom: 6 },
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
    gap: 12,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", color: TEXT },
  cardSub: { marginTop: 4, fontSize: 14, color: MUTED },

  rightCol: { alignItems: "flex-end", gap: 10 },

  badge: {
    borderWidth: 1,
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeActive: { borderColor: PRIMARY_GREEN, backgroundColor: "#E8F5E9" },
  badgeInactive: { borderColor: "#BDBDBD", backgroundColor: "#F2F2F2" },

  badgeText: { fontSize: 12, fontWeight: "900" },
  badgeTextActive: { color: PRIMARY_GREEN },
  badgeTextInactive: { color: MUTED },

  smallBtn: {
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
  },
  smallBtnOn: { borderColor: PRIMARY_GREEN, backgroundColor: WHITE },
  smallBtnOff: { borderColor: ERROR_RED, backgroundColor: WHITE },

  smallBtnText: { fontSize: 12, fontWeight: "900", color: TEXT },

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
  modalTitle: { fontSize: 18, fontWeight: "900", color: TEXT, marginBottom: 12 },
  modalLabel: { fontSize: 14, fontWeight: "900", color: TEXT, marginBottom: 8 },

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

  unitRow: { flexDirection: "row", gap: 10, marginBottom: 12 },
  unitBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: WHITE,
  },
  unitBtnSelected: { borderColor: PRIMARY_GREEN, backgroundColor: "#E8F5E9" },
  unitText: { fontSize: 13, fontWeight: "900", color: TEXT },
  unitTextSelected: { color: PRIMARY_GREEN },

  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: WHITE,
  },
  switchLabel: { fontSize: 14, fontWeight: "900", color: TEXT },

  modalButtonsRow: { flexDirection: "row", gap: 10, marginTop: 4 },
  modalBtnPrimary: {
    flex: 1,
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
  },
  modalBtnPrimaryText: { color: WHITE, fontSize: 16, fontWeight: "900" },
  modalBtnSecondary: {
    flex: 1,
    backgroundColor: WHITE,
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
  },
  modalBtnSecondaryText: { color: SECONDARY_BLUE, fontSize: 16, fontWeight: "900" },
});
