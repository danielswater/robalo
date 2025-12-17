import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
};

type Props = {
  title: string;
};

export default function AppHeaderTitle({ title }: Props) {
  const [name, setName] = useState<string>('');

  useEffect(() => {
    let isMounted = true;

    async function load() {
      try {
        const savedName = await AsyncStorage.getItem(STORAGE_KEYS.attendantName);
        if (isMounted) setName((savedName || '').trim());
      } catch {
        if (isMounted) setName('');
      }
    }

    load();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <View style={styles.wrap}>
      <Text style={styles.title}>{title}</Text>
      {name ? <Text style={styles.subTitle}>{name}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'column',
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1B1B1B',
  },
  subTitle: {
    marginTop: 1,
    fontSize: 12,
    color: '#616161',
  },
});
