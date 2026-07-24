import { StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { CATEGORY_ICONS, CATEGORY_LABELS, CATEGORIES, type CategoryTotals } from '../types';
import { formatCurrency } from '../utils/format';

interface CategoryTotalsCardProps {
  totals: CategoryTotals;
  currency: string;
}

export function CategoryTotalsCard({ totals, currency }: CategoryTotalsCardProps) {
  const total = Object.values(totals).reduce((sum, v) => sum + v, 0);
  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <Text style={styles.title}>Total do período</Text>
        <Text style={styles.total}>{formatCurrency(total, currency)}</Text>
      </View>
      {CATEGORIES.map((category) => {
        const value = totals[category];
        if (value === 0) return null;
        return (
          <View key={category} style={styles.line}>
            <Text style={styles.lineLabel}>
              {CATEGORY_ICONS[category]} {CATEGORY_LABELS[category]}
            </Text>
            <Text style={styles.lineValue}>{formatCurrency(value, currency)}</Text>
          </View>
        );
      })}
      {total === 0 ? <Text style={styles.empty}>Nenhum lançamento ainda.</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
  },
  total: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.primary,
  },
  line: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  lineLabel: {
    fontSize: 14,
    color: colors.text,
  },
  lineValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  empty: {
    fontSize: 13,
    color: colors.textMuted,
  },
});
