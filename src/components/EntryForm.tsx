import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text } from 'react-native';

import { Button } from './Button';
import { ChipSelector } from './ChipSelector';
import { DateField } from './DateField';
import { FormField } from './FormField';
import { PhotoCapture } from './PhotoCapture';
import { colors } from '../theme';
import {
  CATEGORIES,
  CATEGORY_LABELS,
  PAYMENT_METHOD_LABELS,
  type Category,
  type Entry,
  type PaymentMethod,
} from '../types';
import { todayIso } from '../utils/format';

export interface EntryFormValues {
  date: string;
  category: Category;
  description: string;
  value: number;
  paymentMethod: PaymentMethod;
  photoUri: string | null;
}

interface EntryFormProps {
  initial?: Entry;
  defaultCategory?: Category;
  onSubmit: (values: EntryFormValues) => Promise<void>;
  submitLabel: string;
}

const CATEGORY_OPTIONS = CATEGORIES.map((c) => ({ value: c, label: CATEGORY_LABELS[c] }));
const PAYMENT_OPTIONS: { value: PaymentMethod; label: string }[] = [
  { value: 'proprio', label: PAYMENT_METHOD_LABELS.proprio },
  { value: 'cartao_corporativo', label: PAYMENT_METHOD_LABELS.cartao_corporativo },
  { value: 'dinheiro', label: PAYMENT_METHOD_LABELS.dinheiro },
];

export function EntryForm({ initial, defaultCategory, onSubmit, submitLabel }: EntryFormProps) {
  const [date, setDate] = useState(initial?.date ?? todayIso());
  const [category, setCategory] = useState<Category>(initial?.category ?? defaultCategory ?? 'alimentacao');
  const [description, setDescription] = useState(initial?.description ?? '');
  const [value, setValue] = useState(initial?.value != null ? String(initial.value) : '');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>(initial?.paymentMethod ?? 'proprio');
  const [photoUri, setPhotoUri] = useState<string | null>(initial?.photoUri ?? null);

  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  async function handleSubmit() {
    const numericValue = Number(value.trim().replace(',', '.'));
    if (!Number.isFinite(numericValue) || numericValue <= 0) {
      setError('Informe um valor válido para a despesa.');
      return;
    }
    setError(null);
    setSaving(true);
    try {
      await onSubmit({ date, category, description, value: numericValue, paymentMethod, photoUri });
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ChipSelector label="Categoria" options={CATEGORY_OPTIONS} value={category} onChange={setCategory} />
        <DateField label="Data da despesa" value={date} onChange={setDate} maximumDate={new Date()} />
        <FormField
          label="Valor *"
          placeholder="Ex: 45,90"
          value={value}
          onChangeText={setValue}
          keyboardType="decimal-pad"
        />
        <FormField
          label="Descrição"
          placeholder="Ex: Almoço com cliente / Uber aeroporto-hotel"
          value={description}
          onChangeText={setDescription}
        />
        <ChipSelector label="Forma de pagamento" options={PAYMENT_OPTIONS} value={paymentMethod} onChange={setPaymentMethod} />
        <PhotoCapture uri={photoUri} onChange={setPhotoUri} />

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
  error: {
    color: colors.danger,
    marginBottom: 12,
    fontSize: 14,
  },
});
