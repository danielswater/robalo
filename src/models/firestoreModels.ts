// src/models/firestoreModels.ts

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
