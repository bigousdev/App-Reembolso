import { useRouter } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { SafeAreaView } from 'react-native-safe-area-context';

import { ProjectForm } from '../../src/components/ProjectForm';
import { createProject, type NewProjectInput } from '../../src/db/projects';
import { colors } from '../../src/theme';

export default function NewProjectScreen() {
  const db = useSQLiteContext();
  const router = useRouter();

  async function handleSubmit(input: NewProjectInput) {
    const id = await createProject(db, input);
    router.replace(`/project/${id}`);
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: colors.background }} edges={['bottom']}>
      <ProjectForm onSubmit={handleSubmit} submitLabel="Criar projeto" />
    </SafeAreaView>
  );
}
