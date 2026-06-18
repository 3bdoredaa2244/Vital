'use client';

import type { AdminBooking, ServiceArea } from '@vital/shared';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { EmptyRow, FilterBar, Input, Select, Spinner, StatusPill, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';

export default function BookingsPage() {
  const { push } = useToast();
  const [rows, setRows] = useState<AdminBooking[]>([]);
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [loading, setLoading] = useState(true);
  const [areaId, setAreaId] = useState('');
  const [date, setDate] = useState('');
  const [status, setStatus] = useState('');

  useEffect(() => {
    api.areas().then((r) => setAreas(r.areas)).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    api
      .bookings({ areaId: areaId || undefined, date: date || undefined, status: status || undefined })
      .then((r) => setRows(r.bookings))
      .catch((e) => push('error', e.message))
      .finally(() => setLoading(false));
  }, [areaId, date, status, push]);

  return (
    <div>
      <h1 className="mb-1 font-display text-3xl font-bold text-ink">Bookings</h1>
      <p className="mb-5 text-sm text-inkSoft">All home draw bookings across service areas.</p>
      <FilterBar>
        <Select value={areaId} onChange={(e) => setAreaId(e.target.value)} className="w-44">
          <option value="">All areas</option>
          {areas.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
        </Select>
        <Input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-44" />
        <Select value={status} onChange={(e) => setStatus(e.target.value)} className="w-44">
          <option value="">All statuses</option>
          <option value="booked">Booked</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </Select>
      </FilterBar>

      {loading ? (
        <Spinner />
      ) : (
        <Table head={<><Th>Date</Th><Th>Time</Th><Th>Area</Th><Th>Customer</Th><Th>Address</Th><Th>Status</Th></>}>
          {rows.length === 0 ? (
            <EmptyRow colSpan={6} label="No bookings." />
          ) : (
            rows.map((b) => (
              <tr key={b.id} className="border-b border-line transition-colors last:border-0 hover:bg-panel/50">
                <Td className="text-ink">{b.date}</Td>
                <Td className="text-inkSoft">{b.start_time}–{b.end_time}</Td>
                <Td className="text-inkSoft">{b.area_name}</Td>
                <Td className="text-ink">{b.user_name}<div className="text-xs text-inkMuted">{b.user_email}</div></Td>
                <Td className="max-w-xs text-xs text-inkSoft">{b.address ?? '—'}</Td>
                <Td><StatusPill status={b.status === 'booked' ? 'active' : b.status === 'cancelled' ? 'expired' : 'cancelled'} /></Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
