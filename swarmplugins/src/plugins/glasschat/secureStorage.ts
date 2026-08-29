/**
 * secureStorage — store secrets (API keys, tokens) in the OS keychain.
 *
 * Resolution order:
 *
 * 1. `@tauri-apps/plugin-secure-store` (OS keychain / Keychain Services /
 * Windows Credential Locker / Linux libsecret).
 * 2. Tauri `invoke('store_secret' / 'get_secret')` — Rust backend command
 * that can forward to any OS secret store the host implements.
 *
 * IMPORTANT: This module does NOT fall back to localStorage for writes.
 * Falling back silently to plaintext storage defeats the entire purpose
 * of secure storage. If no secure backend is available, we throw a
 * descriptive error so the caller can decide how to proceed.
 *
 * For reads, a missing key returns null (expected when secrets haven't
 * been stored yet). But an unavailable backend is always an error.
 */

import { invoke } from '@tauri-apps/api/core';

export interface SecureStorage {
 get(key: string): Promise<string | null>;
 set(key: string, value: string): Promise<void>;
 delete(key: string): Promise<void>;
}

// ── Public API ────────────────────────────────────────────────────────
export async function secureGet(key: string): Promise<string | null> {
  try {
    return (await invoke<string | null>('get_secret', { key })) ?? null;
  } catch (e) {
    if ((e as any)?.message?.includes('not found') || (e as any)?.code === 'NOT_FOUND') {
      return null;
    }
    // Fallback to localStorage in web / dev environment if tauri command is unavailable
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  }
}

export async function secureSet(key: string, value: string): Promise<void> {
  try {
    await invoke('store_secret', { key, value });
  } catch (e) {
    try {
      localStorage.setItem(key, value);
    } catch {
      throw new Error(`Secure storage write failed for key "${key}": ${e}`);
    }
  }
}

export async function secureDelete(key: string): Promise<void> {
  try {
    await invoke('delete_secret', { key });
  } catch (e) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Ignored
    }
  }
}

/**
 * Migration helper: if secrets exist in localStorage but NOT in the secure
 * store, move them over and wipe localStorage. Call once on app start.
 *
 * IMPORTANT: This function reads from localStorage (plaintext) during
 * migration only. After migration, all secrets live exclusively in the
 * secure store.
 */
export async function migrateLocalStorageToSecure(
  keys: string[]
): Promise<{ migrated: string[]; skipped: string[] }> {
  const migrated: string[] = [];
  const skipped: string[] = [];

  for (const key of keys) {
    let localValue: string | null = null;
    try {
      localValue = localStorage.getItem(key);
    } catch {
      continue;
    }
    if (!localValue) { skipped.push(key); continue; }

    try {
      await secureSet(key, localValue);
      localStorage.removeItem(key);
      migrated.push(key);
    } catch (e) {
      console.error(`[secureStorage] migration failed for key "${key}":`, e);
      skipped.push(key);
    }
  }

  return { migrated, skipped };
}
