import { useEffect, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../../src/components/Button';
import { CategoryTotalsCard } from '../../../../src/components/CategoryTotalsCard';
import { EntryRow } from '../../../../src/components/EntryRow';
import { FormField } from '../../../../src/components/FormField';
import { createClosing } from '../../../../src/db/closings';
import { listOpenEntries } from '../../../../src/db/entries';
import { getProject } from '../../../../src/db/projects';
import { colors } from '../../../../src/theme';
import type { Entry, ProjectWithPolicy } from '../../../../src/types';
import { formatDate, monthLabel, todayIso } from '../../../../src/utils/format';
import { findPolicyViolations, totalsByCategory } from '../../../../src/utils/policy';

export default function NewClosingScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [project, setProject] = useState<ProjectWithPolicy | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [label, setLabel] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    Promise.all([getProject(db, id), listOpenEntries(db, id)]).then(([proj, openEntries]) => {
      setProject(proj);
      setEntries(openEntries);
      const referenceDate = openEntries[openEntries.length - 1]?.date ?? todayIso();
      setLabel(monthLabel(referenceDate));
    });
  }, [db, id]);

  if (!project) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const totals = totalsByCategory(entries);
  const violations = findPolicyViolations(entries, project.policy, project.currency);
  const dates = entries.map((e) => e.date).sort();
  const startDate = dates[0] ?? todayIso();
  const endDate = dates[dates.length - 1] ?? todayIso();

  async function handleConfirm() {
    setSaving(true);
    try {
      const closingId = await createClosing(db, id, label.trim() || monthLabel(endDate), startDate, endDate, entries);
      router.replace(`/project/${id}/closings/${closingId}`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.periodText}>
          Período: {formatDate(startDate)} – {formatDate(endDate)} · {entries.length} lançamento(s)
        </Text>
        <FormField label="Identificação do fechamento" placeholder="Ex: Julho/2026" value={label} onChangeText={setLabel} />

        <CategoryTotalsCard totals={totals} currency={project.currency} />

        {violations.length > 0 ? (
          <View style={styles.violationsCard}>
            <Text style={styles.violationsTitle}>⚠️ Itens fora da política ({violations.length})</Text>
            {violations.map((violation, index) => (
              <Text key={index} style={styles.violationText}>
                • {violation.message}
              </Text>
            ))}
            <Text style={styles.violationsHint}>
              Você ainda pode fechar o período; revise esses itens antes de enviar ao ERP.
            </Text>
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>Lançamentos incluídos</Text>
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} currency={project.currency} />
        ))}

        <View style={styles.confirmWrap}>
          <Button
            label={`Confirmar fechamento (${entries.length} itens)`}
            onPress={handleConfirm}
            loading={saving}
            disabled={entries.length === 0}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  periodText: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 10,
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
  violationsHint: {
    fontSize: 11,
    color: '#92400E',
    marginTop: 6,
    fontStyle: 'italic',
  },
  confirmWrap: {
    marginTop: 8,
  },
});
