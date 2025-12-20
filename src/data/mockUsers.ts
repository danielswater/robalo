export type AppUser = {
  id: string;
  name: string;
  pin: string;
  active: boolean;
};

// ✅ Lista fictícia (MVP). Depois você troca pelos nomes reais.
// Regra: atendente NUNCA digita o nome. Só escolhe na lista.
// PIN pode ser igual para todos (por enquanto), mas fica por usuário.
export const USERS_MOCK: AppUser[] = [
  { id: 'u1', name: 'Otavio', pin: '1234', active: true },
  { id: 'u2', name: 'Yohanna', pin: '1234', active: true },
  //{ id: 'u3', name: 'Ariel', pin: '1234', active: true },
];
