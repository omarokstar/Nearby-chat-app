import { useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usersApi } from '../api/users';
import { useGeolocation } from '../hooks/useGeolocation';
import { useToastStore } from '../store/toast';
import { formatDistance, getErrorMessage } from '../utils';
import Avatar from '../components/Avatar';
import { SkeletonList } from '../components/Skeleton';
import { useIntersection } from '../hooks/useIntersection';

export default function Nearby() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const qc = useQueryClient();
  const { latitude, longitude, error: geoError, loading: geoLoading, requestLocation } = useGeolocation();
  const hasRequestedRef = useRef(false);

  // Ask for location on first visit
  useEffect(() => {
    if (!hasRequestedRef.current) {
      hasRequestedRef.current = true;
      requestLocation();
    }
  }, [requestLocation]);

  // Send location to backend
  const locationMut = useMutation({
    mutationFn: usersApi.updateLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nearby'] });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  // Send location whenever we get new coords
  useEffect(() => {
    if (latitude !== null && longitude !== null) {
      locationMut.mutate({ latitude, longitude });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [latitude, longitude]);

  // Fetch nearby users
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useInfiniteQuery({
    queryKey: ['nearby'],
    queryFn: ({ pageParam }) => usersApi.getNearby(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.users.length === last.limit ? last.page + 1 : undefined,
    enabled: locationMut.isSuccess,
  });

  const { ref: sentinelRef, isVisible } = useIntersection({ threshold: 0.5 });

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(() => {
    requestLocation();
  }, [requestLocation]);

  const radiusKm = data?.pages[0]?.radiusKm;
  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];
  const locationNeeded = !locationMut.isSuccess && !geoLoading && !geoError;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Nearby People</h1>
          {radiusKm !== undefined && (
            <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">
              Showing people within {radiusKm} km
            </p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={geoLoading || locationMut.isPending}
          className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-500 hover:bg-brand-600 text-white transition-colors disabled:opacity-50 flex items-center gap-2"
        >
          {(geoLoading || locationMut.isPending) && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
          Refresh location
        </button>
      </div>

      {/* Geo error */}
      {geoError && (
        <div className="rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 px-4 py-3 text-sm text-amber-700 dark:text-amber-300 space-y-2">
          <p>{geoError}</p>
          <button
            onClick={requestLocation}
            className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
          >
            Retry
          </button>
        </div>
      )}

      {/* Location needed prompt */}
      {locationNeeded && (
        <div className="rounded-xl bg-brand-50 dark:bg-brand-900/20 border border-brand-200 dark:border-brand-800 px-4 py-3 text-sm text-brand-700 dark:text-brand-300">
          We need your location to show nearby people. Click "Refresh location" to get started.
        </div>
      )}

      {/* API error */}
      {isError && (
        <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 text-sm" role="alert">
          {getErrorMessage(error)}
        </div>
      )}

      {/* Loading */}
      {isLoading && <SkeletonList count={6} />}

      {/* Empty state */}
      {!isLoading && !isError && locationMut.isSuccess && allUsers.length === 0 && (
        <div className="text-center py-12 space-y-3">
          <div className="w-16 h-16 mx-auto rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-slate-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-slate-500 dark:text-slate-400 font-medium">No one nearby</p>
          <p className="text-sm text-slate-400 dark:text-slate-500">
            Try again later or ask an admin to increase the search radius.
          </p>
        </div>
      )}

      {/* Users list */}
      <div className="space-y-3">
        {allUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-4 p-4 rounded-xl bg-white/70 dark:bg-slate-800/70 backdrop-blur border border-slate-100 dark:border-slate-700/50 shadow-sm hover:shadow-md transition-shadow animate-slide-up"
          >
            <Avatar name={u.username} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-slate-900 dark:text-white truncate">{u.username}</p>
              <p className="text-sm text-slate-500 dark:text-slate-400">
                {formatDistance(u.distanceMeters)} away
              </p>
            </div>
            <button
              onClick={() => navigate(`/chats/${u.id}`)}
              className="px-4 py-2 text-sm font-medium rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 dark:text-brand-400 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
            >
              Message
            </button>
          </div>
        ))}
      </div>

      {/* Infinite scroll sentinel */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="w-6 h-6 border-2 border-brand-500 border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
