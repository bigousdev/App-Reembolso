import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SQLiteProvider } from 'expo-sqlite';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Suspense } from 'react';
import { ActivityIndicator, View } from 'react-native';

import { DATABASE_NAME, migrateDbIfNeeded } from '../src/db/schema';

function LoadingScreen() {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
      <ActivityIndicator size="large" />
    </View>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <Suspense fallback={<LoadingScreen />}>
          <SQLiteProvider databaseName={DATABASE_NAME} onInit={migrateDbIfNeeded} useSuspense>
            <StatusBar style="dark" />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: '#0F766E' },
                headerTintColor: '#fff',
                headerTitleStyle: { fontWeight: '600' },
                contentStyle: { backgroundColor: '#F8FAFC' },
              }}
            >
              <Stack.Screen name="index" options={{ title: 'Minhas Viagens' }} />
              <Stack.Screen name="project/new" options={{ title: 'Novo Projeto' }} />
              <Stack.Screen name="project/[id]/index" options={{ title: 'Projeto' }} />
              <Stack.Screen name="project/[id]/edit" options={{ title: 'Editar Projeto' }} />
              <Stack.Screen name="project/[id]/entries/new" options={{ title: 'Novo Lançamento' }} />
              <Stack.Screen name="project/[id]/entries/[entryId]" options={{ title: 'Lançamento' }} />
              <Stack.Screen name="project/[id]/closings/new" options={{ title: 'Fechamento do Período' }} />
              <Stack.Screen name="project/[id]/closings/[closingId]" options={{ title: 'Fechamento' }} />
            </Stack>
          </SQLiteProvider>
        </Suspense>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
