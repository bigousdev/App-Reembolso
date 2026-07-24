import type { SQLiteDatabase } from 'expo-sqlite';
import type { Closing, Entry } from '../types';
import { newId } from '../utils/format';
import { totalsByCategory } from '../utils/policy';

export async function listClosings(db: SQLiteDatabase, projectId: string): Promise<Closing[]> {
  return db.getAllAsync<Closing>(
    'SELECT * FROM closings WHERE projectId = ? ORDER BY createdAt DESC',
    projectId
  );
}

export async function getClosing(db: SQLiteDatabase, id: string): Promise<Closing | null> {
  return db.getFirstAsync<Closing>('SELECT * FROM closings WHERE id = ?', id);
}

export async function createClosing(
  db: SQLiteDatabase,
  projectId: string,
  label: string,
  startDate: string,
  endDate: string,
  entries: Entry[]
): Promise<string> {
  const id = newId();
  const createdAt = new Date().toISOString();
  const totals = totalsByCategory(entries);
  const totalGeral = Object.values(totals).reduce((sum, v) => sum + v, 0);

  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO closings (id, projectId, label, startDate, endDate, createdAt, totalAlimentacao, totalTransporte, totalEstacionamento, totalHospedagem, totalOutros, totalGeral)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      projectId,
      label,
      startDate,
      endDate,
      createdAt,
      totals.alimentacao,
      totals.transporte,
      totals.estacionamento,
      totals.hospedagem,
      totals.outros,
      totalGeral
    );
    for (const entry of entries) {
      await db.runAsync('UPDATE entries SET closingId = ? WHERE id = ?', id, entry.id);
    }
  });

  return id;
}

export async function deleteClosing(db: SQLiteDatabase, id: string): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync('UPDATE entries SET closingId = NULL WHERE closingId = ?', id);
    await db.runAsync('DELETE FROM closings WHERE id = ?', id);
  });
}
