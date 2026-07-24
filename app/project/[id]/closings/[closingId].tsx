import { useCallback, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../../src/components/Button';
import { EntryRow } from '../../../../src/components/EntryRow';
import { deleteClosing, getClosing } from '../../../../src/db/closings';
import { listEntriesForClosing } from '../../../../src/db/entries';
import { getProject } from '../../../../src/db/projects';
import { colors } from '../../../../src/theme';
import type { Closing, Entry, ProjectWithPolicy } from '../../../../src/types';
import { formatCurrency, formatDate } from '../../../../src/utils/format';
import { exportHtmlAsPdf, generateCategoryReportHtml, generateFullReportHtml } from '../../../../src/utils/report';

export default function ClosingDetailScreen() {
  const { id, closingId } = useLocalSearchParams<{ id: string; closingId: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [project, setProject] = useState<ProjectWithPolicy | null>(null);
  const [closing, setClosing] = useState<Closing | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [exportingKey, setExportingKey] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [proj, closingData, closingEntries] = await Promise.all([
      getProject(db, id),
      getClosing(db, closingId),
      listEntriesForClosing(db, closingId),
    ]);
    setProject(proj);
    setClosing(closingData);
    setEntries(closingEntries);
  }, [db, id, closingId]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  async function handleExportCategory(category: 'alimentacao' | 'transporte' | 'estacionamento') {
    if (!project || !closing) return;
    setExportingKey(category);
    try {
      const html = await generateCategoryReportHtml(project, closing, category, entries);
      await exportHtmlAsPdf(html, `Relatório ${category}`);
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o relatório em PDF.');
    } finally {
      setExportingKey(null);
    }
  }

  async function handleExportFull() {
    if (!project || !closing) return;
    setExportingKey('full');
    try {
      const html = await generateFullReportHtml(project, closing, entries);
      await exportHtmlAsPdf(html, 'Relatório completo');
    } catch {
      Alert.alert('Erro', 'Não foi possível gerar o relatório em PDF.');
    } finally {
      setExportingKey(null);
    }
  }

  function handleReopen() {
    Alert.alert(
      'Reabrir fechamento',
      'Os lançamentos voltarão a ficar pendentes e o fechamento será removido. Deseja continuar?',
      [
        { text: 'Cancelar', style: 'cancel' },
        {
          text: 'Reabrir',
          style: 'destructive',
          onPress: async () => {
            await deleteClosing(db, closingId);
            router.replace(`/project/${id}`);
          },
        },
      ]
    );
  }

  if (!project || !closing) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>{closing.label}</Text>
        <Text style={styles.subtitle}>
          {formatDate(closing.startDate)} – {formatDate(closing.endDate)} · {entries.length} lançamento(s)
        </Text>

        <View style={styles.totalsCard}>
          <TotalLine label="Alimentação" value={closing.totalAlimentacao} currency={project.currency} />
          <TotalLine label="Transporte" value={closing.totalTransporte} currency={project.currency} />
          <TotalLine label="Estacionamento" value={closing.totalEstacionamento} currency={project.currency} />
          <TotalLine label="Hospedagem" value={closing.totalHospedagem} currency={project.currency} />
          <TotalLine label="Outros" value={closing.totalOutros} currency={project.currency} />
          <View style={styles.divider} />
          <TotalLine label="Total geral" value={closing.totalGeral} currency={project.currency} bold />
        </View>

        <Text style={styles.sectionTitle}>Exportar relatórios para o ERP</Text>
        <Text style={styles.sectionHint}>
          Gera um PDF por categoria com a tabela de despesas e as fotos das notas fiscais anexadas.
        </Text>
        <View style={styles.exportGrid}>
          <Button
            label="🍽️ Alimentação (PDF)"
            variant="secondary"
            loading={exportingKey === 'alimentacao'}
            onPress={() => handleExportCategory('alimentacao')}
          />
          <Button
            label="🚗 Transporte (PDF)"
            variant="secondary"
            loading={exportingKey === 'transporte'}
            onPress={() => handleExportCategory('transporte')}
          />
          <Button
            label="🅿️ Estacionamento (PDF)"
            variant="secondary"
            loading={exportingKey === 'estacionamento'}
            onPress={() => handleExportCategory('estacionamento')}
          />
          <Button label="📄 Relatório completo (PDF)" loading={exportingKey === 'full'} onPress={handleExportFull} />
        </View>

        <Text style={styles.sectionTitle}>Lançamentos do fechamento</Text>
        {entries.map((entry) => (
          <EntryRow key={entry.id} entry={entry} currency={project.currency} />
        ))}

        <View style={styles.reopenWrap}>
          <Button label="Reabrir fechamento" variant="danger" onPress={handleReopen} />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function TotalLine({ label, value, currency, bold }: { label: string; value: number; currency: string; bold?: boolean }) {
  return (
    <View style={styles.totalLine}>
      <Text style={[styles.totalLabel, bold && styles.totalLabelBold]}>{label}</Text>
      <Text style={[styles.totalValue, bold && styles.totalLabelBold]}>{formatCurrency(value, currency)}</Text>
    </View>
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
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.text,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 16,
  },
  totalsCard: {
    backgroundColor: colors.card,
    borderRadius: 14,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 20,
  },
  totalLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  totalLabel: {
    fontSize: 14,
    color: colors.text,
  },
  totalLabelBold: {
    fontWeight: '800',
    fontSize: 16,
    color: colors.primary,
  },
  totalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.text,
  },
  divider: {
    height: 1,
    backgroundColor: colors.border,
    marginVertical: 6,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginBottom: 6,
  },
  sectionHint: {
    fontSize: 12,
    color: colors.textMuted,
    marginBottom: 12,
  },
  exportGrid: {
    gap: 10,
    marginBottom: 24,
  },
  reopenWrap: {
    marginTop: 16,
  },
});
