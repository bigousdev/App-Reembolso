export type Category =
  | 'alimentacao'
  | 'transporte'
  | 'estacionamento'
  | 'hospedagem'
  | 'outros';

export const CATEGORIES: Category[] = [
  'alimentacao',
  'transporte',
  'estacionamento',
  'hospedagem',
  'outros',
];

export const CATEGORY_LABELS: Record<Category, string> = {
  alimentacao: 'Alimentação',
  transporte: 'Transporte',
  estacionamento: 'Estacionamento',
  hospedagem: 'Hospedagem',
  outros: 'Outros',
};

export const CATEGORY_ICONS: Record<Category, string> = {
  alimentacao: '🍽️',
  transporte: '🚗',
  estacionamento: '🅿️',
  hospedagem: '🏨',
  outros: '🧾',
};

export type PaymentMethod = 'proprio' | 'cartao_corporativo' | 'dinheiro';

export const PAYMENT_METHOD_LABELS: Record<PaymentMethod, string> = {
  proprio: 'Cartão próprio',
  cartao_corporativo: 'Cartão corporativo',
  dinheiro: 'Dinheiro',
};

export interface Policy {
  projectId: string;
  dailyLimitAlimentacao: number | null;
  dailyLimitTransporte: number | null;
  dailyLimitEstacionamento: number | null;
  dailyLimitHospedagem: number | null;
  receiptRequiredAbove: number | null;
  notes: string | null;
}

export interface Project {
  id: string;
  name: string;
  client: string | null;
  costCenter: string | null;
  startDate: string;
  endDate: string | null;
  currency: string;
  notes: string | null;
  createdAt: string;
  archived: number;
}

export interface ProjectWithPolicy extends Project {
  policy: Policy;
}

export interface Entry {
  id: string;
  projectId: string;
  date: string;
  category: Category;
  description: string | null;
  value: number;
  paymentMethod: PaymentMethod;
  photoUri: string | null;
  createdAt: string;
  closingId: string | null;
}

export interface Closing {
  id: string;
  projectId: string;
  label: string;
  startDate: string;
  endDate: string;
  createdAt: string;
  totalAlimentacao: number;
  totalTransporte: number;
  totalEstacionamento: number;
  totalHospedagem: number;
  totalOutros: number;
  totalGeral: number;
}

export interface CategoryTotals {
  alimentacao: number;
  transporte: number;
  estacionamento: number;
  hospedagem: number;
  outros: number;
}

export function emptyCategoryTotals(): CategoryTotals {
  return {
    alimentacao: 0,
    transporte: 0,
    estacionamento: 0,
    hospedagem: 0,
    outros: 0,
  };
}
