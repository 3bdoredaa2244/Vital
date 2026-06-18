'use client';

import type { PartnerAppointment } from '@vital/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { AlertsBell } from '@/components/AlertsBell';
import { useToast } from '@/components/toast';
import { EmptyRow, FilterBar, Input, Select, Spinner, StatusPill, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';

export default function AppointmentsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<PartnerAppointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('booked');

  useEffect(() => {
    setLoading(true);
    api
      .appointments({ date: date || undefined, status: status || undefined })
      .then((r) => setRows(r.appointments))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [date, status, push]);

  return (
    <div>
      <div className="mb-1 flex items-start justify-between gap-4">
        <h1 className="font-display text-3xl font-bold text-ink">Appointments</h1>
        <AlertsBell />
      </div>
      <p className="mb-5 text-sm text-inkSoft">Scheduled home draws in your service areas.</p>

      <FilterBar>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
          <option value="">All statuses</option>
        </Select>
      </FilterBar>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          head={
            <>
              <Th>Date</Th>
              <Th>Time</Th>
              <Th>Patient</Th>
              <Th>Area</Th>
              <Th>Tests (plan)</Th>
              <Th>Notes</Th>
              <Th>Status</Th>
            </>
          }
        >
          {rows.length === 0 ? (
            <EmptyRow colSpan={7} label="No appointments." />
          ) : (
            rows.map((a) => (
              <tr key={a.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel/50">
                <Td className="text-ink">
                  <Link href={`/appointments/${a.user.id}?booking=${a.id}`} className="block">
                    {a.date}
                  </Link>
                </Td>
                <Td className="text-inkSoft">{a.start_time}–{a.end_time}</Td>
                <Td className="text-ink">
                  <Link href={`/appointments/${a.user.id}?booking=${a.id}`} className="font-medium text-accent hover:underline">
                    {a.user.full_name}
                  </Link>
                  <div className="text-xs text-inkMuted">{a.user.phone ?? a.user.email}</div>
                </Td>
                <Td className="text-inkSoft">{a.area_name}</Td>
                <Td className="text-inkSoft">
                  {a.plan ? `${a.plan.name} · ${a.plan.biomarker_count} markers` : '—'}
                </Td>
                <Td className="max-w-xs text-xs text-inkSoft">{a.notes ?? '—'}</Td>
                <Td>
                  <StatusPill status={a.status === 'booked' ? 'active' : a.status === 'cancelled' ? 'expired' : 'cancelled'} />
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
