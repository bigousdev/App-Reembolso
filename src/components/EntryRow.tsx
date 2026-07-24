import { Image, Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';
import { CATEGORY_ICONS, CATEGORY_LABELS, type Entry } from '../types';
import { formatCurrency, formatDate } from '../utils/format';

interface EntryRowProps {
  entry: Entry;
  currency: string;
  onPress?: () => void;
}

export function EntryRow({ entry, currency, onPress }: EntryRowProps) {
  return (
    <Pressable onPress={onPress} style={styles.row}>
      {entry.photoUri ? (
        <Image source={{ uri: entry.photoUri }} style={styles.thumb} />
      ) : (
        <View style={[styles.thumb, styles.thumbPlaceholder]}>
          <Text style={styles.thumbIcon}>{CATEGORY_ICONS[entry.category]}</Text>
        </View>
      )}
      <View style={styles.info}>
        <Text style={styles.category}>{CATEGORY_LABELS[entry.category]}</Text>
        <Text style={styles.description} numberOfLines={1}>
          {entry.description || formatDate(entry.date)}
        </Text>
        <Text style={styles.date}>{formatDate(entry.date)}</Text>
      </View>
      <Text style={styles.value}>{formatCurrency(entry.value, currency)}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  thumb: {
    width: 44,
    height: 44,
    borderRadius: 8,
    marginRight: 12,
  },
  thumbPlaceholder: {
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },
  thumbIcon: {
    fontSize: 20,
  },
  info: {
    flex: 1,
  },
  category: {
    fontSize: 13,
    fontWeight: '600',
    color: colors.text,
  },
  description: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 1,
  },
  date: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 2,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.text,
    marginLeft: 8,
  },
});
