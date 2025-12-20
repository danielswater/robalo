// src/services/productsRepo.ts
// Contrato (interface) para buscar e salvar Produtos.
// Depois vamos criar 2 versões:
// - productsRepo.mock.ts (local/mock)
// - productsRepo.fs.ts (Firestore)

import type { Product } from "../models/firestoreModels";

export interface ProductsRepo {
  /** Lista todos os produtos (ativos e inativos, se você quiser). */
  list(): Promise<Product[]>;

  /** Pega 1 produto pelo id (ou null se não existir). */
  getById(id: string): Promise<Product | null>;

  /** Cria um produto e devolve o produto criado (já com id). */
  create(data: Omit<Product, "id">): Promise<Product>;

  /** Atualiza um produto (parcial) e devolve o produto atualizado. */
  update(id: string, patch: Partial<Omit<Product, "id">>): Promise<Product>;

  /** Remove (ou desativa) um produto. A implementação decide. */
  remove(id: string): Promise<void>;
}
