import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { authApi } from '../api/auth';
import { useAuthStore } from '../store/auth';
import { isLoginSuccess } from '../types';
import { getErrorMessage } from '../utils';

const schema = z.object({
  email: z.string().min(1, 'Email is required').email('Invalid email'),
  password: z.string().min(1, 'Password is required'),
});

type Form = z.infer<typeof schema>;

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const setAuth = useAuthStore((s) => s.setAuth);
  const [infoMsg, setInfoMsg] = useState<string | null>(null);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<Form>({ resolver: zodResolver(schema) });

  // Redirect back to the originally requested route after successful authentication
  const from = (location.state as { from?: string } | null)?.from ?? '/';

  const onSubmit = async (data: Form) => {
    setInfoMsg(null);
    setServerError(null);
    try {
      const res = await authApi.login(data);
      if (isLoginSuccess(res)) {
        setAuth(res.token, res.user);
        navigate(from, { replace: true });
      } else {
        // Displays verification link reminder when account activation is pending
        setInfoMsg(res.message);
      }
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
            <p className="text-sm text-[#868686] mt-1">Sign in to connect with people around you</p>
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

            {infoMsg && (
              <div
                className="rounded-2xl bg-[#F0F4FF] border border-[#D0DBFF] text-[#5D5D5D] dark:text-[#aaa] px-4 py-3 text-sm"
                role="status"
              >
                {infoMsg}
              </div>
            )}

            <div>
              <label htmlFor="login-email" className="block text-sm font-medium text-[#131313] dark:text-white mb-1">
                Email
              </label>
              <input
                id="login-email"
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
              <label htmlFor="login-password" className="block text-sm font-medium text-[#131313] dark:text-white mb-1">
                Password
              </label>
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                {...register('password')}
                className="w-full rounded-2xl border border-[#E3E3E3] dark:border-[#333] bg-white dark:bg-[#111] px-4 py-3 text-base text-[#131313] dark:text-white placeholder-[#868686] focus:outline-none focus:ring-2 focus:ring-[#131313]/20 transition"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-xs text-[#DD0000]">{errors.password.message}</p>
              )}
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-[#131313] text-white dark:bg-white dark:text-[#131313] rounded-2xl h-[52px] font-medium text-sm hover:opacity-85 active:opacity-75 transition disabled:opacity-50"
            >
              {isSubmitting ? 'Signing in…' : 'Sign in'}
            </button>

            <p className="text-center text-sm text-[#868686]">
              Don&apos;t have an account?{' '}
              <Link to="/register" className="text-[#131313] dark:text-white font-medium underline">
                Register
              </Link>
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
