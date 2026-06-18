/**
 * Lab partner portal routes (mounted at /lab-partner). A partner sees only
 * appointments and patients in the service areas assigned to them, and can
 * upload result PDFs that flow through the shared parse → review → confirm
 * pipeline into the patient's record.
 */
import {
  confirmLabUploadSchema,
  markReadSchema,
  type PartnerAppointment,
  sendVisitNotificationSchema,
} from '@vital/shared';
import { and, asc, desc, eq, inArray, isNull, sql } from 'drizzle-orm';
import { Hono } from 'hono';

import { db } from '../db/client.js';
import {
  addonOrderItems,
  addonOrders,
  biomarkers,
  bookings,
  labPartnerAreas,
  labUploads,
  notificationTemplates,
  notifications,
  serviceAreas,
  userBiomarkerResults,
  users,
} from '../db/schema.js';
import { errorResponse } from '../lib/http.js';
import { confirmUpload, parseAndStoreUpload } from '../lib/lab-upload.js';
import { activePlanSummary, partnerAreaIds, partnerCanAccessUser } from '../lib/lab-partner.js';
import { notifyUser } from '../lib/notifications.js';
import {
  serializeAddonOrder,
  serializeArea,
  serializeBooking,
  serializeLabUpload,
  serializeNotification,
  serializeNotificationTemplate,
  serializePartnerUserSummary,
  serializeResult,
} from '../lib/serialize.js';
import { signLabFile } from '../lib/storage.js';
import { type AuthVariables, requireAuth } from '../middleware/auth.js';
import { requireLabPartner } from '../middleware/lab-partner.js';
import { validate } from '../middleware/validate.js';

export const labPartnerRoutes = new Hono<{ Variables: AuthVariables }>();

labPartnerRoutes.use('*', requireAuth, requireLabPartner);

/** Partner profile + assigned areas. */
labPartnerRoutes.get('/me', async (c) => {
  const partner = c.get('user');
  const areaIds = await partnerAreaIds(partner.id);
  const areas = areaIds.length
    ? await db.select().from(serviceAreas).where(inArray(serviceAreas.id, areaIds))
    : [];
  return c.json({
    partner: {
      id: partner.id,
      email: partner.email,
      full_name: partner.fullName,
      phone: partner.phone,
      area_ids: areaIds,
      areas: areas.map(serializeArea),
    },
  });
});

/** Active biomarker catalog (slim) — lets partners remap parsed rows on review. */
labPartnerRoutes.get('/biomarkers', async (c) => {
  const rows = await db
    .select({ id: biomarkers.id, name: biomarkers.name, unit: biomarkers.unit })
    .from(biomarkers)
    .where(eq(biomarkers.isActive, true))
    .orderBy(asc(biomarkers.name));
  return c.json({ biomarkers: rows });
});

/** Appointments in the partner's areas, with patient + plan (tests required). */
labPartnerRoutes.get('/appointments', async (c) => {
  const partner = c.get('user');
  const areaIds = await partnerAreaIds(partner.id);
  if (areaIds.length === 0) return c.json({ appointments: [] });

  const date = c.req.query('date');
  const status = c.req.query('status');
  const conditions = [inArray(bookings.areaId, areaIds)];
  if (date) conditions.push(eq(bookings.date, date));
  if (status) conditions.push(eq(bookings.status, status));

  const rows = await db
    .select({ booking: bookings, areaName: serviceAreas.name, user: users })
    .from(bookings)
    .innerJoin(serviceAreas, eq(bookings.areaId, serviceAreas.id))
    .innerJoin(users, eq(bookings.userId, users.id))
    .where(and(...conditions))
    .orderBy(desc(bookings.date), bookings.startTime)
    .limit(300);

  // Resolve each distinct patient's active-plan summary once.
  const planByUser = new Map<string, Awaited<ReturnType<typeof activePlanSummary>>>();
  for (const userId of new Set(rows.map((r) => r.user.id))) {
    planByUser.set(userId, await activePlanSummary(userId));
  }

  const appointments: PartnerAppointment[] = rows.map((r) => ({
    ...serializeBooking(r.booking, r.areaName),
    user: serializePartnerUserSummary(r.user),
    plan: planByUser.get(r.user.id) ?? null,
  }));
  return c.json({ appointments });
});

/** Full patient detail — gated to the partner's areas. */
labPartnerRoutes.get('/users/:userId', async (c) => {
  const partner = c.get('user');
  const userId = c.req.param('userId');
  if (!(await partnerCanAccessUser(partner.id, userId))) {
    return errorResponse(c, 'forbidden', 'This patient is not in your service areas');
  }

  const [user] = await db.select().from(users).where(eq(users.id, userId)).limit(1);
  if (!user) return errorResponse(c, 'not_found', 'User not found');

  const areaIds = await partnerAreaIds(partner.id);
  const userBookings = await db
    .select({ booking: bookings, areaName: serviceAreas.name })
    .from(bookings)
    .innerJoin(serviceAreas, eq(bookings.areaId, serviceAreas.id))
    .where(and(eq(bookings.userId, userId), inArray(bookings.areaId, areaIds)))
    .orderBy(desc(bookings.date));

  const uploads = await db
    .select()
    .from(labUploads)
    .where(eq(labUploads.userId, userId))
    .orderBy(desc(labUploads.createdAt));

  const results = await db
    .select()
    .from(userBiomarkerResults)
    .where(eq(userBiomarkerResults.userId, userId))
    .orderBy(desc(userBiomarkerResults.testedAt));

  // Paid extra markers (add-ons) the patient bought for their visits.
  const paidOrders = await db
    .select()
    .from(addonOrders)
    .where(and(eq(addonOrders.userId, userId), eq(addonOrders.status, 'paid')))
    .orderBy(desc(addonOrders.createdAt));
  const orderItems = paidOrders.length
    ? await db
        .select()
        .from(addonOrderItems)
        .where(inArray(addonOrderItems.orderId, paidOrders.map((o) => o.id)))
    : [];
  const itemsByOrder = new Map<string, typeof orderItems>();
  for (const it of orderItems) {
    const list = itemsByOrder.get(it.orderId) ?? [];
    list.push(it);
    itemsByOrder.set(it.orderId, list);
  }

  return c.json({
    user: serializePartnerUserSummary(user),
    plan: await activePlanSummary(userId),
    appointments: userBookings.map((b) => serializeBooking(b.booking, b.areaName)),
    lab_uploads: uploads.map(serializeLabUpload),
    results: results.map(serializeResult),
    addon_orders: paidOrders.map((o) => serializeAddonOrder(o, itemsByOrder.get(o.id) ?? [])),
  });
});

/** Upload a result PDF for a patient (parse → review). */
labPartnerRoutes.post('/users/:userId/lab-uploads', async (c) => {
  const partner = c.get('user');
  const userId = c.req.param('userId');
  if (!(await partnerCanAccessUser(partner.id, userId))) {
    return errorResponse(c, 'forbidden', 'This patient is not in your service areas');
  }

  const body = await c.req.parseBody();
  const file = body['file'];
  if (!(file instanceof File)) {
    return errorResponse(c, 'validation_error', 'Attach a PDF file under the "file" field');
  }
  const labName = typeof body['lab_name'] === 'string' ? (body['lab_name'] as string) : null;
  const testedAt = typeof body['tested_at'] === 'string' ? (body['tested_at'] as string) : null;

  const payload = await parseAndStoreUpload({
    userId,
    file,
    labName,
    testedAt,
    uploadedById: partner.id,
  });
  return c.json({ upload: payload }, 201);
});

/** Read a single upload (with a signed PDF link) — access-checked. */
labPartnerRoutes.get('/lab-uploads/:id', async (c) => {
  const partner = c.get('user');
  const [row] = await db.select().from(labUploads).where(eq(labUploads.id, c.req.param('id'))).limit(1);
  if (!row) return errorResponse(c, 'not_found', 'Upload not found');
  if (!(await partnerCanAccessUser(partner.id, row.userId))) {
    return errorResponse(c, 'forbidden', 'Not permitted');
  }
  const payload = serializeLabUpload(row);
  payload.file_url = (await signLabFile(row.filePath)) ?? undefined;
  return c.json({ upload: payload });
});

/** Confirm reviewed rows → import into the patient's record. */
labPartnerRoutes.post('/lab-uploads/:id/confirm', validate('json', confirmLabUploadSchema), async (c) => {
  const partner = c.get('user');
  const id = c.req.param('id');
  const [row] = await db.select({ userId: labUploads.userId }).from(labUploads).where(eq(labUploads.id, id)).limit(1);
  if (!row) return errorResponse(c, 'not_found', 'Upload not found');
  if (!(await partnerCanAccessUser(partner.id, row.userId))) {
    return errorResponse(c, 'forbidden', 'Not permitted');
  }
  const { imported } = await confirmUpload(id, c.req.valid('json'));
  return c.json({ success: true, imported });
});

/** Active visit-notification templates (e.g. "Doctor arriving within 30 min"). */
labPartnerRoutes.get('/notification-templates', async (c) => {
  const rows = await db
    .select()
    .from(notificationTemplates)
    .where(eq(notificationTemplates.isActive, true))
    .orderBy(asc(notificationTemplates.displayOrder), asc(notificationTemplates.title));
  return c.json({ templates: rows.map(serializeNotificationTemplate) });
});

/** Push a visit notification to a patient (access-checked to the partner's areas). */
labPartnerRoutes.post('/users/:userId/notify', validate('json', sendVisitNotificationSchema), async (c) => {
  const partner = c.get('user');
  const userId = c.req.param('userId');
  if (!(await partnerCanAccessUser(partner.id, userId))) {
    return errorResponse(c, 'forbidden', 'This patient is not in your service areas');
  }
  const { template_id } = c.req.valid('json');
  const [tpl] = await db
    .select()
    .from(notificationTemplates)
    .where(and(eq(notificationTemplates.id, template_id), eq(notificationTemplates.isActive, true)))
    .limit(1);
  if (!tpl) return errorResponse(c, 'not_found', 'Template not found');

  await notifyUser(userId, {
    type: 'visit',
    severity: 'info',
    title: tpl.title,
    body: tpl.body,
    link: 'booking',
    // Unique per send so the same message can be pushed more than once.
    dedupeKey: `visit:${template_id}:${Date.now()}`,
  });
  return c.json({ success: true });
});

/** The partner's own alert feed (new / rescheduled / cancelled bookings). */
labPartnerRoutes.get('/notifications', async (c) => {
  const partner = c.get('user');
  const rows = await db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, partner.id))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
  const [{ n } = { n: 0 }] = await db
    .select({ n: sql<number>`count(*)::int` })
    .from(notifications)
    .where(and(eq(notifications.userId, partner.id), isNull(notifications.readAt)));
  return c.json({ notifications: rows.map(serializeNotification), unread_count: n });
});

/** Mark partner alerts read (all, or the given ids). */
labPartnerRoutes.post('/notifications/read', validate('json', markReadSchema), async (c) => {
  const partner = c.get('user');
  const { ids } = c.req.valid('json');
  const where =
    ids && ids.length
      ? and(eq(notifications.userId, partner.id), inArray(notifications.id, ids))
      : and(eq(notifications.userId, partner.id), isNull(notifications.readAt));
  await db.update(notifications).set({ readAt: new Date() }).where(where);
  return c.json({ success: true });
});
