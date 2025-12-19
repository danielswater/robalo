# Documentação do Código — Comanda Barraca

## Estrutura de Diretórios (src)

- `src/components/AppHeaderTitle.tsx` — título do cabeçalho com nome do atendente.
- `src/context/ComandaContext.tsx` — estado e regras de negócio de comandas.
- `src/data/mockProducts.ts` — lista mock de produtos.
- `src/data/mockUsers.ts` — lista mock de usuários/atendentes.
- `src/models/firestoreModels.ts` — modelos pensados para integração com Firestore.
- `src/screens/ComandaAdicionarItemScreen.tsx` — adicionar itens à comanda.
- `src/screens/ComandaDetalheScreen.tsx` — detalhes, edição e fechamento de comanda.
- `src/screens/ComandasScreen.tsx` — listagem e criação de comandas abertas.
- `src/screens/LoginScreen.tsx` — seleção de atendente + PIN simples.
- `src/screens/ProdutosScreen.tsx` — CRUD local de produtos (MVP).
- `src/screens/RelatoriosScreen.tsx` — relatórios por período (total e por pagamento).
- `src/firebase.ts` — inicialização do Firebase (client).

## Descrição por Arquivo + Código

### `src/components/AppHeaderTitle.tsx`
- Exibe o título da tela e o nome do atendente carregado de `AsyncStorage`.

```tsx
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
```

### `src/context/ComandaContext.tsx`
- Contexto global com operações: criar comanda, adicionar/editar/remover item, trocar atendente, cancelar comanda vazia e fechar comanda.

```tsx
// src/context/ComandaContext.tsx
import React, { createContext, useContext, useMemo, useState } from 'react';

export type PaymentMethod = 'CASH' | 'CARD' | 'PIX';

export type AttendantHistoryItem = {
  name: string;
  from: string;
  to: string | null;
};

export type ComandaItem = {
  id: string;
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type ComandaStatus = 'OPEN' | 'CLOSED';

export type Comanda = {
  id: string;
  nickname: string;
  status: ComandaStatus;
  currentAttendant: string;
  attendantHistory: AttendantHistoryItem[];
  paymentMethod?: PaymentMethod;
  closedAt?: string;
  items: ComandaItem[];
};

type ComandaContextValue = {
  comandas: Comanda[];

  getComandaById: (id: string) => Comanda | undefined;
  getComandaTotal: (id: string) => number;
  isComandaClosed: (id: string) => boolean;

  seedIfEmpty: () => void;
  createComanda: (nickname?: string, attendant?: string) => void;

  addItemToComanda: (comandaId: string, item: Omit<ComandaItem, 'id'>) => boolean;
  updateItemQty: (comandaId: string, itemId: string, qty: number) => boolean;
  removeItemFromComanda: (comandaId: string, itemId: string) => boolean;

  changeAttendant: (comandaId: string, newName: string) => boolean;

  cancelEmptyComanda: (comandaId: string) => boolean;

  closeComanda: (comandaId: string, paymentMethod: PaymentMethod) => boolean;
};

const ComandaContext = createContext<ComandaContextValue | null>(null);

function moneyTotal(items: ComandaItem[]) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

function normalizeQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  return Math.max(1, Math.round(qty));
}

export function ComandaProvider({ children }: { children: React.ReactNode }) {
  const [comandas, setComandas] = useState<Comanda[]>([]);

  const seedIfEmpty = () => {
    setComandas((prev) => {
      if (prev.length > 0) return prev;
      const now = new Date().toISOString();
      return [
        {
          id: '1',
          nickname: 'Mesa 01',
          status: 'OPEN',
          currentAttendant: 'Atendente',
          attendantHistory: [{ name: 'Atendente', from: now, to: null }],
          items: [],
        },
      ];
    });
  };

  const createComanda = (nickname = '', attendant = 'Atendente') => {
    const id = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
    const now = new Date().toISOString();

    setComandas((prev) => [
      ...prev,
      {
        id,
        nickname: nickname || 'Sem apelido',
        status: 'OPEN',
        currentAttendant: attendant,
        attendantHistory: [{ name: attendant, from: now, to: null }],
        items: [],
      },
    ]);
  };

  const getComandaById = (id: string) => comandas.find((c) => c.id === id);

  const isComandaClosed = (id: string) => getComandaById(id)?.status === 'CLOSED';

  const getComandaTotal = (id: string) => {
    const c = getComandaById(id);
    if (!c) return 0;
    return moneyTotal(c.items);
  };

  const addItemToComanda = (comandaId: string, item: Omit<ComandaItem, 'id'>) => {
    let changed = false;

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId || c.status === 'CLOSED') return c;

        const existingIndex = c.items.findIndex((it) => it.productId === item.productId);

        if (existingIndex >= 0) {
          const copy = [...c.items];
          const old = copy[existingIndex];
          copy[existingIndex] = {
            ...old,
            qty: normalizeQty(old.qty + item.qty),
          };
          changed = true;
          return { ...c, items: copy };
        }

        changed = true;
        return {
          ...c,
          items: [
            ...c.items,
            {
              ...item,
              id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
              qty: normalizeQty(item.qty),
            },
          ],
        };
      })
    );

    return changed;
  };

  const updateItemQty = (comandaId: string, itemId: string, qty: number) => {
    const fixedQty = normalizeQty(qty);
    let changed = false;

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId || c.status === 'CLOSED') return c;

        const nextItems = c.items.map((it) => {
          if (it.id !== itemId) return it;
          changed = true;
          return { ...it, qty: fixedQty };
        });

        return { ...c, items: nextItems };
      })
    );

    return changed;
  };

  const removeItemFromComanda = (comandaId: string, itemId: string) => {
    let changed = false;

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId || c.status === 'CLOSED') return c;

        const nextItems = c.items.filter((it) => it.id !== itemId);
        changed = nextItems.length !== c.items.length;
        return { ...c, items: nextItems };
      })
    );

    return changed;
  };

  const changeAttendant = (comandaId: string, newName: string) => {
    if (!newName.trim()) return false;
    let changed = false;
    const now = new Date().toISOString();

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId || c.status === 'CLOSED') return c;

        const history = c.attendantHistory.map((h) => (h.to === null ? { ...h, to: now } : h));
        history.push({ name: newName.trim(), from: now, to: null });

        changed = true;
        return {
          ...c,
          currentAttendant: newName.trim(),
          attendantHistory: history,
        };
      })
    );

    return changed;
  };

  // ✅ Regra do MVP: comanda ABERTA e SEM ITENS pode ser cancelada/excluída.
  const cancelEmptyComanda = (comandaId: string) => {
    let changed = false;

    setComandas((prev) => {
      const target = prev.find((c) => c.id === comandaId);
      if (!target) return prev;
      if (target.status !== 'OPEN') return prev;
      if ((target.items || []).length > 0) return prev;

      changed = true;
      return prev.filter((c) => c.id !== comandaId);
    });

    return changed;
  };

  const closeComanda = (comandaId: string, paymentMethod: PaymentMethod) => {
    let changed = false;

    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId || c.status === 'CLOSED') return c;

        changed = true;
        return {
          ...c,
          status: 'CLOSED',
          paymentMethod,
          closedAt: new Date().toISOString(),
        };
      })
    );

    return changed;
  };

  const value = useMemo(
    () => ({
      comandas,
      getComandaById,
      getComandaTotal,
      isComandaClosed,
      seedIfEmpty,
      createComanda,
      addItemToComanda,
      updateItemQty,
      removeItemFromComanda,
      changeAttendant,
      cancelEmptyComanda,
      closeComanda,
    }),
    [comandas]
  );

  return <ComandaContext.Provider value={value}>{children}</ComandaContext.Provider>;
}

export function useComandas() {
  const ctx = useContext(ComandaContext);
  if (!ctx) throw new Error('useComandas precisa estar dentro do ComandaProvider');
  return ctx;
}
```

### `src/data/mockProducts.ts`
- Lista simples de produtos (MVP) usada em `ComandaAdicionarItemScreen`.

```ts
export type Product = {
  id: string;
  name: string;
  price: number;
};

export const MOCK_PRODUCTS: Product[] = [
  { id: 'p1', name: 'Água', price: 3.5 },
  { id: 'p2', name: 'Refrigerante', price: 6.0 },
  { id: 'p3', name: 'Cerveja', price: 9.0 },
  { id: 'p4', name: 'Batata frita', price: 18.0 },
  { id: 'p5', name: 'Isca de peixe', price: 32.0 },
  { id: 'p6', name: 'Porção de camarão', price: 45.0 },
];
```

### `src/data/mockUsers.ts`
- Usuários fictícios para login rápido, com `PIN` por usuário.

```ts
export type AppUser = {
  id: string;
  name: string;
  pin: string;
  active: boolean;
};

export const USERS_MOCK: AppUser[] = [
  { id: 'u1', name: 'Otavio', pin: '4321', active: true },
  { id: 'u2', name: 'Ana', pin: '1234', active: true },
  { id: 'u3', name: 'Ariel', pin: '1234', active: true },
];
```

### `src/models/firestoreModels.ts`
- Interfaces pensadas para quando houver persistência em Firestore.

```ts
export const SHOP_ID = 'minha-barraca';

export type UnitType = 'unidade' | 'porção' | 'kg';

export interface Product {
  id: string;
  shopId: string;
  name: string;
  price: number;
  unitType: UnitType;
  active: boolean;
  updatedAt: Date;
}

export interface AttendantHistoryItem {
  name: string;
  from: Date;
  to: Date | null;
}

export type OrderStatus = 'open' | 'closed';
export type PaymentMethod = 'pix' | 'card' | 'cash';

export interface Order {
  id: string;
  shopId: string;
  status: OrderStatus;
  nickname: string;
  currentAttendant: string;
  attendantHistory: AttendantHistoryItem[];
  openedAt: Date;
  closedAt: Date | null;
  closedDate: string | null;
  paymentMethod: PaymentMethod | null;
  total: number;
}

export interface OrderItem {
  id: string;
  productId: string;
  nameSnapshot: string;
  priceSnapshot: number;
  qty: number;
  lineTotal: number;
  addedAt: Date;
}
```

### `src/screens/LoginScreen.tsx`
- Escolha de atendente pela lista (`USERS_MOCK`) — o atendente NÃO digita o nome; somente digita o `PIN`. O nome escolhido é salvo no `AsyncStorage` e a navegação segue para `MainTabs`.

```tsx
async function handleLogin() {
  if (!selectedUser) {
    setError('Escolha um atendente.');
    return;
  }

  if (!pin || pin.length < 4) {
    setError('Digite o PIN.');
    return;
  }

  if (pin !== selectedUser.pin) {
    setError('PIN incorreto.');
    return;
  }

  try {
    await AsyncStorage.setItem(STORAGE_KEYS.attendantName, selectedUser.name);

    navigation.reset({
      index: 0,
      routes: [{ name: 'MainTabs' }],
    });
  } catch {
    setError('Não consegui salvar o login. Tente de novo.');
  }
}
```

### `src/screens/ComandasScreen.tsx`
- Lista e cria comandas abertas; busca por apelido; carrega atendente do `AsyncStorage`.

```tsx
useEffect(() => {
  seedIfEmpty();
}, [seedIfEmpty]);

useEffect(() => {
  let alive = true;

  async function loadAttendant() {
    try {
      const saved = await AsyncStorage.getItem(STORAGE_KEYS.attendantName);
      const name = (saved || '').trim();
      if (alive) setAttendantName(name.length >= 2 ? name : 'Atendente');
    } catch {
      if (alive) setAttendantName('Atendente');
    }
  }

  loadAttendant();
  return () => {
    alive = false;
  };
}, []);

const openComandas = useMemo(() => {
  const s = search.trim().toLowerCase();
  return (comandas || [])
    .filter((c) => c.status === 'OPEN')
    .filter((c) => !s || (c.nickname || '').toLowerCase().includes(s));
}, [comandas, search]);

const onCreate = () => {
  createComanda(nickname.trim(), attendantName);
  setCreateOpen(false);
  setNickname('');
};
```

### `src/screens/ComandaAdicionarItemScreen.tsx`
- Tela para adicionar itens; pesquisa por produto e “adicionar todos” ao finalizar.

```tsx
const [qtyByProduct, setQtyByProduct] = useState<Record<string, number>>({});

const totals = useMemo(() => {
  const entries = Object.entries(qtyByProduct);
  let items = 0;
  let products = 0;

  for (const [, qty] of entries) {
    if (qty > 0) {
      items += qty;
      products += 1;
    }
  }

  return { items, products };
}, [qtyByProduct]);

const addAllToComanda = () => {
  if (totals.items <= 0) return;

  for (const [productId, qty] of Object.entries(qtyByProduct)) {
    if (qty <= 0) continue;

    const p = MOCK_PRODUCTS.find((x) => x.id === productId);
    if (!p) continue;

    addItemToComanda(comandaId, {
      productId: p.id,
      name: p.name,
      price: p.price,
      qty,
    });
  }

  setQtyByProduct({});
  navigation.goBack();
};
```

### `src/screens/ComandaDetalheScreen.tsx`
- Fechamento de comanda com método de pagamento e troca de atendente (com histórico).

```tsx
const confirmClose = () => {
  Alert.alert('Fechar comanda', `Confirmar fechamento no ${paymentLabel(payment)}?`, [
    { text: 'Cancelar', style: 'cancel' },
    {
      text: 'Confirmar',
      onPress: () => {
        const ok = closeComanda(comandaId, payment);
        setClosing(false);

        if (!ok) {
          Alert.alert('Ops', 'Essa comanda já estava fechada.');
          return;
        }

        Alert.alert('Comanda fechada', `Pagamento: ${paymentLabel(payment)}`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      },
    },
  ]);
};

const openTrocarAtendente = () => {
  if (closed) {
    Alert.alert('Comanda fechada', 'Essa comanda já foi fechada. Não dá pra trocar atendente.');
    return;
  }

  if (activeUsers.length === 0) {
    Alert.alert('Sem usuários', 'Não há usuários ativos cadastrados.');
    return;
  }

  setAttModal(true);
};
```

### `src/screens/ProdutosScreen.tsx`
- Catálogo local com preço e tipo de unidade; inclui máscara de dinheiro para input.

```tsx
function formatMoney(v: number) {
  return `R$ ${v.toFixed(2).replace('.', ',')}`;
}

function formatMoneyInput(value: string) {
  const digits = value.replace(/\D/g, '');
  const number = Number(digits) / 100;
  if (!Number.isFinite(number)) return 'R$ 0,00';
  return formatMoney(number);
}

export default function ProdutosScreen() {
  const [produtos, setProdutos] = useState<Produto[]>([
    { id: 'p1', name: 'Água', price: 3.5, unitType: 'unidade', active: true },
    { id: 'p2', name: 'Refrigerante', price: 6.0, unitType: 'unidade', active: true },
    { id: 'p3', name: 'Cerveja', price: 9.0, unitType: 'unidade', active: true },
    { id: 'p4', name: 'Batata frita', price: 18.0, unitType: 'porção', active: true },
    { id: 'p5', name: 'Isca de peixe', price: 32.0, unitType: 'porção', active: false },
  ]);
  // ...
}
```

### `src/screens/RelatoriosScreen.tsx`
- Relatórios por período; soma total e separa por método de pagamento.

```tsx
const totals = useMemo(() => {
  let total = 0;
  let pix = 0;
  let card = 0;
  let cash = 0;

  for (const c of closedInRange) {
    const t = getComandaTotal(c.id);
    total += t;

    if (c.paymentMethod === 'PIX') pix += t;
    else if (c.paymentMethod === 'CARD') card += t;
    else if (c.paymentMethod === 'CASH') cash += t;
  }

  return { total, pix, card, cash, count: closedInRange.length };
}, [closedInRange, getComandaTotal]);
```

### `App.tsx`
- Navegação com abas (`Comandas`, `Produtos`, `Relatórios`) e `Stack` para telas de fluxo da comanda; usa `ComandaProvider` como wrapper global.

```tsx
const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route, navigation }) => ({
        headerShown: true,
        headerTitleAlign: 'left',
        headerTitle: () => <AppHeaderTitle title={route.name} />,
        headerRight: () => /* botão de trocar atendente */,
        tabBarActiveTintColor: '#2E7D32',
      })}
    >
      <Tab.Screen name="Comandas" component={ComandasScreen} />
      <Tab.Screen name="Produtos" component={ProdutosScreen} />
      <Tab.Screen name="Relatórios" component={RelatoriosScreen} />
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
          <Stack.Screen name="ComandaDetalhe" component={ComandaDetalheScreen} options={{ headerShown: false }} />
          <Stack.Screen name="ComandaAdicionarItem" component={ComandaAdicionarItemScreen} options={{ headerShown: false }} />
        </Stack.Navigator>
      </NavigationContainer>
    </ComandaProvider>
  );
}
```

### `src/firebase.ts`
- Inicialização do app Firebase (client).

```ts
import { initializeApp } from 'firebase/app';

const firebaseConfig = {
  apiKey: "AIzaSyDLWg56RGpxQ2eJ1JHUv0fQegDmULmWnUQ",
  authDomain: "comanda-barraca.firebaseapp.com",
  projectId: "comanda-barraca",
  storageBucket: "comanda-barraca.appspot.com",
  messagingSenderId: "768792966844",
  appId: "1:768792966844:web:766be7f836c2ea58f642b9"
};

export const firebaseApp = initializeApp(firebaseConfig);
```

### `index.ts`
- Registro do componente raiz com Expo.

```ts
import { registerRootComponent } from 'expo';
import App from './App';
registerRootComponent(App);
```


