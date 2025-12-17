import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';

import LoginScreen from './src/screens/LoginScreen';
import ComandasScreen from './src/screens/ComandasScreen';
import ProdutosScreen from './src/screens/ProdutosScreen';
import RelatoriosScreen from './src/screens/RelatoriosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const PRIMARY_GREEN = '#2E7D32';

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        // 👉 HEADER DAS TELAS DAS ABAS (VOLTA A APARECER)
        headerShown: true,
        headerTitleAlign: 'left',
        headerStyle: {
          backgroundColor: '#FFFFFF',
          borderBottomWidth: 1,
          borderBottomColor: '#E0E0E0', // linha embaixo, como na doc
        },
        headerTitleStyle: {
          fontSize: 20,
          fontWeight: '700',
        },

        // 👉 CONFIG DAS ABAS
        tabBarActiveTintColor: PRIMARY_GREEN,
        tabBarInactiveTintColor: '#757575',
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '600',
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any;

          if (route.name === 'Comandas') {
            iconName = 'clipboard-outline'; // lista/comanda
          } else if (route.name === 'Produtos') {
            iconName = 'fast-food-outline'; // lanchinho
          } else if (route.name === 'Relatórios') {
            iconName = 'stats-chart-outline'; // gráfico
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tab.Screen
        name="Comandas"
        component={ComandasScreen}
        options={{ title: 'Comandas' }}
      />
      <Tab.Screen
        name="Produtos"
        component={ProdutosScreen}
        options={{ title: 'Produtos' }}
      />
      <Tab.Screen
        name="Relatórios"
        component={RelatoriosScreen}
        options={{ title: 'Relatórios' }}
      />
    </Tab.Navigator>
  );
}

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Login">
        {/* Login SEM header */}
        <Stack.Screen
          name="Login"
          component={LoginScreen}
          options={{ headerShown: false }}
        />

        {/* Abas COM header próprio (configurado no Tab.Navigator) */}
        <Stack.Screen
          name="MainTabs"
          component={MainTabs}
          options={{ headerShown: false }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
