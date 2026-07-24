import { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm } from '../../../src/components/ProjectForm';
import { getProject, updateProject, type NewProjectInput } from '../../../src/db/projects';
import { colors } from '../../../src/theme';
import type { ProjectWithPolicy } from '../../../src/types';

export default function EditProjectScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const db = useSQLiteContext();
  const router = useRouter();
  const [project, setProject] = useState<ProjectWithPolicy | null>(null);

  useEffect(() => {
    getProject(db, id).then(setProject);
  }, [db, id]);

  async function handleSubmit(input: NewProjectInput) {
    await updateProject(db, id, input);
    router.back();
  }

  if (!project) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ProjectForm initial={project} onSubmit={handleSubmit} submitLabel="Salvar alterações" />
    </SafeAreaView>
  );
}
