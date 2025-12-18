import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
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
import { ComandaProvider } from './src/context/ComandaContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY_GREEN = '#2E7D32';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
};

function MainTabs() {
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
            onPress={() => {
              Alert.alert(
                'Trocar atendente',
                'Isso vai apagar o nome salvo e voltar pro Login.',
                [
                  { text: 'Cancelar', style: 'cancel' },
                  {
                    text: 'Trocar',
                    style: 'destructive',
                    onPress: async () => {
                      try {
                        await AsyncStorage.removeItem(STORAGE_KEYS.attendantName);

                        const parent = navigation.getParent();
                        parent?.reset({
                          index: 0,
                          routes: [{ name: 'Login' }],
                        });
                      } catch (e) {
                        Alert.alert('Erro', 'Não consegui trocar o atendente.');
                      }
                    },
                  },
                ]
              );
            }}
          >
            <Ionicons name="log-out-outline" size={22} color="#424242" />
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
  return (
    <ComandaProvider>
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
    </ComandaProvider>
  );
}
