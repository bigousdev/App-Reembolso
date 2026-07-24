import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { EntryForm, type EntryFormValues } from '../../../../src/components/EntryForm';
import { createEntry } from '../../../../src/db/entries';
import { colors } from '../../../../src/theme';
import { newId } from '../../../../src/utils/format';
import { persistReceiptPhoto } from '../../../../src/utils/receiptStorage';

export default function NewEntryScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();

  async function handleSubmit(values: EntryFormValues) {
    const entryId = newId();
    const photoUri = values.photoUri ? await persistReceiptPhoto(values.photoUri, entryId) : null;
    await createEntry(db, entryId, {
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

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <EntryForm onSubmit={handleSubmit} submitLabel="Salvar lançamento" />
    </SafeAreaView>
  );
}
