import { posix, win32 } from 'node:path';

export function normalizeStorageKey(key: string): string {
  const normalizedKey = key.trim();

  if (
    !normalizedKey ||
    normalizedKey.includes('\0') ||
    normalizedKey.includes('\\') ||
    posix.isAbsolute(normalizedKey) ||
    win32.isAbsolute(normalizedKey)
  ) {
    throw new Error('Invalid storage key');
  }

  const segments = normalizedKey.split('/');

  if (
    segments.some((segment) => !segment || segment === '.' || segment === '..')
  ) {
    throw new Error('Invalid storage key');
  }

  return segments.join('/');
}
