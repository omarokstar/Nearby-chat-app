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

  // Syncs updated user coordinates to the backend and triggers nearby cache invalidation
  const locationMut = useMutation({
    mutationFn: usersApi.updateLocation,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['nearby'] });
      addToast('success', 'Location updated');
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  // Automatically request browser coordinates on initial component mount
  useEffect(() => {
    if (!hasRequestedRef.current) {
      hasRequestedRef.current = true;
      requestLocation(false).then((coords) => {
        if (coords) {
          locationMut.mutate(coords);
        }
      });
    }
  }, [requestLocation, locationMut]);

  // Infinite query for paginated nearby users ordered by proximity
  const {
    data,
    isLoading,
    isError,
    error,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isRefetching,
    refetch,
  } = useInfiniteQuery({
    queryKey: ['nearby'],
    queryFn: ({ pageParam }) => usersApi.getNearby(pageParam as number, 20),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.users.length === last.limit ? last.page + 1 : undefined,
    enabled: locationMut.isSuccess || (latitude !== null && longitude !== null),
  });

  const { ref: sentinelRef, isVisible } = useIntersection({ threshold: 0.5 });

  useEffect(() => {
    if (isVisible && hasNextPage && !isFetchingNextPage) {
      fetchNextPage();
    }
  }, [isVisible, hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleRefresh = useCallback(async () => {
    const coords = await requestLocation(true);
    if (coords) {
      locationMut.mutate(coords);
    } else if (latitude !== null && longitude !== null) {
      locationMut.mutate({ latitude, longitude });
    }
    await qc.invalidateQueries({ queryKey: ['nearby'] });
    refetch();
  }, [requestLocation, locationMut, latitude, longitude, qc, refetch]);

  const isActionLoading = geoLoading || locationMut.isPending || isRefetching;
  const radiusKm = data?.pages[0]?.radiusKm;
  const allUsers = data?.pages.flatMap((p) => p.users) ?? [];
  const locationNeeded = !locationMut.isSuccess && latitude === null && !geoLoading && !geoError;

  return (
    <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#131313] dark:text-white">Nearby People</h1>
          {radiusKm !== undefined ? (
            <p className="text-sm text-[#868686] mt-1">
              Showing active members within a {radiusKm} km radius
            </p>
          ) : (
            <p className="text-sm text-[#868686] mt-1">Discover people around your current location</p>
          )}
        </div>
        <button
          onClick={handleRefresh}
          disabled={isActionLoading}
          className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] text-sm font-medium hover:opacity-85 transition-opacity disabled:opacity-50 shrink-0"
        >
          {isActionLoading && (
            <div className="w-3.5 h-3.5 border-2 border-white dark:border-[#131313] border-t-transparent rounded-full animate-spin" />
          )}
          {!isActionLoading && (
            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd" />
            </svg>
          )}
          Refresh location
        </button>
      </div>

      {/* Geolocation permission denial or device acquisition error alert */}
      {geoError && (
        <div className="rounded-2xl bg-[#FFF8E0] border border-[#FFE599] text-[#7A5A00] px-4 py-3 text-sm space-y-1">
          <p className="font-medium">Location Access Needed</p>
          <p className="text-xs">{geoError}</p>
          <button
            onClick={() => requestLocation(true)}
            className="text-xs font-semibold underline hover:opacity-80 mt-1 inline-block"
          >
            Retry Permission
          </button>
        </div>
      )}

      {/* Action banner prompting user to allow geolocation access */}
      {locationNeeded && (
        <div className="rounded-2xl bg-[#F8F8F8] dark:bg-[#202020] border border-[#E3E3E3] dark:border-[#333] px-4 py-4 text-sm text-[#5D5D5D] dark:text-[#aaa] flex items-center justify-between gap-4">
          <span>We need your location to show people nearby. Click &quot;Refresh location&quot; to begin.</span>
          <button
            onClick={() => requestLocation(true)}
            className="px-3 py-1.5 rounded-xl bg-[#131313] text-white dark:bg-white dark:text-[#131313] text-xs font-medium hover:opacity-85 shrink-0"
          >
            Grant Location
          </button>
        </div>
      )}

      {/* Backend API failure alert */}
      {isError && (
        <div
          className="rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] px-4 py-3 text-sm"
          role="alert"
        >
          {getErrorMessage(error)}
        </div>
      )}

      {/* Animated placeholder skeletons displayed during initial coordinate or user lookup */}
      {isLoading && <SkeletonList count={6} />}

      {/* Empty state shown when no other members are found within configured discovery radius */}
      {!isLoading && !isError && (locationMut.isSuccess || latitude !== null) && allUsers.length === 0 && (
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl text-center py-16 px-6 space-y-3">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] flex items-center justify-center">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-[#868686]" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clipRule="evenodd" />
            </svg>
          </div>
          <p className="text-base font-medium text-[#131313] dark:text-white">No one nearby right now</p>
          <p className="text-sm text-[#868686] max-w-sm mx-auto">
            There are no active users within your current search radius. Check back later or expand the area.
          </p>
        </div>
      )}

      {/* Responsive card grid of discovered members with proximity badges */}
      <div className="grid gap-3 sm:grid-cols-2">
        {allUsers.map((u) => (
          <div
            key={u.id}
            className="flex items-center gap-3.5 p-4 rounded-2xl bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] shadow-sm hover:border-[#131313]/30 dark:hover:border-white/30 transition-all"
          >
            <Avatar name={u.username} size="lg" />
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-[#131313] dark:text-white truncate">{u.username}</p>
              <p className="text-xs text-[#868686] mt-0.5">
                {formatDistance(u.distanceMeters)} away
              </p>
            </div>
            <button
              onClick={() => navigate(`/chats/${u.id}`)}
              className="px-3.5 py-1.5 text-xs font-medium rounded-[12px] bg-[#F8F8F8] dark:bg-[#252525] border border-[#E3E3E3] dark:border-[#333] text-[#131313] dark:text-white hover:bg-[#EFEFEF] dark:hover:bg-[#2e2e2e] transition-colors shrink-0"
            >
              Message
            </button>
          </div>
        ))}
      </div>

      {/* Intersection observer sentinel element for triggering infinite pagination */}
      {hasNextPage && (
        <div ref={sentinelRef} className="flex justify-center py-4">
          {isFetchingNextPage && (
            <div className="w-5 h-5 border-2 border-[#131313] dark:border-white border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      )}
    </div>
  );
}
