'use client';

import type { AdminUserSummary } from '@vital/shared';
import Link from 'next/link';
import { useEffect, useState } from 'react';

import { useToast } from '@/components/toast';
import { EmptyRow, Input, PageHd, Spinner, StatusPill, Table, Td, Th } from '@/components/ui';
import { api } from '@/lib/api';

export default function UsersPage() {
  const { push } = useToast();
  const [users, setUsers] = useState<AdminUserSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const t = setTimeout(() => {
      setLoading(true);
      api
        .users({ search: search || undefined, limit: 100 })
        .then((r) => {
          setUsers(r.users);
          setTotal(r.total);
        })
        .catch((e) => push('error', e.message))
        .finally(() => setLoading(false));
    }, 250);
    return () => clearTimeout(t);
  }, [search, push]);

  return (
    <div>
      <PageHd title="Users" sub="Accounts, subscriptions, and lab results.">
        <span className="text-sm text-inkSoft">{total} total</span>
      </PageHd>

      <div className="mb-4 max-w-sm">
        <Input placeholder="Search name or email…" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {loading ? (
        <Spinner />
      ) : (
        <Table
          head={
            <>
              <Th>Name</Th>
              <Th>Email</Th>
              <Th>Role</Th>
              <Th>Subscription</Th>
              <Th>Results</Th>
              <Th />
            </>
          }
        >
          {users.length === 0 ? (
            <EmptyRow colSpan={6} label="No users found." />
          ) : (
            users.map((u) => (
              <tr key={u.id} className="border-b border-line last:border-0 hover:bg-panel/50">
                <Td className="font-medium text-ink">{u.full_name}</Td>
                <Td className="text-inkSoft">{u.email}</Td>
                <Td>
                  {u.role === 'admin' ? (
                    <span className="rounded-full bg-slate/15 px-2.5 py-1 text-xs font-medium text-slate">admin</span>
                  ) : (
                    <span className="text-inkMuted">user</span>
                  )}
                </Td>
                <Td>
                  {u.subscription_status ? (
                    <span className="flex items-center gap-2">
                      <StatusPill status={u.subscription_status} />
                      {u.plan_name ? <span className="text-xs capitalize text-inkSoft">{u.plan_name}</span> : null}
                    </span>
                  ) : (
                    <span className="text-inkMuted">—</span>
                  )}
                </Td>
                <Td>{u.result_count}</Td>
                <Td>
                  <Link href={`/users/${u.id}`} className="text-sm font-medium text-greenInk hover:underline">
                    Manage →
                  </Link>
                </Td>
              </tr>
            ))
          )}
        </Table>
      )}
    </div>
  );
}
