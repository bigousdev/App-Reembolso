import { CATEGORY_LABELS, type Category, type CategoryTotals, type Entry, type Policy, emptyCategoryTotals } from '../types';
import { formatCurrency, formatDate } from './format';

export function sumEntries(entries: Entry[]): number {
  return entries.reduce((sum, entry) => sum + entry.value, 0);
}

export function totalsByCategory(entries: Entry[]): CategoryTotals {
  const totals = emptyCategoryTotals();
  for (const entry of entries) {
    totals[entry.category] += entry.value;
  }
  return totals;
}

const DAILY_LIMIT_CATEGORIES: Partial<Record<Category, keyof Policy>> = {
  alimentacao: 'dailyLimitAlimentacao',
  transporte: 'dailyLimitTransporte',
  estacionamento: 'dailyLimitEstacionamento',
  hospedagem: 'dailyLimitHospedagem',
};

export interface PolicyViolation {
  type: 'daily_limit' | 'missing_receipt';
  message: string;
}

export function findPolicyViolations(entries: Entry[], policy: Policy, currency: string): PolicyViolation[] {
  const violations: PolicyViolation[] = [];

  const totalsByDateAndCategory = new Map<string, number>();
  for (const entry of entries) {
    const key = `${entry.date}|${entry.category}`;
    totalsByDateAndCategory.set(key, (totalsByDateAndCategory.get(key) ?? 0) + entry.value);
  }

  for (const [key, total] of totalsByDateAndCategory) {
    const [date, category] = key.split('|') as [string, Category];
    const limitField = DAILY_LIMIT_CATEGORIES[category];
    if (!limitField) continue;
    const limit = policy[limitField] as number | null;
    if (limit != null && total > limit) {
      violations.push({
        type: 'daily_limit',
        message: `${formatDate(date)} · ${CATEGORY_LABELS[category]}: ${formatCurrency(total, currency)} excede o limite diário de ${formatCurrency(limit, currency)}`,
      });
    }
  }

  if (policy.receiptRequiredAbove != null) {
    for (const entry of entries) {
      if (entry.value > policy.receiptRequiredAbove && !entry.photoUri) {
        violations.push({
          type: 'missing_receipt',
          message: `${formatDate(entry.date)} · ${CATEGORY_LABELS[entry.category]} (${formatCurrency(entry.value, currency)}): falta foto da nota fiscal`,
        });
      }
    }
  }

  return violations.sort((a, b) => a.message.localeCompare(b.message));
}
