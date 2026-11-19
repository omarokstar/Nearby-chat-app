import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { getErrorMessage } from '../utils';
import { useToastStore } from '../store/toast';
import Modal from '../components/Modal';
import type { AdminUser } from '../types';

export default function AdminUsers() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  /* ── Filters ── */
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'blocked' | 'active'>('all');
  const [page, setPage] = useState(1);
  const limit = 20;

  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [search]);

  const isBlockedParam = filter === 'blocked' ? true : filter === 'active' ? false : undefined;

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-users', debouncedSearch, filter, page],
    queryFn: () =>
      adminApi.getUsers({
        search: debouncedSearch || undefined,
        isBlocked: isBlockedParam,
        page,
        limit,
      }),
  });

  const totalPages = data ? Math.ceil(data.total / limit) : 0;

  /* ── Block modal ── */
  const [blockTarget, setBlockTarget] = useState<AdminUser | null>(null);
  const [blockReason, setBlockReason] = useState('');

  const blockMut = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      adminApi.blockUser(id, reason),
    onSuccess: () => {
      addToast('success', 'User blocked');
      setBlockTarget(null);
      setBlockReason('');
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  /* ── Unblock ── */
  const [unblockTarget, setUnblockTarget] = useState<AdminUser | null>(null);

  const unblockMut = useMutation({
    mutationFn: (id: string) => adminApi.unblockUser(id),
    onSuccess: () => {
      addToast('success', 'User unblocked');
      setUnblockTarget(null);
      qc.invalidateQueries({ queryKey: ['admin-users'] });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  const handleBlock = useCallback(() => {
    if (!blockTarget) return;
    blockMut.mutate({ id: blockTarget.id, reason: blockReason.trim() || undefined });
  }, [blockTarget, blockReason, blockMut]);

  const handleUnblock = useCallback(() => {
    if (!unblockTarget) return;
    unblockMut.mutate(unblockTarget.id);
  }, [unblockTarget, unblockMut]);

  const filterBtnClass = (active: boolean) =>
    `px-3 py-1.5 text-xs font-medium rounded-lg transition-colors ${
      active
        ? 'bg-brand-500 text-white'
        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
    }`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">User Management</h1>

      {/* ── Filters bar ── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search users…"
          className="w-full sm:w-64 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
          aria-label="Search users"
        />
        <div className="flex gap-2">
          <button className={filterBtnClass(filter === 'all')} onClick={() => { setFilter('all'); setPage(1); }}>All</button>
          <button className={filterBtnClass(filter === 'blocked')} onClick={() => { setFilter('blocked'); setPage(1); }}>Blocked</button>
          <button className={filterBtnClass(filter === 'active')} onClick={() => { setFilter('active'); setPage(1); }}>Active</button>
        </div>
      </div>

      {/* ── Error ── */}
      {isError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 text-sm" role="alert">
          {getErrorMessage(error)}
        </div>
      )}

      {/* ── Table ── */}
      <div className="overflow-x-auto rounded-xl border border-slate-200 dark:border-slate-700/50 bg-white/70 dark:bg-slate-800/70 backdrop-blur">
        <table className="w-full text-sm text-left">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-700 text-slate-500 dark:text-slate-400 text-xs uppercase tracking-wider">
              <th className="px-4 py-3 font-medium">Username</th>
              <th className="px-4 py-3 font-medium hidden sm:table-cell">Email</th>
              <th className="px-4 py-3 font-medium">Verified</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium hidden md:table-cell">Created</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading &&
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i} className="border-b border-slate-100 dark:border-slate-700/50">
                  {Array.from({ length: 6 }).map((__, j) => (
                    <td key={j} className="px-4 py-3">
                      <div className="h-4 rounded bg-slate-200 dark:bg-slate-700 animate-pulse-soft" />
                    </td>
                  ))}
                </tr>
              ))}

            {data?.items.map((u) => (
              <tr
                key={u.id}
                className="border-b border-slate-100 dark:border-slate-700/50 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors"
              >
                <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{u.username}</td>
                <td className="px-4 py-3 text-slate-500 dark:text-slate-400 hidden sm:table-cell">{u.email}</td>
                <td className="px-4 py-3">
                  {u.isAccountVerified ? (
                    <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" /> Yes
                    </span>
                  ) : (
                    <span className="text-slate-400">No</span>
                  )}
                </td>
                <td className="px-4 py-3">
                  {u.isBlocked ? (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 text-xs font-medium">
                      Blocked
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 text-xs font-medium">
                      Active
                    </span>
                  )}
                </td>
                <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                  {new Date(u.createdAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3 text-right">
                  {u.isBlocked ? (
                    <button
                      onClick={() => setUnblockTarget(u)}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-emerald-50 dark:bg-emerald-900/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-colors"
                    >
                      Unblock
                    </button>
                  ) : (
                    <button
                      onClick={() => { setBlockTarget(u); setBlockReason(''); }}
                      disabled={u.role === 'admin'}
                      className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-50 dark:bg-rose-900/20 text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                      title={u.role === 'admin' ? 'Cannot block admin accounts' : undefined}
                    >
                      Block
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-10 text-slate-400">No users found.</div>
        )}
      </div>

      {/* ── Pagination ── */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            Previous
          </button>
          <span className="text-sm text-slate-500 dark:text-slate-400">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 disabled:opacity-40 transition-colors"
          >
            Next
          </button>
        </div>
      )}

      {/* ── Block modal ── */}
      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title={`Block ${blockTarget?.username ?? ''}?`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This user will be blocked from using the app. You can optionally provide a reason.
          </p>
          <div>
            <label htmlFor="block-reason" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
              Reason (optional)
            </label>
            <textarea
              id="block-reason"
              value={blockReason}
              onChange={(e) => { if (e.target.value.length <= 500) setBlockReason(e.target.value); }}
              rows={3}
              className="w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition resize-none"
              placeholder="Optional reason for blocking…"
            />
            <p className="text-xs text-slate-400 mt-1">{blockReason.length}/500</p>
          </div>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setBlockTarget(null)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={blockMut.isPending}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-rose-500 hover:bg-rose-600 text-white transition-colors disabled:opacity-60"
            >
              {blockMut.isPending ? 'Blocking…' : 'Block User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* ── Unblock confirmation ── */}
      <Modal open={!!unblockTarget} onClose={() => setUnblockTarget(null)} title={`Unblock ${unblockTarget?.username ?? ''}?`}>
        <div className="space-y-4">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            This user will be able to use the app again.
          </p>
          <div className="flex justify-end gap-3">
            <button
              onClick={() => setUnblockTarget(null)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUnblock}
              disabled={unblockMut.isPending}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white transition-colors disabled:opacity-60"
            >
              {unblockMut.isPending ? 'Unblocking…' : 'Unblock User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
