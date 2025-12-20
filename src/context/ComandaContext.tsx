// src/context/ComandaContext.tsx
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  increment,
  onSnapshot,
  query,
  runTransaction,
  Timestamp,
  limit,
} from "firebase/firestore";

import { firebaseApp, ensureAnonAuth } from "../firebase";
import { SHOP_ID } from "../models/firestoreModels";
import type { OrderStatus, PaymentMethod } from "../models/firestoreModels";

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
  lineTotal: number;
  addedAt?: string | null;
};

export type Comanda = {
  id: string;
  nickname: string;
  status: OrderStatus;
  currentAttendant: string;
  attendantHistory: AttendantHistoryItem[];
  paymentMethod?: PaymentMethod | null;
  closedAt?: string | null;
  closedDate?: string | null;
  closedBy?: string | null;
  openedAt?: string | null;
  total: number;
  items?: ComandaItem[];
};

type ComandaContextValue = {
  comandas: Comanda[];
  ordersError: string | null;
  reloadOrders: () => void;

  getComandaById: (id: string) => Comanda | undefined;
  getComandaTotal: (id: string) => number;
  isComandaClosed: (id: string) => boolean;

  seedIfEmpty: () => void;
  createComanda: (nickname?: string, attendant?: string) => Promise<void>;

  addItemToComanda: (comandaId: string, item: Omit<ComandaItem, "id" | "lineTotal">) => Promise<boolean>;
  updateItemQty: (comandaId: string, itemId: string, qty: number) => Promise<boolean>;
  removeItemFromComanda: (comandaId: string, itemId: string) => Promise<boolean>;

  changeAttendant: (comandaId: string, newName: string) => Promise<boolean>;
  cancelEmptyComanda: (comandaId: string) => Promise<boolean>;

  closeComanda: (comandaId: string, paymentMethod: PaymentMethod) => Promise<boolean>;

  subscribeToComandaItems: (comandaId: string) => () => void;
};

const ComandaContext = createContext<ComandaContextValue | null>(null);
const db = getFirestore(firebaseApp);

function ordersCollection() {
  return collection(db, "shops", SHOP_ID, "orders");
}

function orderDoc(orderId: string) {
  return doc(db, "shops", SHOP_ID, "orders", orderId);
}

function itemsCollection(orderId: string) {
  return collection(db, "shops", SHOP_ID, "orders", orderId, "items");
}

function itemDoc(orderId: string, itemId: string) {
  return doc(db, "shops", SHOP_ID, "orders", orderId, "items", itemId);
}

function toIsoSafe(v: any): string | null {
  if (!v) return null;
  if (v instanceof Date) return v.toISOString();
  if (typeof v?.toDate === "function") return v.toDate().toISOString();
  if (typeof v === "string") {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d.toISOString();
  }
  return null;
}

function normalizeHistory(list: any): AttendantHistoryItem[] {
  if (!Array.isArray(list)) return [];
  return list.map((h) => ({
    name: String(h?.name ?? ""),
    from: toIsoSafe(h?.from) ?? new Date().toISOString(),
    to: toIsoSafe(h?.to),
  }));
}

function normalizeOrder(id: string, data: any): Comanda {
  const nicknameRaw = typeof data?.nickname === "string" ? data.nickname.trim() : "";
  const status: OrderStatus = data?.status === "closed" ? "closed" : "open";
  const total = typeof data?.total === "number" ? data.total : Number(data?.total ?? 0);

  return {
    id,
    nickname: nicknameRaw || "Sem apelido",
    status,
    currentAttendant: String(data?.currentAttendant ?? "Atendente"),
    attendantHistory: normalizeHistory(data?.attendantHistory),
    openedAt: toIsoSafe(data?.openedAt),
    closedAt: toIsoSafe(data?.closedAt),
    closedDate: data?.closedDate ?? null,
    paymentMethod: data?.paymentMethod ?? null,
    closedBy: data?.closedBy ?? null,
    total: Number.isFinite(total) ? total : 0,
  };
}

function normalizeItem(id: string, data: any): ComandaItem {
  const price = typeof data?.priceSnapshot === "number" ? data.priceSnapshot : Number(data?.priceSnapshot ?? 0);
  const qty = typeof data?.qty === "number" ? data.qty : Number(data?.qty ?? 0);
  const lineTotal =
    typeof data?.lineTotal === "number" ? data.lineTotal : Number(data?.lineTotal ?? price * qty);

  return {
    id,
    productId: String(data?.productId ?? id),
    name: String(data?.nameSnapshot ?? data?.name ?? ""),
    price: Number.isFinite(price) ? price : 0,
    qty: Number.isFinite(qty) ? qty : 0,
    lineTotal: Number.isFinite(lineTotal) ? lineTotal : 0,
    addedAt: toIsoSafe(data?.addedAt),
  };
}

function normalizeQty(qty: number) {
  if (!Number.isFinite(qty)) return 1;
  const fixed = Math.round(qty * 1000) / 1000;
  return fixed <= 0 ? 1 : fixed;
}

function formatClosedDate(d: Date) {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

export function ComandaProvider({ children }: { children: React.ReactNode }) {
  const [comandas, setComandas] = useState<Comanda[]>([]);
  const [itemsByComandaId, setItemsByComandaId] = useState<Record<string, ComandaItem[]>>({});
  const [ordersError, setOrdersError] = useState<string | null>(null);
  const [ordersReloadKey, setOrdersReloadKey] = useState(0);

  useEffect(() => {
    let alive = true;
    let unsub: (() => void) | null = null;

    ensureAnonAuth()
      .then(() => {
        if (!alive) return;

        setOrdersError(null);
        unsub = onSnapshot(
          ordersCollection(),
          (snap) => {
            const next = snap.docs.map((d) => normalizeOrder(d.id, d.data()));
            next.sort((a, b) => (b.openedAt || "").localeCompare(a.openedAt || ""));
            if (alive) setComandas(next);
          },
          () => {
            if (alive) {
              setComandas([]);
              setOrdersError("Nao foi possivel carregar as comandas.");
            }
          }
        );
      })
      .catch(() => {
        if (alive) {
          setComandas([]);
          setOrdersError("Sem conexao. Tente novamente.");
        }
      });

    return () => {
      alive = false;
      if (unsub) unsub();
    };
  }, [ordersReloadKey]);

  const reloadOrders = useCallback(() => {
    setOrdersReloadKey((prev) => prev + 1);
  }, []);

  const seedIfEmpty = () => {};

  const createComanda = async (nickname = "", attendant = "Atendente") => {
    await ensureAnonAuth();
    const currentAttendant = attendant.trim() || "Atendente";
    const now = Timestamp.now();

    const payload = {
      shopId: SHOP_ID,
      status: "open",
      nickname: nickname.trim() || "Sem apelido",
      currentAttendant,
      attendantHistory: [{ name: currentAttendant, from: now, to: null }],
      openedAt: now,
      closedAt: null,
      closedDate: null,
      paymentMethod: null,
      closedBy: null,
      total: 0,
    };

    await addDoc(ordersCollection(), payload as any);
  };

  const getComandaById = (id: string) => {
    const base = comandas.find((c) => c.id === id);
    if (!base) return undefined;
    const items = itemsByComandaId[id] ?? [];
    return { ...base, items };
  };

  const isComandaClosed = (id: string) => getComandaById(id)?.status === "closed";

  const getComandaTotal = (id: string) => {
    const c = getComandaById(id);
    if (!c) return 0;
    return Number.isFinite(c.total) ? c.total : 0;
  };

  const subscribeToComandaItems = (comandaId: string) => {
    let alive = true;
    let unsub: (() => void) | null = null;

    ensureAnonAuth()
      .then(() => {
        if (!alive) return;

        unsub = onSnapshot(
          itemsCollection(comandaId),
          (snap) => {
            const next = snap.docs.map((d) => normalizeItem(d.id, d.data()));
            next.sort((a, b) => (a.addedAt || "").localeCompare(b.addedAt || ""));
            setItemsByComandaId((prev) => ({ ...prev, [comandaId]: next }));
          },
          () => {
            if (alive) setItemsByComandaId((prev) => ({ ...prev, [comandaId]: [] }));
          }
        );
      })
      .catch(() => {
        if (alive) setItemsByComandaId((prev) => ({ ...prev, [comandaId]: [] }));
      });

    return () => {
      alive = false;
      if (unsub) unsub();
      setItemsByComandaId((prev) => {
        if (!prev[comandaId]) return prev;
        const copy = { ...prev };
        delete copy[comandaId];
        return copy;
      });
    };
  };

  const addItemToComanda = async (comandaId: string, item: Omit<ComandaItem, "id" | "lineTotal">) => {
    await ensureAnonAuth();
    const qty = normalizeQty(item.qty);
    if (!Number.isFinite(qty) || qty <= 0) return false;

    let changed = false;

    try {
      await runTransaction(db, async (tx) => {
        const orderRef = orderDoc(comandaId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) return;

        const orderData = orderSnap.data();
        if (orderData?.status === "closed") return;

        const itemRef = itemDoc(comandaId, item.productId);
        const itemSnap = await tx.get(itemRef);

        if (itemSnap.exists()) {
          const data = itemSnap.data();
          const priceSnapshot = Number(data?.priceSnapshot ?? item.price ?? 0);
          const oldQty = Number(data?.qty ?? 0);
          const newQty = normalizeQty(oldQty + qty);
          const delta = (newQty - oldQty) * priceSnapshot;

          tx.update(itemRef, {
            qty: newQty,
            lineTotal: newQty * priceSnapshot,
          } as any);

          tx.update(orderRef, { total: increment(delta) } as any);
        } else {
          const priceSnapshot = Number(item.price ?? 0);
          const lineTotal = qty * priceSnapshot;

          tx.set(itemRef, {
            productId: item.productId,
            nameSnapshot: item.name ?? "",
            priceSnapshot,
            qty,
            lineTotal,
            addedAt: Timestamp.now(),
          } as any);

          tx.update(orderRef, { total: increment(lineTotal) } as any);
        }

        changed = true;
      });
    } catch {
      return false;
    }

    return changed;
  };

  const updateItemQty = async (comandaId: string, itemId: string, qty: number) => {
    await ensureAnonAuth();
    const newQty = normalizeQty(qty);
    if (!Number.isFinite(newQty) || newQty <= 0) return false;

    let changed = false;

    try {
      await runTransaction(db, async (tx) => {
        const orderRef = orderDoc(comandaId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) return;
        if (orderSnap.data()?.status === "closed") return;

        const itemRef = itemDoc(comandaId, itemId);
        const itemSnap = await tx.get(itemRef);
        if (!itemSnap.exists()) return;

        const data = itemSnap.data();
        const priceSnapshot = Number(data?.priceSnapshot ?? 0);
        const oldQty = Number(data?.qty ?? 0);
        const delta = (newQty - oldQty) * priceSnapshot;

        tx.update(itemRef, {
          qty: newQty,
          lineTotal: newQty * priceSnapshot,
        } as any);

        tx.update(orderRef, { total: increment(delta) } as any);
        changed = true;
      });
    } catch {
      return false;
    }

    return changed;
  };

  const removeItemFromComanda = async (comandaId: string, itemId: string) => {
    await ensureAnonAuth();

    let changed = false;

    try {
      await runTransaction(db, async (tx) => {
        const orderRef = orderDoc(comandaId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) return;
        if (orderSnap.data()?.status === "closed") return;

        const itemRef = itemDoc(comandaId, itemId);
        const itemSnap = await tx.get(itemRef);
        if (!itemSnap.exists()) return;

        const data = itemSnap.data();
        const priceSnapshot = Number(data?.priceSnapshot ?? 0);
        const qty = Number(data?.qty ?? 0);
        const lineTotal =
          typeof data?.lineTotal === "number" ? data.lineTotal : Number(data?.lineTotal ?? priceSnapshot * qty);

        tx.delete(itemRef);
        tx.update(orderRef, { total: increment(-lineTotal) } as any);
        changed = true;
      });
    } catch {
      return false;
    }

    return changed;
  };

  const changeAttendant = async (comandaId: string, newName: string) => {
    await ensureAnonAuth();
    const nextName = newName.trim();
    if (!nextName) return false;

    let changed = false;

    try {
      await runTransaction(db, async (tx) => {
        const orderRef = orderDoc(comandaId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) return;
        if (orderSnap.data()?.status === "closed") return;

        const data = orderSnap.data();
        const history = Array.isArray(data?.attendantHistory) ? data.attendantHistory : [];
        const now = Timestamp.now();

        const closedHistory = history.map((h: any, idx: number) => {
          if (idx === history.length - 1 && !h?.to) {
            return { ...h, to: now };
          }
          return h;
        });

        closedHistory.push({ name: nextName, from: now, to: null });

        tx.update(orderRef, {
          currentAttendant: nextName,
          attendantHistory: closedHistory,
        } as any);

        changed = true;
      });
    } catch {
      return false;
    }

    return changed;
  };

  const cancelEmptyComanda = async (comandaId: string) => {
    await ensureAnonAuth();
    try {
      const orderRef = orderDoc(comandaId);
      const orderSnap = await getDoc(orderRef);
      if (!orderSnap.exists()) return false;
      if (orderSnap.data()?.status !== "open") return false;

      const itemsSnap = await getDocs(query(itemsCollection(comandaId), limit(1)));
      if (!itemsSnap.empty) return false;

      await deleteDoc(orderRef);
      return true;
    } catch {
      return false;
    }
  };

  const closeComanda = async (comandaId: string, paymentMethod: PaymentMethod) => {
    await ensureAnonAuth();

    let changed = false;

    try {
      await runTransaction(db, async (tx) => {
        const orderRef = orderDoc(comandaId);
        const orderSnap = await tx.get(orderRef);
        if (!orderSnap.exists()) return;

        const data = orderSnap.data();
        if (data?.status === "closed") return;

        const total = typeof data?.total === "number" ? data.total : Number(data?.total ?? 0);
        if (!Number.isFinite(total) || total <= 0) return;

        const now = Timestamp.now();
        const closedDate = formatClosedDate(new Date());
        const closedBy = String(data?.currentAttendant ?? "").trim() || null;

        tx.update(orderRef, {
          status: "closed",
          paymentMethod,
          closedAt: now,
          closedDate,
          closedBy,
        } as any);

        changed = true;
      });
    } catch {
      return false;
    }

    return changed;
  };

  const value = useMemo(
    () => ({
      comandas,
      ordersError,
      reloadOrders,
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
      subscribeToComandaItems,
    }),
    [comandas, itemsByComandaId, ordersError, reloadOrders]
  );

  return <ComandaContext.Provider value={value}>{children}</ComandaContext.Provider>;
}

export function useComandas() {
  const ctx = useContext(ComandaContext);
  if (!ctx) throw new Error("useComandas precisa estar dentro do ComandaProvider");
  return ctx;
}
