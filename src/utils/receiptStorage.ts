import { Directory, File, Paths } from 'expo-file-system';

const RECEIPTS_DIR_NAME = 'receipts';

function receiptsDirectory(): Directory {
  const dir = new Directory(Paths.document, RECEIPTS_DIR_NAME);
  if (!dir.exists) {
    dir.create({ intermediates: true, idempotent: true });
  }
  return dir;
}

export async function persistReceiptPhoto(sourceUri: string, entryId: string): Promise<string> {
  const dir = receiptsDirectory();
  const extension = sourceUri.split('.').pop()?.split('?')[0] || 'jpg';
  const destination = new File(dir, `${entryId}.${extension}`);
  const source = new File(sourceUri);
  await source.copy(destination, { overwrite: true });
  return destination.uri;
}

export function deleteReceiptPhoto(uri: string): void {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // Ignore missing/inaccessible files.
  }
}

export async function readReceiptAsBase64(uri: string): Promise<string | null> {
  try {
    const file = new File(uri);
    if (!file.exists) return null;
    return await file.base64();
  } catch {
    return null;
  }
}
