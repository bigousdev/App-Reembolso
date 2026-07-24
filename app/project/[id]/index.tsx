import { useCallback, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../src/components/Button';
import { CategoryTotalsCard } from '../../../src/components/CategoryTotalsCard';
import { EntryRow } from '../../../src/components/EntryRow';
import { listClosings } from '../../../src/db/closings';
import { listOpenEntries } from '../../../src/db/entries';
import { getProject } from '../../../src/db/projects';
import { colors } from '../../../src/theme';
import type { Closing, Entry, ProjectWithPolicy } from '../../../src/types';
import { formatCurrency, formatDate, monthLabel } from '../../../src/utils/format';
import { findPolicyViolations, totalsByCategory } from '../../../src/utils/policy';

export default function ProjectDashboardScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [project, setProject] = useState<ProjectWithPolicy | null>(null);
  const [openEntries, setOpenEntries] = useState<Entry[]>([]);
  const [closings, setClosings] = useState<Closing[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    const [proj, entries, closingsList] = await Promise.all([
      getProject(db, id),
      listOpenEntries(db, id),
      listClosings(db, id),
    ]);
    setProject(proj);
    setOpenEntries(entries);
    setClosings(closingsList);
    setLoading(false);
  }, [db, id]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading || !project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totals = totalsByCategory(openEntries);
  const violations = findPolicyViolations(openEntries, project.policy, project.currency);
  const hasPolicy = [
    project.policy.dailyLimitAlimentacao,
    project.policy.dailyLimitTransporte,
    project.policy.dailyLimitEstacionamento,
    project.policy.dailyLimitHospedagem,
    project.policy.receiptRequiredAbove,
    project.policy.notes,
  ].some((v) => v != null);

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <Text style={styles.projectName}>{project.name}</Text>
            <Link href={`/project/${project.id}/edit`} asChild>
              <Text style={styles.editLink}>Editar</Text>
            </Link>
          </View>
          {project.client ? <Text style={styles.projectMeta}>{project.client}</Text> : null}
          <Text style={styles.projectMeta}>
            {formatDate(project.startDate)}
            {project.endDate ? ` – ${formatDate(project.endDate)}` : ' – em andamento'}
            {project.costCenter ? ` · CC ${project.costCenter}` : ''}
          </Text>
        </View>

        {hasPolicy ? (
          <View style={styles.policyCard}>
            <Text style={styles.policyTitle}>Política de reembolso</Text>
            <View style={styles.policyGrid}>
              {project.policy.dailyLimitAlimentacao != null && (
                <Text style={styles.policyItem}>
                  🍽️ até {formatCurrency(project.policy.dailyLimitAlimentacao, project.currency)}/dia
                </Text>
              )}
              {project.policy.dailyLimitTransporte != null && (
                <Text style={styles.policyItem}>
                  🚗 até {formatCurrency(project.policy.dailyLimitTransporte, project.currency)}/dia
                </Text>
              )}
              {project.policy.dailyLimitEstacionamento != null && (
                <Text style={styles.policyItem}>
                  🅿️ até {formatCurrency(project.policy.dailyLimitEstacionamento, project.currency)}/dia
                </Text>
              )}
              {project.policy.dailyLimitHospedagem != null && (
                <Text style={styles.policyItem}>
                  🏨 até {formatCurrency(project.policy.dailyLimitHospedagem, project.currency)}/dia
                </Text>
              )}
              {project.policy.receiptRequiredAbove != null && (
                <Text style={styles.policyItem}>
                  🧾 nota obrigatória acima de {formatCurrency(project.policy.receiptRequiredAbove, project.currency)}
                </Text>
              )}
            </View>
            {project.policy.notes ? <Text style={styles.policyNotes}>{project.policy.notes}</Text> : null}
          </View>
        ) : null}

        <CategoryTotalsCard totals={totals} currency={project.currency} />

        {violations.length > 0 ? (
          <View style={styles.violationsCard}>
            <Text style={styles.violationsTitle}>⚠️ Fora da política ({violations.length})</Text>
            {violations.map((violation, index) => (
              <Text key={index} style={styles.violationText}>
                • {violation.message}
              </Text>
            ))}
          </View>
        ) : null}

        <View style={styles.actionsRow}>
          <View style={styles.actionButton}>
            <Button label="+ Lançamento" onPress={() => router.push(`/project/${project.id}/entries/new`)} />
          </View>
          <View style={styles.actionButton}>
            <Button
              label="Fechar período"
              variant="secondary"
              disabled={openEntries.length === 0}
              onPress={() => router.push(`/project/${project.id}/closings/new`)}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Lançamentos pendentes ({openEntries.length})</Text>
        {openEntries.length === 0 ? (
          <Text style={styles.emptyText}>
            Nenhum lançamento pendente. Toque em "+ Lançamento" para fotografar uma nota.
          </Text>
        ) : (
          openEntries.map((entry) => (
            <EntryRow
              key={entry.id}
              entry={entry}
              currency={project.currency}
              onPress={() => router.push(`/project/${project.id}/entries/${entry.id}`)}
            />
          ))
        )}

        {closings.length > 0 ? (
          <>
            <Text style={styles.sectionTitle}>Fechamentos anteriores</Text>
            {closings.map((closing) => (
              <Link key={closing.id} href={`/project/${project.id}/closings/${closing.id}`} asChild>
                <Pressable style={styles.closingRow}>
                  <View>
                    <Text style={styles.closingLabel}>{closing.label || monthLabel(closing.startDate)}</Text>
                    <Text style={styles.closingMeta}>
                      {formatDate(closing.startDate)} – {formatDate(closing.endDate)}
                    </Text>
                  </View>
                  <Text style={styles.closingTotal}>{formatCurrency(closing.totalGeral, project.currency)}</Text>
                </Pressable>
              </Link>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  headerCard: {
    marginBottom: 16,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectName: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
    flexShrink: 1,
  },
  editLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  projectMeta: {
    fontSize: 13,
    color: colors.textMuted,
    marginTop: 2,
  },
  policyCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  policyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.primaryDark,
    marginBottom: 8,
  },
  policyGrid: {
    gap: 4,
  },
  policyItem: {
    fontSize: 13,
    color: colors.text,
  },
  policyNotes: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 8,
    fontStyle: 'italic',
  },
  violationsCard: {
    backgroundColor: colors.warningBg,
    borderRadius: 14,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  violationsTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning,
    marginBottom: 6,
  },
  violationText: {
    fontSize: 12,
    color: '#92400E',
    marginBottom: 3,
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
    marginTop: 4,
  },
  emptyText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  closingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: colors.border,
  },
  closingLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  closingMeta: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  closingTotal: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary,
  },
});
