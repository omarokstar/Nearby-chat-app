import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../api/admin';
import { useToastStore } from '../store/toast';
import { getErrorMessage } from '../utils';

const schema = z.object({
  radiusKm: z
    .number({ error: 'Must be a number' })
    .min(0.1, 'Minimum 0.1 km')
    .max(500, 'Maximum 500 km')
    .refine((v) => Number((v * 100).toFixed(0)) === v * 100, 'Max 2 decimal places'),
});

type Form = z.infer<typeof schema>;

export default function AdminSettings() {
  const qc = useQueryClient();
  const addToast = useToastStore((s) => s.addToast);

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
    <div className="max-w-xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Settings</h1>

      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur rounded-2xl border border-slate-200 dark:border-slate-700/50 shadow-sm p-6 space-y-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-900 dark:text-white">Search Radius</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-1">
            The maximum distance (in km) within which users can discover each other.
          </p>
        </div>

        {isError && (
          <div className="rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-4 py-3 text-sm" role="alert">
            {getErrorMessage(error)}
          </div>
        )}

        {isLoading ? (
          <div className="space-y-3">
            <div className="h-10 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse-soft" />
            <div className="h-10 w-32 rounded-xl bg-slate-200 dark:bg-slate-700 animate-pulse-soft" />
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label htmlFor="radiusKm" className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">
                Radius (km)
              </label>
              <input
                id="radiusKm"
                type="number"
                step="0.01"
                min="0.1"
                max="500"
                {...register('radiusKm', { valueAsNumber: true })}
                className="w-full max-w-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-2.5 text-sm text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-500 transition"
              />
              {errors.radiusKm && (
                <p className="mt-1 text-xs text-rose-500">{errors.radiusKm.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !isDirty}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 active:scale-[0.98] transition disabled:opacity-50"
            >
              {isSubmitting ? 'Saving…' : 'Save'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
