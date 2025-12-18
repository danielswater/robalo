import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { MOCK_PRODUCTS, Product } from '../data/mockProducts';
import { useComandas } from '../context/ComandaContext';

type RouteParams = {
  id: string; // comandaId
  nickname: string;
};

const PRIMARY_GREEN = '#2E7D32';
const SECONDARY_BLUE = '#1976D2';
const BG = '#F5F5F5';
const WHITE = '#FFFFFF';
const TEXT = '#212121';
const MUTED = '#757575';
const BORDER = '#E0E0E0';

export default function ComandaAdicionarItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const insets = useSafeAreaInsets();

  const params = (route.params || {}) as RouteParams;

  const comandaId = params.id;
  const nickname = params.nickname || 'Comanda';

  const { addItemToComanda } = useComandas();

  const [search, setSearch] = useState('');

  // ✅ Carrinho: quantidade começa em 0 (nada selecionado)
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(s));
  }, [search]);

  const getQty = (productId: string) => qtyByProduct[productId] ?? 0;

  const changeQty = (productId: string, delta: number) => {
    setQtyByProduct((prev) => {
      const current = prev[productId] ?? 0;
      const next = Math.max(0, current + delta);

      // se voltar pra 0, remove do objeto pra ficar limpo
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
    let products = 0;

    for (const [, qty] of entries) {
      if (qty > 0) {
        items += qty;
        products += 1;
      }
    }

    return { items, products };
  }, [qtyByProduct]);

  const addAllToComanda = () => {
    if (totals.items <= 0) return;

    // usa a lista total (MOCK_PRODUCTS) pra garantir que acha o produto mesmo se estiver filtrado
    for (const [productId, qty] of Object.entries(qtyByProduct)) {
      if (qty <= 0) continue;

      const p = MOCK_PRODUCTS.find((x) => x.id === productId);
      if (!p) continue;

      addItemToComanda(comandaId, {
        productId: p.id,
        name: p.name,
        price: p.price,
        qty,
      });
    }

    // limpa e volta
    setQtyByProduct({});
    navigation.goBack();
  };

  const buttonLabel =
    totals.items <= 0
      ? 'Adicionar itens à comanda'
      : `Adicionar (${totals.items} item${totals.items === 1 ? '' : 's'})`;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {/* ✅ Safe Area no topo pra não ficar embaixo da barra do celular */}
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

        <FlatList
          data={filtered}
          keyExtractor={(it) => it.id}
          ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
          contentContainerStyle={{ paddingBottom: 16 }}
          renderItem={({ item }) => {
            const qty = getQty(item.id);

            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>R$ {item.price.toFixed(2)}</Text>
                </View>

                <View style={styles.qtyBox}>
                  <TouchableOpacity
                    style={[styles.qtyBtn, qty === 0 && styles.qtyBtnDisabled]}
                    onPress={() => changeQty(item.id, -1)}
                    disabled={qty === 0}
                  >
                    <Text style={[styles.qtyBtnText, qty === 0 && styles.qtyBtnTextDisabled]}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyText}>{qty}</Text>

                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, +1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      </View>

      {/* ✅ Botão final (carrinho) */}
      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        {totals.items > 0 ? (
          <Text style={styles.footerHint}>
            {totals.products} produto(s) • {totals.items} item(ns)
          </Text>
        ) : (
          <Text style={styles.footerHintMuted}>Escolha as quantidades e toque em “Adicionar”.</Text>
        )}

        <TouchableOpacity
          style={[styles.primaryBtn, totals.items <= 0 && styles.primaryBtnDisabled]}
          disabled={totals.items <= 0}
          onPress={addAllToComanda}
        >
          <Text style={[styles.primaryBtnText, totals.items <= 0 && styles.primaryBtnTextDisabled]}>
            {buttonLabel}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: WHITE,
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconBtn: { paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 18, fontWeight: '800', color: TEXT },
  subTitle: { marginTop: 2, fontSize: 12, color: '#616161' },

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

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: WHITE,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: TEXT },
  cardSub: { marginTop: 2, fontSize: 12, color: MUTED },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 12, paddingVertical: 10, backgroundColor: '#FAFAFA' },
  qtyBtnDisabled: { backgroundColor: '#F2F2F2' },
  qtyBtnText: { fontSize: 16, fontWeight: '900', color: TEXT },
  qtyBtnTextDisabled: { color: '#9E9E9E' },
  qtyText: { paddingHorizontal: 12, fontSize: 13, fontWeight: '800', color: TEXT, minWidth: 24, textAlign: 'center' },

  footer: {
    borderTopWidth: 1,
    borderTopColor: BORDER,
    backgroundColor: WHITE,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  footerHint: { marginBottom: 10, fontSize: 12, color: MUTED, fontWeight: '800' },
  footerHintMuted: { marginBottom: 10, fontSize: 12, color: MUTED, fontWeight: '700' },

  primaryBtn: {
    backgroundColor: PRIMARY_GREEN,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  primaryBtnDisabled: {
    backgroundColor: '#C8E6C9',
  },
  primaryBtnText: { color: WHITE, fontSize: 14, fontWeight: '900' },
  primaryBtnTextDisabled: { color: '#FFFFFF' },
});
