import React, { useEffect, useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, TextInput } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useComandas } from '../context/ComandaContext';

export default function ComandasScreen() {
  const navigation = useNavigation<any>();
  const { comandas, seedIfEmpty, getComandaTotal } = useComandas();

  const [search, setSearch] = useState('');

  useEffect(() => {
    seedIfEmpty();
  }, [seedIfEmpty]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    if (!s) return comandas;
    return comandas.filter((c) => c.nickname.toLowerCase().includes(s));
  }, [search, comandas]);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Comandas abertas</Text>

      <TextInput
        value={search}
        onChangeText={setSearch}
        placeholder="Buscar por apelido..."
        placeholderTextColor="#9E9E9E"
        style={styles.search}
      />

      {filtered.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Nenhuma comanda</Text>
          <Text style={styles.emptyText}>Crie uma nova comanda para começar.</Text>
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingBottom: 20 }}
          renderItem={({ item }) => {
            const total = getComandaTotal(item.id);

            return (
              <TouchableOpacity
                style={styles.card}
                onPress={() =>
                  navigation.navigate('ComandaDetalhe', {
                    id: item.id,
                    nickname: item.nickname,
                  })
                }
              >
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardTitle}>{item.nickname}</Text>
                  <Text style={styles.cardSub}>Toque para abrir</Text>
                </View>

                <Text style={styles.cardTotal}>R$ {total.toFixed(2)}</Text>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: '#FAFAFA' },
  title: { fontSize: 20, fontWeight: '700', color: '#1B1B1B', marginBottom: 12 },

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

  emptyBox: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 16,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#1B1B1B', marginBottom: 6 },
  emptyText: { fontSize: 14, color: '#616161' },

  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 12,
    padding: 14,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#1B1B1B' },
  cardSub: { marginTop: 2, fontSize: 12, color: '#757575' },
  cardTotal: { marginLeft: 10, fontSize: 14, fontWeight: '700', color: '#2E7D32' },
});
