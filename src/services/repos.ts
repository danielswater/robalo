// src/services/repos.ts
// Centraliza qual repositório usar (mock ou Firestore), sem quebrar o app.

import { USE_FIRESTORE } from "./dataMode";

import { productsRepoMock } from "./productsRepo.mock";

// (vai existir no próximo passo)
import { productsRepoFs } from "./productsRepo.fs";

// Exporta o repo "oficial" que o app deve usar
export const productsRepo = USE_FIRESTORE ? productsRepoFs : productsRepoMock;
