import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils';
import { useToastStore } from '../store/toast';

const schema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, and underscores allowed'),
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(64, 'Password must be at most 64 characters')
    .regex(/[a-zA-Z]/, 'Must contain at least one letter')
    .regex(/[0-9]/, 'Must contain at least one number'),
});

type Form = z.infer<typeof schema>;

export default function Register() {
  const navigate = useNavigate();
  const addToast = useToastStore((s) => s.addToast);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  const onSubmit = async (data: Form) => {
    setServerError(null);
    try {
      const res = await authApi.register(data);
      // Backend dispatches an email verification token upon registration
      addToast('success', res.message);
      navigate('/login');
    } catch (err: unknown) {
      setServerError(getErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] dark:bg-[#111] px-4">
      <div className="w-full max-w-[400px]">
        <div className="bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl p-8 shadow-sm">
          <div className="mb-8">
            <h1 className="text-2xl font-bold text-[#131313] dark:text-white">NearbyChat</h1>
            <p className="text-sm text-[#868686] mt-1">Create an account and start connecting</p>
          </div>

          <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-5">
            {serverError && (
              <div
                className="rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] text-[#DD0000] px-4 py-3 text-sm"
                role="alert"
              >
                {serverError}
              </div>
            )}

            <div>
              <label htmlFor="reg-username" className="block text-sm font-medium text-[#131313] dark:text-white mb-1">
                Username
              </label>
              <input
                id="reg-username"
                type="text"
                autoComplete="username"
                {...register('username')}
                className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-base text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition"
                placeholder="cool_user_42"
              />
              {errors.username && (
                <p className="mt-1 text-xs text-[#DD0000]">{errors.username.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-email" className="block text-sm font-medium text-[#131313] dark:text-white mb-1">
                Email
              </label>
              <input
                id="reg-email"
                type="email"
                autoComplete="email"
                {...register('email')}
                className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-base text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-xs text-[#DD0000]">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="reg-password" className="block text-sm font-medium text-[#131313] dark:text-white mb-1">
                Password
              </label>
              <input
                id="reg-password"
                type="password"
                autoComplete="new-password"
                {...register('password')}
                className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-base text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-[#DD0000]">{errors.password.message}</p>
              )}
              <p className="mt-1 text-xs text-[#868686]">8–64 characters, at least one letter and one number</p>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#131313] text-white dark:bg-white dark:text-[#131313] rounded-2xl h-[52px] font-medium text-sm hover:opacity-85 active:opacity-75 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Creating account…' : 'Create account'}
            </button>

            <p className="text-center text-sm text-[#868686]">
              Already have an account?{' '}
              <Link to="/login" className="text-[#131313] dark:text-white font-medium underline">
                Sign in
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
