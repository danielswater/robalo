import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useComandas } from '../context/ComandaContext';

type RouteParams = {
  id: string;
  nickname: string;
};

export default function ComandaDetalheScreen() {
  const navigation = useNavigation<any>();
  const route = useRoute<any>();

  const params = (route.params || {}) as RouteParams;
  const comandaId = params.id;
  const nickname = params.nickname || 'Comanda';

  const { getComandaById, getComandaTotal } = useComandas();

  const comanda = getComandaById(comandaId);
  const total = getComandaTotal(comandaId);

  const items = useMemo(() => comanda?.items ?? [], [comanda]);

  return (
    <View style={styles.container}>
      <View style={styles.topBar}>
        <TouchableOpacity style={styles.iconBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#1B1B1B" />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.title}>{nickname}</Text>
          <Text style={styles.subTitle}>Comanda aberta</Text>
        </View>
      </View>

      <View style={styles.box}>
        <Text style={styles.sectionTitle}>Itens</Text>

        {items.length === 0 ? (
          <Text style={styles.muted}>Ainda não tem itens nesta comanda.</Text>
        ) : (
          <FlatList
            data={items}
            keyExtractor={(it) => it.id}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => (
              <View style={styles.itemRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.itemName}>{item.name}</Text>
                  <Text style={styles.itemSub}>
                    {item.qty}x • R$ {item.price.toFixed(2)}
                  </Text>
                </View>
                <Text style={styles.itemTotal}>R$ {(item.price * item.qty).toFixed(2)}</Text>
              </View>
            )}
          />
        )}
      </View>

      <View style={styles.footer}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Total</Text>
          <Text style={styles.totalValue}>R$ {total.toFixed(2)}</Text>
        </View>

        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() =>
            navigation.navigate('ComandaAdicionarItem', {
              id: comandaId,
              nickname,
            })
          }
        >
          <Text style={styles.primaryBtnText}>Adicionar item</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondaryBtn} onPress={() => { }}>
          <Text style={styles.secondaryBtnText}>Fechar comanda (depois)</Text>
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

  box: {
    margin: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    flex: 1,
  },
  sectionTitle: { fontSize: 14, fontWeight: '800', color: '#1B1B1B', marginBottom: 8 },
  muted: { fontSize: 13, color: '#757575' },

  itemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EEEEEE',
    borderRadius: 12,
    padding: 12,
    backgroundColor: '#FFFFFF',
  },
  itemName: { fontSize: 14, fontWeight: '800', color: '#1B1B1B' },
  itemSub: { marginTop: 2, fontSize: 12, color: '#757575' },
  itemTotal: { marginLeft: 12, fontSize: 13, fontWeight: '800', color: '#2E7D32' },

  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#EEEEEE',
    backgroundColor: '#FFFFFF',
  },
  totalRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  totalLabel: { fontSize: 14, fontWeight: '700', color: '#1B1B1B' },
  totalValue: { fontSize: 14, fontWeight: '800', color: '#2E7D32' },

  primaryBtn: {
    backgroundColor: '#2E7D32',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    marginBottom: 10,
  },
  primaryBtnText: { color: '#FFFFFF', fontSize: 14, fontWeight: '800' },

  secondaryBtn: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2E7D32',
  },
  secondaryBtnText: { color: '#2E7D32', fontSize: 14, fontWeight: '800' },
});
