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
