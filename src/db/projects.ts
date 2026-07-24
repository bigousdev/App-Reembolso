import type { SQLiteDatabase } from 'expo-sqlite';
import type { Policy, Project, ProjectWithPolicy } from '../types';
import { newId, todayIso } from '../utils/format';

export interface NewProjectInput {
  name: string;
  client: string;
  costCenter: string;
  startDate: string;
  endDate: string;
  currency: string;
  notes: string;
  policy: {
    dailyLimitAlimentacao: string;
    dailyLimitTransporte: string;
    dailyLimitEstacionamento: string;
    dailyLimitHospedagem: string;
    receiptRequiredAbove: string;
    notes: string;
  };
}

function toNullableNumber(value: string): number | null {
  const trimmed = value.trim().replace(',', '.');
  if (trimmed === '') return null;
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

export async function listProjects(db: SQLiteDatabase): Promise<Project[]> {
  return db.getAllAsync<Project>(
    'SELECT * FROM projects WHERE archived = 0 ORDER BY createdAt DESC'
  );
}

export interface ProjectWithTotal extends Project {
  totalSpent: number;
  openEntriesCount: number;
}

export async function listProjectsWithTotals(db: SQLiteDatabase): Promise<ProjectWithTotal[]> {
  return db.getAllAsync<ProjectWithTotal>(`
    SELECT p.*,
      COALESCE((SELECT SUM(e.value) FROM entries e WHERE e.projectId = p.id), 0) AS totalSpent,
      COALESCE((SELECT COUNT(*) FROM entries e WHERE e.projectId = p.id AND e.closingId IS NULL), 0) AS openEntriesCount
    FROM projects p
    WHERE p.archived = 0
    ORDER BY p.createdAt DESC
  `);
}

export async function getProject(db: SQLiteDatabase, id: string): Promise<ProjectWithPolicy | null> {
  const project = await db.getFirstAsync<Project>('SELECT * FROM projects WHERE id = ?', id);
  if (!project) return null;
  const policy = await db.getFirstAsync<Policy>('SELECT * FROM policies WHERE projectId = ?', id);
  return {
    ...project,
    policy: policy ?? {
      projectId: id,
      dailyLimitAlimentacao: null,
      dailyLimitTransporte: null,
      dailyLimitEstacionamento: null,
      dailyLimitHospedagem: null,
      receiptRequiredAbove: null,
      notes: null,
    },
  };
}

export async function createProject(db: SQLiteDatabase, input: NewProjectInput): Promise<string> {
  const id = newId();
  const createdAt = new Date().toISOString();
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `INSERT INTO projects (id, name, client, costCenter, startDate, endDate, currency, notes, createdAt, archived)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0)`,
      id,
      input.name.trim(),
      input.client.trim() || null,
      input.costCenter.trim() || null,
      input.startDate || todayIso(),
      input.endDate || null,
      input.currency.trim() || 'BRL',
      input.notes.trim() || null,
      createdAt
    );
    await db.runAsync(
      `INSERT INTO policies (projectId, dailyLimitAlimentacao, dailyLimitTransporte, dailyLimitEstacionamento, dailyLimitHospedagem, receiptRequiredAbove, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      id,
      toNullableNumber(input.policy.dailyLimitAlimentacao),
      toNullableNumber(input.policy.dailyLimitTransporte),
      toNullableNumber(input.policy.dailyLimitEstacionamento),
      toNullableNumber(input.policy.dailyLimitHospedagem),
      toNullableNumber(input.policy.receiptRequiredAbove),
      input.policy.notes.trim() || null
    );
  });
  return id;
}

export async function updateProject(db: SQLiteDatabase, id: string, input: NewProjectInput): Promise<void> {
  await db.withTransactionAsync(async () => {
    await db.runAsync(
      `UPDATE projects SET name = ?, client = ?, costCenter = ?, startDate = ?, endDate = ?, currency = ?, notes = ?
       WHERE id = ?`,
      input.name.trim(),
      input.client.trim() || null,
      input.costCenter.trim() || null,
      input.startDate || todayIso(),
      input.endDate || null,
      input.currency.trim() || 'BRL',
      input.notes.trim() || null,
      id
    );
    await db.runAsync(
      `INSERT INTO policies (projectId, dailyLimitAlimentacao, dailyLimitTransporte, dailyLimitEstacionamento, dailyLimitHospedagem, receiptRequiredAbove, notes)
       VALUES (?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT(projectId) DO UPDATE SET
         dailyLimitAlimentacao = excluded.dailyLimitAlimentacao,
         dailyLimitTransporte = excluded.dailyLimitTransporte,
         dailyLimitEstacionamento = excluded.dailyLimitEstacionamento,
         dailyLimitHospedagem = excluded.dailyLimitHospedagem,
         receiptRequiredAbove = excluded.receiptRequiredAbove,
         notes = excluded.notes`,
      id,
      toNullableNumber(input.policy.dailyLimitAlimentacao),
      toNullableNumber(input.policy.dailyLimitTransporte),
      toNullableNumber(input.policy.dailyLimitEstacionamento),
      toNullableNumber(input.policy.dailyLimitHospedagem),
      toNullableNumber(input.policy.receiptRequiredAbove),
      input.policy.notes.trim() || null
    );
  });
}

export async function archiveProject(db: SQLiteDatabase, id: string): Promise<void> {
  await db.runAsync('UPDATE projects SET archived = 1 WHERE id = ?', id);
}
