import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Link, useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '../../../../src/components/Button';
import { EntryForm, type EntryFormValues } from '../../../../src/components/EntryForm';
import { deleteEntry, getEntry, updateEntry } from '../../../../src/db/entries';
import { getProject } from '../../../../src/db/projects';
import { colors } from '../../../../src/theme';
import { CATEGORY_LABELS, PAYMENT_METHOD_LABELS, type Entry } from '../../../../src/types';
import { formatCurrency, formatDate } from '../../../../src/utils/format';
import { deleteReceiptPhoto, persistReceiptPhoto } from '../../../../src/utils/receiptStorage';

export default function EntryDetailScreen() {
  const { id, entryId } = useLocalSearchParams<{ id: string; entryId: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  const [entry, setEntry] = useState<Entry | null | undefined>(undefined);
  const [currency, setCurrency] = useState('BRL');

  useEffect(() => {
    Promise.all([getEntry(db, entryId), getProject(db, id)]).then(([e, project]) => {
      setEntry(e);
      if (project) setCurrency(project.currency);
    });
  }, [db, id, entryId]);

  async function handleSubmit(values: EntryFormValues) {
    if (!entry) return;
    let photoUri = entry.photoUri;
    if (values.photoUri !== entry.photoUri) {
      if (entry.photoUri) deleteReceiptPhoto(entry.photoUri);
      photoUri = values.photoUri ? await persistReceiptPhoto(values.photoUri, entry.id) : null;
    }
    await updateEntry(db, entry.id, {
      projectId: id,
      date: values.date,
      category: values.category,
      description: values.description,
      value: values.value,
      paymentMethod: values.paymentMethod,
      photoUri,
    });
    router.back();
  }

  function confirmDelete() {
    if (!entry) return;
    Alert.alert('Excluir lançamento', 'Tem certeza que deseja excluir este lançamento?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          if (entry.photoUri) deleteReceiptPhoto(entry.photoUri);
          await deleteEntry(db, entry.id);
          router.back();
        },
      },
    ]);
  }

  if (entry === undefined) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (entry === null) {
    return (
      <View style={styles.center}>
        <Text>Lançamento não encontrado.</Text>
      </View>
    );
  }

  if (entry.closingId) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
        <ScrollView contentContainerStyle={styles.readonlyContent}>
          <View style={styles.lockedBanner}>
            <Text style={styles.lockedText}>
              Este lançamento já faz parte de um fechamento e não pode mais ser editado.
            </Text>
            <Link href={`/project/${id}/closings/${entry.closingId}`} style={styles.lockedLink}>
              Ver fechamento
            </Link>
          </View>
          {entry.photoUri ? <Image source={{ uri: entry.photoUri }} style={styles.photo} /> : null}
          <Text style={styles.readonlyCategory}>{CATEGORY_LABELS[entry.category]}</Text>
          <Text style={styles.readonlyValue}>{formatCurrency(entry.value, currency)}</Text>
          <Text style={styles.readonlyLine}>Data: {formatDate(entry.date)}</Text>
          <Text style={styles.readonlyLine}>Pagamento: {PAYMENT_METHOD_LABELS[entry.paymentMethod]}</Text>
          {entry.description ? <Text style={styles.readonlyLine}>Descrição: {entry.description}</Text> : null}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <EntryForm initial={entry} onSubmit={handleSubmit} submitLabel="Salvar alterações" />
      <View style={styles.deleteWrap}>
        <Button label="Excluir lançamento" variant="danger" onPress={confirmDelete} />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteWrap: {
    padding: 16,
    paddingTop: 0,
  },
  readonlyContent: {
    padding: 16,
  },
  lockedBanner: {
    backgroundColor: colors.warningBg,
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  lockedText: {
    color: '#92400E',
    fontSize: 13,
    marginBottom: 6,
  },
  lockedLink: {
    color: colors.primary,
    fontWeight: '600',
  },
  photo: {
    width: '100%',
    height: 260,
    borderRadius: 12,
    marginBottom: 16,
    backgroundColor: colors.border,
  },
  readonlyCategory: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.text,
  },
  readonlyValue: {
    fontSize: 24,
    fontWeight: '800',
    color: colors.primary,
    marginBottom: 8,
  },
  readonlyLine: {
    fontSize: 14,
    color: colors.textMuted,
    marginTop: 4,
  },
});
