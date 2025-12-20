// src/services/productsRepo.fs.ts
// Firestore implementation for Products.

import { firebaseApp, ensureAnonAuth } from "../firebase";
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  getDoc,
  addDoc,
  updateDoc,
  setDoc,
  serverTimestamp,
  query,
  limit,
} from "firebase/firestore";

import type { ProductsRepo } from "./productsRepo";
import type { Product, UnitType } from "../models/firestoreModels";
import { SHOP_ID } from "../models/firestoreModels";

const db = getFirestore(firebaseApp);

function productsCollection() {
  return collection(db, "shops", SHOP_ID, "products");
}

function rootProductsCollection() {
  return collection(db, "products");
}

function toDateSafe(v: any): Date {
  if (!v) return new Date();
  if (v instanceof Date) return v;
  if (typeof v?.toDate === "function") return v.toDate();
  return new Date();
}

function normalizeUnitType(value: any): UnitType {
  const raw = String(value || "").toLowerCase();
  if (raw.startsWith("kg")) return "kg";
  if (raw.startsWith("por")) return "porcao";
  return "unidade";
}

function normalizeProduct(id: string, data: any): Product {
  return {
    id,
    shopId: data.shopId ?? SHOP_ID,
    name: data.name ?? "",
    price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
    unitType: normalizeUnitType(data.unitType),
    active: typeof data.active === "boolean" ? data.active : true,
    updatedAt: toDateSafe(data.updatedAt),
  };
}

async function migrateRootProductsIfNeeded() {
  const target = productsCollection();
  const existing = await getDocs(query(target, limit(1)));
  if (!existing.empty) return;

  const legacySnap = await getDocs(rootProductsCollection());
  if (legacySnap.empty) return;

  await Promise.all(
    legacySnap.docs.map(async (d) => {
      const data = d.data() || {};
      const payload = {
        shopId: SHOP_ID,
        name: data.name ?? "",
        price: typeof data.price === "number" ? data.price : Number(data.price ?? 0),
        unitType: normalizeUnitType(data.unitType),
        active: typeof data.active === "boolean" ? data.active : true,
        updatedAt: data.updatedAt ?? serverTimestamp(),
      };

      await setDoc(doc(productsCollection(), d.id), payload as any);
    })
  );
}

export const productsRepoFs: ProductsRepo = {
  async list() {
    await ensureAnonAuth();
    try {
      await migrateRootProductsIfNeeded();
    } catch {
      // Ignore migration errors (permissions or missing legacy collection).
    }
    const snap = await getDocs(productsCollection());
    const items = snap.docs.map((d) => normalizeProduct(d.id, d.data()));
    items.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
    return items;
  },

  async getById(id: string) {
    await ensureAnonAuth();
    const ref = doc(productsCollection(), id);
    const snap = await getDoc(ref);
    if (!snap.exists()) return null;
    return normalizeProduct(snap.id, snap.data());
  },

  async create(data) {
    await ensureAnonAuth();
    const payload = {
      ...data,
      shopId: SHOP_ID,
      updatedAt: serverTimestamp(),
    };

    const ref = await addDoc(productsCollection(), payload as any);

    return {
      id: ref.id,
      ...(data as any),
      shopId: SHOP_ID,
      updatedAt: new Date(),
    } as Product;
  },

  async update(id, patch) {
    await ensureAnonAuth();
    const ref = doc(productsCollection(), id);

    await updateDoc(ref, {
      ...patch,
      updatedAt: serverTimestamp(),
    } as any);

    const snap = await getDoc(ref);
    if (!snap.exists()) throw new Error("Produto nao encontrado (Firestore)");
    return normalizeProduct(snap.id, snap.data());
  },

  async remove(id) {
    await ensureAnonAuth();
    await updateDoc(doc(productsCollection(), id), {
      active: false,
      updatedAt: serverTimestamp(),
    } as any);
  },
};
