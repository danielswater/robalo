import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function ProdutosScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Produtos</Text>
      <Text style={styles.text}>
        Aqui vai a lista de produtos cadastrados da barraca.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#FAFAFA',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
  },
  text: {
    fontSize: 16,
  },
});
