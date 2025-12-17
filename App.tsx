import React from 'react';
import { Alert, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import ComandaDetalheScreen from './src/screens/ComandaDetalheScreen';
import ComandaAdicionarItemScreen from './src/screens/ComandaAdicionarItemScreen';
import ProdutosScreen from './src/screens/ProdutosScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';

import AppHeaderTitle from './src/components/AppHeaderTitle';
import { ComandaProvider } from './src/context/ComandaContext';

const RootStack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();
const ComandasStack = createNativeStackNavigator();

const PRIMARY_GREEN = '#2E7D32';

const STORAGE_KEYS = {
  attendantName: 'attendantName',
};

function ComandasStackNavigator() {
  return (
    <ComandasStack.Navigator>
      <ComandasStack.Screen
        name="ComandasHome"
        component={ComandasScreen}
        options={{ headerShown: false }}
      />
      <ComandasStack.Screen
        name="ComandaDetalhe"
        component={ComandaDetalheScreen}
        options={{ headerShown: false }}
      />
      <ComandasStack.Screen
        name="ComandaAdicionarItem"
        component={ComandaAdicionarItemScreen}
        options={{ headerShown: false }}
      />
    </ComandasStack.Navigator>
  );
}

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
                      } catch {
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

          if (route.name === 'Comandas') iconName = 'clipboard-outline';
          if (route.name === 'Produtos') iconName = 'fast-food-outline';
          if (route.name === 'Relatórios') iconName = 'stats-chart-outline';

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen name="Comandas" component={ComandasStackNavigator} options={{ title: 'Comandas' }} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} options={{ title: 'Produtos' }} />
      <Tab.Screen name="Relatórios" component={RelatoriosScreen} options={{ title: 'Relatórios' }} />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <ComandaProvider>
      <NavigationContainer>
        <RootStack.Navigator>
          <RootStack.Screen name="Login" component={LoginScreen} options={{ headerShown: false }} />
          <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
        </RootStack.Navigator>
      </NavigationContainer>
    </ComandaProvider>
  );
}
