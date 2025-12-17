import React, { createContext, useContext, useMemo, useState } from 'react';

export type ComandaItem = {
  id: string; // id único do item na comanda
  productId: string;
  name: string;
  price: number;
  qty: number;
};

export type Comanda = {
  id: string;
  nickname: string;
  items: ComandaItem[];
};

type ComandaContextValue = {
  comandas: Comanda[];
  getComandaById: (id: string) => Comanda | undefined;
  getComandaTotal: (id: string) => number;

  // por enquanto: comanda já existe (você cria onde quiser depois)
  seedIfEmpty: () => void;

  addItemToComanda: (comandaId: string, item: Omit<ComandaItem, 'id'>) => void;
};

const ComandaContext = createContext<ComandaContextValue | null>(null);

function moneyTotal(items: ComandaItem[]) {
  return items.reduce((sum, it) => sum + it.price * it.qty, 0);
}

export function ComandaProvider({ children }: { children: React.ReactNode }) {
  const [comandas, setComandas] = useState<Comanda[]>([
    // deixa vazio ou com seed; eu deixei vazio e a tela faz seed se necessário
  ]);

  const seedIfEmpty = () => {
    setComandas((prev) => {
      if (prev.length > 0) return prev;
      return [
        { id: '1', nickname: 'Mesa 01', items: [] },
        { id: '2', nickname: 'João', items: [] },
      ];
    });
  };

  const getComandaById = (id: string) => comandas.find((c) => c.id === id);

  const getComandaTotal = (id: string) => {
    const c = getComandaById(id);
    if (!c) return 0;
    return moneyTotal(c.items);
  };

  const addItemToComanda = (comandaId: string, item: Omit<ComandaItem, 'id'>) => {
    setComandas((prev) =>
      prev.map((c) => {
        if (c.id !== comandaId) return c;

        // Se já tem o mesmo produto, soma a quantidade (mais simples e útil)
        const existingIndex = c.items.findIndex((it) => it.productId === item.productId);
        if (existingIndex >= 0) {
          const copy = [...c.items];
          const old = copy[existingIndex];
          copy[existingIndex] = { ...old, qty: old.qty + item.qty };
          return { ...c, items: copy };
        }

        const newItemId = `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return { ...c, items: [...c.items, { ...item, id: newItemId }] };
      })
    );
  };

  const value = useMemo<ComandaContextValue>(
    () => ({
      comandas,
      getComandaById,
      getComandaTotal,
      seedIfEmpty,
      addItemToComanda,
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
