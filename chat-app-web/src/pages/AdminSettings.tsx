import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils';

/**
 * Schema validating the administrative global search radius (0.1 to 500 km, max 2 decimals).
 */
const schema = z.object({
  radiusKm: z
    .number({ error: 'Must be a number' })
    .min(0.1, 'Minimum 0.1 km')
    .max(500, 'Maximum 500 km')
    .refine((v) => Number((v * 100).toFixed(0)) === v * 100, 'Max 2 decimal places'),
});

type Form = z.infer<typeof schema>;

/**
 * System Settings administration panel.
 * Allows workspace administrators to configure global geolocation discovery constraints.
 */
export default function AdminSettings() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

  // Queries current discovery radius setting
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['admin-radius'],
    queryFn: adminApi.getRadius,
  });

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<Form>({
    resolver: zodResolver(schema),
    values: data ? { radiusKm: data.radiusKm } : undefined,
  });

  // Mutates system discovery radius and refreshes query cache
  const mutation = useMutation({
    mutationFn: (vals: Form) => adminApi.setRadius(vals.radiusKm),
    onSuccess: (res) => {
      addToast('success', `Search radius updated to ${res.radiusKm} km`);
      qc.setQueryData(['admin-radius'], res);
      reset({ radiusKm: res.radiusKm });
    },
    onError: (err: unknown) => addToast('error', getErrorMessage(err)),
  });

  const onSubmit = (vals: Form) => mutation.mutate(vals);

  return (
    <div className="max-w-xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#131313] dark:text-white">Settings</h1>
        <p className="text-sm text-[#868686] mt-1">Global workspace and system preferences</p>
      </div>

      <div className="bg-white dark:bg-[#1a1a1a] rounded-3xl border border-[#E3E3E3] dark:border-[#2a2a2a] shadow-sm p-6 sm:p-8 space-y-6">
        <div>
          <h2 className="text-base font-semibold text-[#131313] dark:text-white">Discovery Search Radius</h2>
          <p className="text-sm text-[#868686] mt-1">
            Configure the maximum radius (in kilometers) for nearby user exploration queries.
          </p>
        </div>

        {isError && (
          <div
            className="rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] px-4 py-3 text-sm"
            role="alert"
          >
            {getErrorMessage(error)}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            <div className="h-11 rounded-2xl bg-[#F8F8F8] dark:bg-[#252525] animate-pulse" />
            <div className="h-11 w-28 rounded-[14px] bg-[#F8F8F8] dark:bg-[#252525] animate-pulse" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="radiusKm" className="block text-sm font-medium text-[#131313] dark:text-white mb-1.5">
                Radius (kilometers)
              </label>
              <div className="relative max-w-xs">
                <input
                  id="radiusKm"
                  type="number"
                  step="0.01"
                  min="0.1"
                  max="500"
                  {...register('radiusKm', { valueAsNumber: true })}
                  className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-sm text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition pr-12"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 text-xs font-medium text-[#868686]">
                  km
                </span>
              </div>
              {errors.radiusKm && (
                <p className="mt-1.5 text-xs text-[#DD0000]">{errors.radiusKm.message}</p>
              )}
              <p className="mt-1.5 text-xs text-[#868686]">Accepted range: 0.1 to 500 km (up to 2 decimals)</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="px-6 py-2.5 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] font-medium text-sm hover:opacity-85 active:opacity-75 transition-opacity disabled:opacity-40"
            >
              {isSubmitting ? 'Saving changes…' : 'Save changes'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
