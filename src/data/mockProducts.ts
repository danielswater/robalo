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
