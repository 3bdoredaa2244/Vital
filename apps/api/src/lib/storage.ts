/**
 * Supabase Storage helpers for admin-uploaded lab PDFs.
 */
import { supabaseAdmin } from './supabase.js';
import { env } from './env.js';
import { fail } from './http.js';

const BUCKET = env.SUPABASE_STORAGE_BUCKET;

export async function uploadLabFile(
  userId: string,
  fileName: string,
  bytes: ArrayBuffer,
  contentType: string,
): Promise<string> {
  const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
  const path = `${userId}/${Date.now()}_${safeName}`;
  const { error } = await supabaseAdmin.storage
    .from(BUCKET)
    .upload(path, bytes, { contentType, upsert: false });
  if (error) {
    fail('server_error', `Failed to store lab file: ${error.message}`);
  }
  return path;
}

/** Short-lived signed URL so the admin can view/download the original PDF. */
export async function signLabFile(path: string, expiresInSeconds = 3600): Promise<string | null> {
  const { data, error } = await supabaseAdmin.storage
    .from(BUCKET)
    .createSignedUrl(path, expiresInSeconds);
  if (error || !data) return null;
  return data.signedUrl;
}
