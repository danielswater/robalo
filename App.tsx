import 'react-native-gesture-handler';

import React from 'react';
import { Text, View } from 'react-native';

import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { MaterialIcons } from '@expo/vector-icons';

// ----- TELAS SIMPLES (temporárias) -----

function HomeScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Comandas</Text>
    </View>
  );
}

function ProdutosScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Produtos</Text>
    </View>
  );
}

function RelatoriosScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <Text>Relatórios</Text>
    </View>
  );
}

// ----- TABS -----

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={{
          headerShown: true,
          tabBarActiveTintColor: '#2E7D32',
        }}
      >
        <Tab.Screen
          name="Home"
          component={HomeScreen}
          options={{
            title: 'Comandas',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="list-alt" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Produtos"
          component={ProdutosScreen}
          options={{
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="lunch-dining" size={size} color={color} />
            ),
          }}
        />

        <Tab.Screen
          name="Relatorios"
          component={RelatoriosScreen}
          options={{
            title: 'Relatórios',
            tabBarIcon: ({ color, size }: { color: string; size: number }) => (
              <MaterialIcons name="bar-chart" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}
