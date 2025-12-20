import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert, ActivityIndicator } from "react-native";
import { useFocusEffect, useNavigation, useRoute } from "@react-navigation/native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import type { Product, UnitType } from "../models/firestoreModels";
import { productsRepo } from "../services/repos";
import { useComandas } from "../context/ComandaContext";

type RouteParams = {
  id: string; // comandaId
  nickname: string;
};

const PRIMARY_GREEN = "#2E7D32";
const SECONDARY_BLUE = "#1976D2";
const BG = "#F5F5F5";
const WHITE = "#FFFFFF";
const TEXT = "#212121";
const MUTED = "#757575";
const BORDER = "#E0E0E0";

function stepForUnit(unitType: UnitType) {
  return unitType === "kg" ? 0.1 : 1;
}

function roundQty(qty: number) {
  return Math.round(qty * 1000) / 1000;
}

function formatQtyDisplay(qty: number) {
  if (!Number.isFinite(qty)) return "0";
  const rounded = Math.round(qty);
  if (Math.abs(qty - rounded) < 0.001) return String(rounded);
  return String(roundQty(qty));
}

export default function ComandaAdicionarItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = (route.params || {}) as RouteParams;

  const comandaId = params.id;
  const nickname = params.nickname || "Comanda";

  const { addItemToComanda } = useComandas();

  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const [adding, setAdding] = useState(false);

  useFocusEffect(
    useCallback(() => {
      let alive = true;

      const load = async () => {
        try {
          setLoading(true);
          setError(null);
          const list = await productsRepo.list();
          if (!alive) return;
          setProducts(list);
        } catch {
          if (alive) {
            setProducts([]);
            setError("Nao foi possivel carregar os produtos.");
          }
        } finally {
          if (alive) setLoading(false);
        }
      };

      load();
      return () => {
        alive = false;
      };
    }, [reloadKey])
  );

  const activeProducts = useMemo(() => products.filter((p) => p.active !== false), [products]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return activeProducts;
    return activeProducts.filter((p) => p.name.toLowerCase().includes(s));
  }, [search, activeProducts]);

  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const getQty = (productId: string) => qtyByProduct[productId] ?? 0;

  const changeQty = (productId: string, unitType: UnitType, delta: number) => {
    const step = stepForUnit(unitType);
    setQtyByProduct((prev) => {
      const current = prev[productId] ?? 0;
      const next = roundQty(Math.max(0, current + delta * step));

      if (next === 0) {
        const copy = { ...prev };
        delete copy[productId];
        return copy;
      }

      return { ...prev, [productId]: next };
    });
  };

  const totals = useMemo(() => {
    const entries = Object.entries(qtyByProduct);
    let items = 0;
    let productsCount = 0;

    for (const [, qty] of entries) {
      if (qty > 0) {
        items += qty;
        productsCount += 1;
      }
    }

    return { items, products: productsCount };
  }, [qtyByProduct]);

  const addAllToComanda = async () => {
    if (totals.items <= 0 || adding) return;
    setAdding(true);

    let failed = false;
    try {
      for (const [productId, qty] of Object.entries(qtyByProduct)) {
        if (qty <= 0) continue;

        const p = activeProducts.find((x) => x.id === productId);
        if (!p) continue;

        const ok = await addItemToComanda(comandaId, {
          productId: p.id,
          name: p.name,
          price: p.price,
          qty,
        });

        if (!ok) failed = true;
      }

      setQtyByProduct({});
      if (failed) {
        Alert.alert("Atualizando...", "Tente de novo.");
      } else {
        navigation.popToTop();
      }
    } finally {
      setAdding(false);
    }
  };

  const itemsLabel = formatQtyDisplay(totals.items);

  const buttonLabel =
    totals.items <= 0
      ? "Adicionar itens a comanda"
      : `Adicionar (${itemsLabel} item${totals.items === 1 ? "" : "s"})`;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      <View style={[styles.topBar, { paddingTop: insets.top + 8 }]}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color={TEXT} />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Adicionar itens</Text>
          <Text style={styles.subTitle}>{nickname}</Text>
        </View>
      </View>

      <View style={styles.body}>
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder="Buscar produto..."
          placeholderTextColor="#9E9E9E"
          style={styles.search}
        />

        {loading ? (
          <View style={styles.empty}>
            <ActivityIndicator size="small" color={MUTED} />
            <Text style={[styles.emptyText, { marginTop: 8 }]}>Carregando...</Text>
          </View>
        ) : error ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>{error}</Text>
            <TouchableOpacity style={styles.retryBtn} onPress={() => setReloadKey((v) => v + 1)}>
              <Text style={styles.retryText}>Recarregar</Text>
            </TouchableOpacity>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Nenhum produto ativo. Va em Produtos e cadastre.</Text>
          </View>
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(it) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            contentContainerStyle={{ paddingBottom: 16 }}
            renderItem={({ item }) => {
              const qty = getQty(item.id);
              const displayQty = item.unitType === "kg" ? formatQtyDisplay(qty) : String(Math.round(qty));

              return (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cardTitle}>{item.name}</Text>
                    <Text style={styles.cardSub}>R$ {item.price.toFixed(2)}</Text>
                  </View>

                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                      onPress={() => changeQty(item.id, item.unitType, -1)}
                      disabled={qty === 0}
                    >
                      <Text style={[styles.qtyBtnText, qty === 0 && styles.qtyBtnTextDisabled]}>-</Text>
                    </TouchableOpacity>

                    <Text style={styles.qtyText}>{displayQty}</Text>

                    <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, item.unitType, +1)}>
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              );
            }}
          />
        )}

      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {totals.items > 0 ? (
          <Text style={styles.footerHint}>
            {totals.products} produto(s) - {itemsLabel} item(ns)
          </Text>
        ) : (
          <Text style={styles.footerHintMuted}>Escolha as quantidades e toque em "Adicionar".</Text>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, (totals.items <= 0 || adding) && styles.primaryBtnDisabled]}
          disabled={totals.items <= 0 || adding}
          onPress={addAllToComanda}
        >
          {adding ? (
            <ActivityIndicator size="small" color={WHITE} />
          ) : (
            <Text style={[styles.primaryBtnText, totals.items <= 0 && styles.primaryBtnTextDisabled]}>
              {buttonLabel}
            </Text>
          )}
        </TouchableOpacity>
      </View>
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
    borderBottomColor: "#EEEEEE",
  },
  iconBtn: { paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 18, fontWeight: "800", color: TEXT },
  subTitle: { marginTop: 2, fontSize: 12, color: "#616161" },

  body: { flex: 1, padding: 16 },

  search: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: TEXT,
    marginBottom: 12,
  },

  empty: {
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 14,
  },
  emptyText: { fontSize: 14, color: MUTED, fontWeight: "700" },
  retryBtn: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: SECONDARY_BLUE,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
  },
  retryText: { color: SECONDARY_BLUE, fontSize: 14, fontWeight: "700" },

  card: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: "800", color: TEXT },
  cardSub: { marginTop: 2, fontSize: 12, color: MUTED },

  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    marginLeft: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: "hidden",
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: "#FAFAFA" },
  qtyBtnDisabled: { backgroundColor: "#F2F2F2" },
  qtyBtnText: { fontSize: 16, fontWeight: "900", color: TEXT },
  qtyBtnTextDisabled: { color: "#9E9E9E" },
  qtyText: {
    paddingHorizontal: 12,
    fontSize: 13,
    fontWeight: "800",
    color: TEXT,
    minWidth: 24,
    textAlign: "center",
  },

  footer: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerHint: { marginBottom: 10, fontSize: 12, color: MUTED, fontWeight: "800" },
  footerHintMuted: { marginBottom: 10, fontSize: 12, color: MUTED, fontWeight: "700" },

  primaryBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  primaryBtnDisabled: {
    backgroundColor: "#C8E6C9",
  },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: "900" },
  primaryBtnTextDisabled: { color: "#FFFFFF" },
});
