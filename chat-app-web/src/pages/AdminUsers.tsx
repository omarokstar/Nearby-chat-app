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

  // Debounced search query, status filters, and pagination for user directory
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

  // State management and mutation for suspending user access with an optional audit reason
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

  // State management and mutation for restoring suspended user access
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
    `px-3.5 py-1.5 text-xs font-medium rounded-[12px] transition-colors ${
      active
        ? 'bg-[#131313] text-white dark:bg-white dark:text-[#131313]'
        : 'bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#5D5D5D] dark:text-[#aaa] hover:bg-[#EFEFEF] dark:hover:bg-[#2e2e2e]'
    }`;

  return (
    <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#131313] dark:text-white">User Management</h1>
          <p className="text-sm text-[#868686] mt-1">Review accounts, access status, and platform moderation</p>
        </div>
      </div>

      {/* Filter toolbar: text search input and account status filter chips */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search username or email…"
            className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#1a1a1a] px-4 py-2.5 text-sm text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 dark:focus:ring-white/20 transition"
            aria-label="Search users"
          />
        </div>
        <div className="flex items-center gap-2">
          <button className={filterBtnClass(filter === 'all')} onClick={() => { setFilter('all'); setPage(1); }}>
            All
          </button>
          <button className={filterBtnClass(filter === 'active')} onClick={() => { setFilter('active'); setPage(1); }}>
            Active
          </button>
          <button className={filterBtnClass(filter === 'blocked')} onClick={() => { setFilter('blocked'); setPage(1); }}>
            Blocked
          </button>
        </div>
      </div>

      {/* Network or server error alert */}
      {isError && (
        <div
          className="rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] px-4 py-3 text-sm"
          role="alert"
        >
          {getErrorMessage(error)}
        </div>
      )}

      {/* Moderation table displaying user details, verification status, and block controls */}
      <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead>
              <tr className="bg-[#F8F8F8] dark:bg-[#202020] border-b border-[#E3E3E3] dark:border-[#2a2a2a] text-[#868686] text-xs uppercase tracking-wider">
                <th className="px-5 py-3.5 font-medium">Username</th>
                <th className="px-5 py-3.5 font-medium hidden sm:table-cell">Email</th>
                <th className="px-5 py-3.5 font-medium">Verified</th>
                <th className="px-5 py-3.5 font-medium">Status</th>
                <th className="px-5 py-3.5 font-medium hidden md:table-cell">Created</th>
                <th className="px-5 py-3.5 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E3E3E3] dark:divide-[#2a2a2a]">
              {isLoading &&
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i}>
                    {Array.from({ length: 6 }).map((__, j) => (
                      <td key={j} className="px-5 py-4">
                        <div className="h-4 rounded-lg bg-[#F8F8F8] dark:bg-[#252525] animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))}

              {data?.items.map((u) => {
                const isUserAdmin =
                  u.role === 'admin' ||
                  (typeof u.role === 'object' &&
                    (u.role as { name?: string } | undefined)?.name === 'admin');

                return (
                <tr
                  key={u.id}
                  className="hover:bg-[#F8F8F8]/60 dark:hover:bg-[#222222] transition-colors"
                >
                  <td className="px-5 py-4 font-medium text-[#131313] dark:text-white">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-[#131313] text-white dark:bg-white dark:text-[#131313] text-xs font-semibold flex items-center justify-center shrink-0 uppercase">
                        {u.username[0]}
                      </div>
                      <span>{u.username}</span>
                    </div>
                  </td>
                  <td className="px-5 py-4 text-[#5D5D5D] dark:text-[#aaa] hidden sm:table-cell">{u.email}</td>
                  <td className="px-5 py-4">
                    {u.isAccountVerified ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-600 dark:text-emerald-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" /> Yes
                      </span>
                    ) : (
                      <span className="text-xs text-[#868686]">No</span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    {u.isBlocked ? (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] text-xs font-medium">
                        Blocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#F0FDF4] border border-[#DCFCE7] text-emerald-700 text-xs font-medium">
                        Active
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4 text-xs text-[#868686] hidden md:table-cell">
                    {new Date(u.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-5 py-4 text-right">
                    {u.isBlocked ? (
                      <button
                        onClick={() => setUnblockTarget(u)}
                        className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#303030] transition-colors"
                      >
                        Unblock
                      </button>
                    ) : (
                      <button
                        onClick={() => { setBlockTarget(u); setBlockReason(''); }}
                        disabled={isUserAdmin}
                        className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] hover:bg-[#FFE0E0] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                        title={isUserAdmin ? 'Cannot block admin accounts' : undefined}
                      >
                        Block
                      </button>
                    )}
                  </td>
                </tr>
              );
              })}
            </tbody>
          </table>
        </div>

        {!isLoading && data?.items.length === 0 && (
          <div className="text-center py-12 text-[#868686] text-sm">No users found matching your search.</div>
        )}

        {/* Pagination controls for navigating through user records */}
        {totalPages > 1 && (
          <div className="border-t border-[#E3E3E3] dark:border-[#2a2a2a] px-5 py-3.5 flex items-center justify-between">
            <span className="text-xs text-[#868686]">
              Page {page} of {totalPages} ({data?.total ?? 0} total)
            </span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#2e2e2e] disabled:opacity-40 transition-colors"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 text-xs font-medium rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#2e2e2e] disabled:opacity-40 transition-colors"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal dialog confirming user suspension and capturing optional reason */}
      <Modal open={!!blockTarget} onClose={() => setBlockTarget(null)} title={`Block ${blockTarget?.username ?? ''}?`}>
        <div className="space-y-4">
          <p className="text-sm text-[#5D5D5D] dark:text-[#aaa]">
            This user will be suspended from using the app. You can optionally provide a reason for the record.
          </p>
          <div>
            <label htmlFor="block-reason" className="block text-sm font-medium text-[#131313] dark:text-white mb-1.5">
              Reason (optional)
            </label>
            <textarea
              id="block-reason"
              value={blockReason}
              onChange={(e) => { if (e.target.value.length <= 500) setBlockReason(e.target.value); }}
              rows={3}
              className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-sm text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition resize-none"
              placeholder="e.g. Terms of service violation…"
            />
            <p className="text-xs text-[#868686] mt-1">{blockReason.length}/500</p>
          </div>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setBlockTarget(null)}
              className="px-4 py-2 text-sm font-medium rounded-[14px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleBlock}
              disabled={blockMut.isPending}
              className="px-4 py-2 text-sm font-medium rounded-[14px] bg-[#DD0000] text-white hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {blockMut.isPending ? 'Blocking…' : 'Block User'}
            </button>
          </div>
        </div>
      </Modal>

      {/* Modal dialog confirming restoration of user access */}
      <Modal open={!!unblockTarget} onClose={() => setUnblockTarget(null)} title={`Unblock ${unblockTarget?.username ?? ''}?`}>
        <div className="space-y-4">
          <p className="text-sm text-[#5D5D5D] dark:text-[#aaa]">
            This user will regain access to log in and send messages immediately.
          </p>
          <div className="flex justify-end gap-3 pt-2">
            <button
              onClick={() => setUnblockTarget(null)}
              className="px-4 py-2 text-sm font-medium rounded-[14px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleUnblock}
              disabled={unblockMut.isPending}
              className="px-4 py-2 text-sm font-medium rounded-[14px] bg-[#131313] dark:bg-white text-white dark:text-[#131313] hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {unblockMut.isPending ? 'Unblocking…' : 'Unblock User'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
