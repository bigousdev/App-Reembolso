import { useCallback, useState } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../src/components/Button';
import { listProjectsWithTotals, type ProjectWithTotal } from '../src/db/projects';
import { colors } from '../src/theme';
import { formatCurrency, formatDate } from '../src/utils/format';

export default function ProjectsScreen() {
  const db = useSQLiteContext();
  const router = useRouter();
  const [projects, setProjects] = useState<ProjectWithTotal[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const data = await listProjectsWithTotals(db);
    setProjects(data);
    setLoading(false);
  }, [db]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <FlatList
        data={projects}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={
          !loading ? (
            <View style={styles.empty}>
              <Text style={styles.emptyTitle}>Nenhuma viagem cadastrada</Text>
              <Text style={styles.emptyText}>
                Crie um projeto para começar a registrar as despesas da sua viagem a serviço.
              </Text>
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <Link href={`/project/${item.id}`} asChild>
            <Pressable style={styles.card}>
              <View style={styles.cardHeader}>
                <Text style={styles.cardTitle}>{item.name}</Text>
                {item.openEntriesCount > 0 ? (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.openEntriesCount} pendente(s)</Text>
                  </View>
                ) : null}
              </View>
              {item.client ? <Text style={styles.cardSubtitle}>{item.client}</Text> : null}
              <View style={styles.cardFooter}>
                <Text style={styles.cardMeta}>
                  Desde {formatDate(item.startDate)}
                  {item.endDate ? ` até ${formatDate(item.endDate)}` : ''}
                </Text>
                <Text style={styles.cardTotal}>{formatCurrency(item.totalSpent, item.currency)}</Text>
              </View>
            </Pressable>
          </Link>
        )}
      />
      <View style={styles.footer}>
        <Button label="+ Novo Projeto" onPress={() => router.push('/project/new')} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  listContent: {
    padding: 16,
    flexGrow: 1,
  },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: colors.textMuted,
    textAlign: 'center',
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.text,
    flexShrink: 1,
  },
  cardSubtitle: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 2,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
  },
  cardMeta: {
    fontSize: 12,
    color: colors.textMuted,
  },
  cardTotal: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  badge: {
    backgroundColor: colors.warningBg,
    borderRadius: 20,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  badgeText: {
    color: colors.warning,
    fontSize: 12,
    fontWeight: '600',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    backgroundColor: colors.card,
  },
});
