import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Button } from './Button';
import { DateField } from './DateField';
import { FormField } from './FormField';
import { colors } from '../theme';
import { todayIso } from '../utils/format';
import type { NewProjectInput } from '../db/projects';
import type { ProjectWithPolicy } from '../types';

interface ProjectFormProps {
  initial?: ProjectWithPolicy;
  onSubmit: (input: NewProjectInput) => Promise<void>;
  submitLabel: string;
}

export function ProjectForm({ initial, onSubmit, submitLabel }: ProjectFormProps) {
  const [name, setName] = useState(initial?.name ?? '');
  const [client, setClient] = useState(initial?.client ?? '');
  const [costCenter, setCostCenter] = useState(initial?.costCenter ?? '');
  const [startDate, setStartDate] = useState(initial?.startDate ?? todayIso());
  const [endDate, setEndDate] = useState(initial?.endDate ?? '');
  const [currency, setCurrency] = useState(initial?.currency ?? 'BRL');
  const [notes, setNotes] = useState(initial?.notes ?? '');

  const [dailyLimitAlimentacao, setDailyLimitAlimentacao] = useState(
    initial?.policy.dailyLimitAlimentacao?.toString() ?? ''
  );
  const [dailyLimitTransporte, setDailyLimitTransporte] = useState(
    initial?.policy.dailyLimitTransporte?.toString() ?? ''
  );
  const [dailyLimitEstacionamento, setDailyLimitEstacionamento] = useState(
    initial?.policy.dailyLimitEstacionamento?.toString() ?? ''
  );
  const [dailyLimitHospedagem, setDailyLimitHospedagem] = useState(
    initial?.policy.dailyLimitHospedagem?.toString() ?? ''
  );
  const [receiptRequiredAbove, setReceiptRequiredAbove] = useState(
    initial?.policy.receiptRequiredAbove?.toString() ?? ''
  );
  const [policyNotes, setPolicyNotes] = useState(initial?.policy.notes ?? '');

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit() {
    if (!name.trim()) {
      setError('Informe o nome do projeto ou da viagem.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({
        name,
        client,
        costCenter,
        startDate,
        endDate,
        currency,
        notes,
        policy: {
          dailyLimitAlimentacao,
          dailyLimitTransporte,
          dailyLimitEstacionamento,
          dailyLimitHospedagem,
          receiptRequiredAbove,
          notes: policyNotes,
        },
      });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.sectionTitle}>Dados da viagem</Text>
        <FormField label="Nome do projeto / viagem *" placeholder="Ex: Implantação Cliente XPTO" value={name} onChangeText={setName} />
        <FormField label="Cliente" placeholder="Ex: XPTO Indústria Ltda" value={client} onChangeText={setClient} />
        <FormField label="Centro de custo" placeholder="Ex: CC-1023" value={costCenter} onChangeText={setCostCenter} />
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <DateField label="Início" value={startDate} onChange={setStartDate} />
          </View>
          <View style={styles.rowItem}>
            <DateField label="Fim (opcional)" value={endDate} onChange={setEndDate} />
          </View>
        </View>
        <FormField
          label="Moeda"
          placeholder="BRL"
          value={currency}
          onChangeText={(v) => setCurrency(v.toUpperCase())}
          autoCapitalize="characters"
          maxLength={3}
        />
        <FormField
          label="Observações do projeto"
          placeholder="Detalhes adicionais sobre a viagem"
          value={notes}
          onChangeText={setNotes}
          multiline
          numberOfLines={3}
          style={{ minHeight: 70, textAlignVertical: 'top' }}
        />

        <Text style={styles.sectionTitle}>Política de reembolso</Text>
        <Text style={styles.sectionHint}>
          Defina os limites diários por categoria. Deixe em branco se não houver limite.
        </Text>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormField
              label="Limite diário · Alimentação"
              placeholder="Ex: 120"
              value={dailyLimitAlimentacao}
              onChangeText={setDailyLimitAlimentacao}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <FormField
              label="Limite diário · Transporte"
              placeholder="Ex: 80"
              value={dailyLimitTransporte}
              onChangeText={setDailyLimitTransporte}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <View style={styles.row}>
          <View style={styles.rowItem}>
            <FormField
              label="Limite diário · Estacionamento"
              placeholder="Ex: 40"
              value={dailyLimitEstacionamento}
              onChangeText={setDailyLimitEstacionamento}
              keyboardType="decimal-pad"
            />
          </View>
          <View style={styles.rowItem}>
            <FormField
              label="Limite diário · Hospedagem"
              placeholder="Ex: 350"
              value={dailyLimitHospedagem}
              onChangeText={setDailyLimitHospedagem}
              keyboardType="decimal-pad"
            />
          </View>
        </View>
        <FormField
          label="Exigir foto da nota acima de"
          placeholder="Ex: 25"
          hint="Lançamentos acima desse valor sem foto serão sinalizados no fechamento."
          value={receiptRequiredAbove}
          onChangeText={setReceiptRequiredAbove}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Regras adicionais da política"
          placeholder="Ex: Uber apenas para trajetos acima de 5km; não reembolsa bebida alcoólica"
          value={policyNotes}
          onChangeText={setPolicyNotes}
          multiline
          numberOfLines={4}
          style={{ minHeight: 90, textAlignVertical: 'top' }}
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}
        <Button label={submitLabel} onPress={handleSubmit} loading={saving} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
    marginTop: 8,
    marginBottom: 4,
  },
  sectionHint: {
    fontSize: 13,
    color: colors.textMuted,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  rowItem: {
    flex: 1,
  },
  error: {
    color: colors.danger,
    marginBottom: 12,
    fontSize: 14,
  },
});
