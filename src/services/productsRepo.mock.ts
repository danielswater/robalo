// src/services/productsRepo.mock.ts
// Local mock implementation for ProductsRepo.

import type { ProductsRepo } from "./productsRepo";
import type { Product } from "../models/firestoreModels";
import { SHOP_ID } from "../models/firestoreModels";

import { MOCK_PRODUCTS } from "../data/mockProducts";

type RawProduct = {
  id: string;
  name: string;
  price: number;
};

function clone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function normalizeProduct(raw: RawProduct): Product {
  return {
    id: raw.id,
    shopId: SHOP_ID,
    name: raw.name,
    price: raw.price,
    unitType: "unidade",
    active: true,
    updatedAt: new Date(),
  };
}

const rawProducts = MOCK_PRODUCTS as unknown as RawProduct[];

let productsDb: Product[] = rawProducts.map(normalizeProduct);

export const productsRepoMock: ProductsRepo = {
  async list() {
    return clone(productsDb);
  },

  async getById(id: string) {
    const found = productsDb.find((p) => p.id === id);
    return found ? clone(found) : null;
  },

  async create(data) {
    const newItem: Product = {
      id: String(Date.now()),
      ...(data as Omit<Product, "id">),
      updatedAt: new Date(),
    };

    productsDb = [newItem, ...productsDb];
    return clone(newItem);
  },

  async update(id, patch) {
    const idx = productsDb.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error("Produto nao encontrado (mock)");

    const updated: Product = {
      ...productsDb[idx],
      ...(patch as any),
      id,
      updatedAt: new Date(),
    };

    productsDb[idx] = updated;
    return clone(updated);
  },

  async remove(id) {
    productsDb = productsDb.map((p) => (p.id === id ? { ...p, active: false } : p));
  },
};
