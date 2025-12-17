import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput, Alert } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { MOCK_PRODUCTS, Product } from '../data/mockProducts';
import { useComandas } from '../context/ComandaContext';

type RouteParams = {
  id: string; // comandaId
  nickname: string;
};

export default function ComandaAdicionarItemScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();
  const params = (route.params || {}) as RouteParams;

  const comandaId = params.id;
  const nickname = params.nickname || 'Comanda';

  const { addItemToComanda } = useComandas();

  const [search, setSearch] = useState('');
  const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return MOCK_PRODUCTS;
    return MOCK_PRODUCTS.filter((p) => p.name.toLowerCase().includes(s));
  }, [search]);

  const getQty = (productId: string) => qtyByProduct[productId] ?? 1;

  const changeQty = (productId: string, delta: number) => {
    setQtyByProduct((prev) => {
      const current = prev[productId] ?? 1;
      const next = Math.max(1, current + delta);
      return { ...prev, [productId]: next };
    });
  };

  const addProduct = (p: Product) => {
    const qty = getQty(p.id);

    addItemToComanda(comandaId, {
      productId: p.id,
      name: p.name,
      price: p.price,
      qty,
    });

    Alert.alert('Adicionado', `${qty}x ${p.name} na comanda ${nickname}`);
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1B1B1B" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>Adicionar item</Text>
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
          renderItem={({ item }) => {
            const qty = getQty(item.id);

            return (
              <View style={styles.card}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.name}</Text>
                  <Text style={styles.cardSub}>R$ {item.price.toFixed(2)}</Text>
                </View>

                <View style={styles.qtyBox}>
                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, -1)}>
                    <Text style={styles.qtyBtnText}>-</Text>
                  </TouchableOpacity>

                  <Text style={styles.qtyText}>{qty}</Text>

                  <TouchableOpacity style={styles.qtyBtn} onPress={() => changeQty(item.id, +1)}>
                    <Text style={styles.qtyBtnText}>+</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.addBtn} onPress={() => addProduct(item)}>
                  <Text style={styles.addBtnText}>Adicionar</Text>
                </TouchableOpacity>
              </View>
            );
          }}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FAFAFA' },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 14,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#EEEEEE',
  },
  iconBtn: { paddingRight: 12, paddingVertical: 6 },
  title: { fontSize: 18, fontWeight: '800', color: '#1B1B1B' },
  subTitle: { marginTop: 2, fontSize: 12, color: '#616161' },

  body: { flex: 1, padding: 16 },

  search: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#1B1B1B',
    marginBottom: 12,
  },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 12,
  },
  cardTitle: { fontSize: 14, fontWeight: '800', color: '#1B1B1B' },
  cardSub: { marginTop: 2, fontSize: 12, color: '#757575' },

  qtyBox: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 10,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    overflow: 'hidden',
  },
  qtyBtn: { paddingHorizontal: 10, paddingVertical: 8, backgroundColor: '#FAFAFA' },
  qtyBtnText: { fontSize: 16, fontWeight: '900', color: '#1B1B1B' },
  qtyText: { paddingHorizontal: 10, fontSize: 13, fontWeight: '800', color: '#1B1B1B' },

  addBtn: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
  },
  addBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
});
