import type { SQLiteDatabase } from 'expo-sqlite';

export const DATABASE_NAME = 'reembolso-viagem.db';

export async function migrateDbIfNeeded(db: SQLiteDatabase) {
  const result = await db.getFirstAsync<{ user_version: number }>('PRAGMA user_version');
  const currentVersion = result?.user_version ?? 0;
  if (currentVersion >= 1) {
    return;
  }

  await db.execAsync(`
    PRAGMA journal_mode = WAL;

    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      client TEXT,
      costCenter TEXT,
      startDate TEXT NOT NULL,
      endDate TEXT,
      currency TEXT NOT NULL DEFAULT 'BRL',
      notes TEXT,
      createdAt TEXT NOT NULL,
      archived INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS policies (
      projectId TEXT PRIMARY KEY NOT NULL,
      dailyLimitAlimentacao REAL,
      dailyLimitTransporte REAL,
      dailyLimitEstacionamento REAL,
      dailyLimitHospedagem REAL,
      receiptRequiredAbove REAL,
      notes TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS closings (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      label TEXT NOT NULL,
      startDate TEXT NOT NULL,
      endDate TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      totalAlimentacao REAL NOT NULL DEFAULT 0,
      totalTransporte REAL NOT NULL DEFAULT 0,
      totalEstacionamento REAL NOT NULL DEFAULT 0,
      totalHospedagem REAL NOT NULL DEFAULT 0,
      totalOutros REAL NOT NULL DEFAULT 0,
      totalGeral REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS entries (
      id TEXT PRIMARY KEY NOT NULL,
      projectId TEXT NOT NULL,
      date TEXT NOT NULL,
      category TEXT NOT NULL,
      description TEXT,
      value REAL NOT NULL,
      paymentMethod TEXT NOT NULL,
      photoUri TEXT,
      createdAt TEXT NOT NULL,
      closingId TEXT,
      FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
      FOREIGN KEY (closingId) REFERENCES closings(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_entries_project ON entries(projectId);
    CREATE INDEX IF NOT EXISTS idx_entries_closing ON entries(closingId);
  `);

  await db.execAsync('PRAGMA user_version = 1');
}
