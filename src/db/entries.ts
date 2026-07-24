import type { SQLiteDatabase } from 'expo-sqlite';
import type { Category, Entry, PaymentMethod } from '../types';

export interface NewEntryInput {
  projectId: string;
  date: string;
  category: Category;
  description: string;
  value: number;
  paymentMethod: PaymentMethod;
  photoUri: string | null;
}

export async function listEntriesForProject(db: SQLiteDatabase, projectId: string): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    'SELECT * FROM entries WHERE projectId = ? ORDER BY date DESC, createdAt DESC',
    projectId
  );
}

export async function listOpenEntries(db: SQLiteDatabase, projectId: string): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    'SELECT * FROM entries WHERE projectId = ? AND closingId IS NULL ORDER BY date ASC, createdAt ASC',
    projectId
  );
}

export async function listEntriesForClosing(db: SQLiteDatabase, closingId: string): Promise<Entry[]> {
  return db.getAllAsync<Entry>(
    'SELECT * FROM entries WHERE closingId = ? ORDER BY category ASC, date ASC',
    closingId
  );
}

export async function getEntry(db: SQLiteDatabase, id: string): Promise<Entry | null> {
  return db.getFirstAsync<Entry>('SELECT * FROM entries WHERE id = ?', id);
}

export async function createEntry(db: SQLiteDatabase, id: string, input: NewEntryInput): Promise<string> {
  const createdAt = new Date().toISOString();
  await db.runAsync(
    `INSERT INTO entries (id, projectId, date, category, description, value, paymentMethod, photoUri, createdAt, closingId)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NULL)`,
    id,
    input.projectId,
    input.date,
    input.category,
    input.description.trim() || null,
    input.value,
    input.paymentMethod,
    input.photoUri,
    createdAt
  );
  return id;
}

export async function updateEntry(db: SQLiteDatabase, id: string, input: NewEntryInput): Promise<void> {
  await db.runAsync(
    `UPDATE entries SET date = ?, category = ?, description = ?, value = ?, paymentMethod = ?, photoUri = ?
     WHERE id = ?`,
    input.date,
    input.category,
    input.description.trim() || null,
    input.value,
    input.paymentMethod,
    input.photoUri,
    id
  );
}

export async function deleteEntry(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('DELETE FROM entries WHERE id = ?', id);
}
