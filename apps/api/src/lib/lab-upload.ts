/**
 * Lab result upload pipeline, shared by the admin dashboard and the lab partner
 * portal. A PDF is stored + parsed into draft rows (status `parsed`); after the
 * uploader reviews and confirms, the included rows become `user_biomarker_results`
 * (source `lab_upload`), the VITAL score is recomputed, and the user is notified.
 */
import type { ConfirmLabUploadInput, LabUpload } from '@vital/shared';
import { eq } from 'drizzle-orm';

import { db } from '../db/client.js';
import { biomarkers, labUploads, userBiomarkerResults } from '../db/schema.js';
import { fail } from './http.js';
import { parseLabPdf } from './lab-pdf.js';
import { notifyUser } from './notifications.js';
import { recordScoreSnapshot } from './score.js';
import { serializeLabUpload } from './serialize.js';
import { signLabFile, uploadLabFile } from './storage.js';

/** Store a PDF and parse it into draft rows for review. */
export async function parseAndStoreUpload(input: {
  userId: string;
  file: File;
  labName: string | null;
  testedAt: string | null;
  uploadedById: string;
}): Promise<LabUpload> {
  const { userId, file, labName, testedAt, uploadedById } = input;

  if (file.type && !file.type.includes('pdf')) {
    fail('unprocessable', 'Only PDF lab reports are supported');
  }
  const bytes = await file.arrayBuffer();

  // Store the original PDF.
  const filePath = await uploadLabFile(userId, file.name, bytes, file.type || 'application/pdf');

  // Parse against the active biomarker library to produce draft rows.
  const lib = await db
    .select({
      id: biomarkers.id,
      name: biomarkers.name,
      unit: biomarkers.unit,
      slug: biomarkers.slug,
      minPlausible: biomarkers.minPlausible,
      maxPlausible: biomarkers.maxPlausible,
      tags: biomarkers.tags,
    })
    .from(biomarkers)
    .where(eq(biomarkers.isActive, true));

  const parsed = await parseLabPdf(
    Buffer.from(bytes),
    lib.map((b) => ({
      ...b,
      minPlausible: Number(b.minPlausible),
      maxPlausible: Number(b.maxPlausible),
    })),
  );

  const [row] = await db
    .insert(labUploads)
    .values({
      userId,
      filePath,
      originalName: file.name,
      labName,
      testedAt,
      status: parsed.length > 0 ? 'parsed' : 'failed',
      parsed,
      uploadedBy: uploadedById,
    })
    .returning();

  const payload = serializeLabUpload(row!);
  payload.file_url = (await signLabFile(filePath)) ?? undefined;
  return payload;
}

/**
 * Import the reviewer-selected rows of an upload into the user's record. Returns
 * the number imported. Notifies the user that results are ready.
 */
export async function confirmUpload(
  uploadId: string,
  input: ConfirmLabUploadInput,
): Promise<{ imported: number }> {
  const { tested_at, lab_name, rows } = input;

  const [upload] = await db.select().from(labUploads).where(eq(labUploads.id, uploadId)).limit(1);
  if (!upload) fail('not_found', 'Upload not found');

  const included = rows.filter((r) => r.include);
  if (included.length === 0) fail('unprocessable', 'No rows selected to import');

  // Dedupe by biomarker (last selected row wins) so a manually-added/remapped row
  // can't import a second result for a marker the parser already produced.
  const byBiomarker = new Map<string, (typeof included)[number]>();
  for (const r of included) byBiomarker.set(r.biomarker_id, r);
  const finalRows = [...byBiomarker.values()];

  // The lab's printed reference range per biomarker, captured at parse time.
  const rangeByBiomarker = new Map(
    (upload.parsed ?? [])
      .filter((p) => p.biomarkerId)
      .map((p) => [p.biomarkerId as string, p]),
  );

  const inserted = await db
    .insert(userBiomarkerResults)
    .values(
      finalRows.map((r) => {
        const parsed = rangeByBiomarker.get(r.biomarker_id);
        return {
          userId: upload.userId,
          biomarkerId: r.biomarker_id,
          value: String(r.value),
          testedAt: tested_at,
          labName: lab_name ?? upload.labName ?? null,
          source: 'lab_upload' as const,
          labUploadId: upload.id,
          referenceRange: parsed?.referenceRange ?? null,
          refLow: parsed?.refLow != null ? String(parsed.refLow) : null,
          refHigh: parsed?.refHigh != null ? String(parsed.refHigh) : null,
        };
      }),
    )
    .returning({ id: userBiomarkerResults.id });

  await db
    .update(labUploads)
    .set({ status: 'confirmed', resultCount: inserted.length, testedAt: tested_at })
    .where(eq(labUploads.id, uploadId));

  await recordScoreSnapshot(upload.userId);

  await notifyUser(upload.userId, {
    type: 'results',
    severity: 'info',
    title: 'Results ready',
    body: `${inserted.length} new biomarker ${inserted.length === 1 ? 'result is' : 'results are'} now available.`,
    link: '(tabs)/biomarkers',
    dedupeKey: `lab-confirmed:${upload.id}`,
  });

  return { imported: inserted.length };
}
