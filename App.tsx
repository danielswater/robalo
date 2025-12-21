import React, { useEffect, useState } from 'react';
import { ActivityIndicator, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import ProdutosScreen from './src/screens/ProdutosScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';

import ComandaDetalheScreen from './src/screens/ComandaDetalheScreen';
import ComandaAdicionarItemScreen from './src/screens/ComandaAdicionarItemScreen';

import AppHeaderTitle from './src/components/AppHeaderTitle';
import { AlertProvider, useAppAlert } from './src/components/AppAlert';
import { ComandaProvider } from './src/context/ComandaContext';
import AppSplash from './src/components/appsplash';

import { ensureAnonAuth } from './src/firebase';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY_GREEN = '#2E7D32';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
  attendantId: 'attendantId',
};

function MainTabs() {
  const [loggingOut, setLoggingOut] = useState(false);
  const { show } = useAppAlert();

  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerTitleAlign: 'left',

        headerTitle: () => {
          const titlesMap: Record<string, string> = {
            Comandas: 'Comandas',
            Produtos: 'Produtos',
            'Relatórios': 'Relatórios',
          };

          const title = titlesMap[route.name] || route.name;
          return <AppHeaderTitle title={title} />;
        },

        headerRight: () => (
          <TouchableOpacity
            style={{ paddingHorizontal: 14, paddingVertical: 8 }}
            onPress={async () => {
              if (loggingOut) return;
              try {
                setLoggingOut(true);
                await AsyncStorage.multiRemove([
                  STORAGE_KEYS.attendantName,
                  STORAGE_KEYS.attendantId,
                ]);

                const parent = navigation.getParent();
                parent?.reset({
                  index: 0,
                  routes: [{ name: 'Login' }],
                });
              } catch (e) {
                show('Erro', 'Nao consegui trocar o atendente.');
                setLoggingOut(false);
              }
            }}
          >
            {loggingOut ? (
              <ActivityIndicator size="small" color="#424242" />
            ) : (
              <Ionicons name="log-out-outline" size={22} color="#424242" />
            )}
          </TouchableOpacity>
        ),

        headerStyle: { backgroundColor: '#FFFFFF' },
        headerTintColor: '#1B1B1B',
        headerShadowVisible: false,

        tabBarActiveTintColor: PRIMARY_GREEN,
        tabBarInactiveTintColor: '#757575',
        tabBarStyle: {
          backgroundColor: '#FFFFFF',
          borderTopColor: '#E0E0E0',
        },

        tabBarIcon: ({ color, size }) => {
          let iconName: any;

          if (route.name === 'Comandas') {
            iconName = 'clipboard-outline';
          } else if (route.name === 'Produtos') {
            iconName = 'fast-food-outline';
          } else if (route.name === 'Relatórios') {
            iconName = 'stats-chart-outline';
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Comandas" component={ComandasScreen} options={{ title: 'Comandas' }} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} options={{ title: 'Produtos' }} />
      <Tab.Screen name="Relatórios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 700);
    ensureAnonAuth().catch(() => { });

    return () => {
      clearTimeout(timer);
    };
  }, []);

  if (showSplash) {
    return <AppSplash />;
  }

  return (
    <ComandaProvider>
      <AlertProvider>
        <NavigationContainer>
        <Stack.Navigator>
          <Stack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />

          {/* ✅ Fluxo correto: telas da Comanda ficam no Stack (fora das Tabs) */}
          <Stack.Screen
            name="ComandaDetalhe"
            component={ComandaDetalheScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="ComandaAdicionarItem"
            component={ComandaAdicionarItemScreen}
            options={{ headerShown: false }}
          />
        </Stack.Navigator>
        </NavigationContainer>
      </AlertProvider>
    </ComandaProvider>
  );
}
