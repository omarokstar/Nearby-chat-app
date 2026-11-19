import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils';

export default function VerifyEmail() {
  const { userId, token } = useParams<{ userId: string; token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!userId || !token) {
      setStatus('error');
      setMessage('Invalid verification link.');
      return;
    }

    authApi
      .verifyEmail(userId, token)
      .then((res) => {
        setStatus('success');
        setMessage(res.message);
      })
      .catch((err: unknown) => {
        setStatus('error');
        setMessage(getErrorMessage(err));
      });
  }, [userId, token]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 px-4">
      <div className="w-full max-w-md animate-fade-in bg-white/80 dark:bg-slate-800/80 backdrop-blur-lg rounded-2xl shadow-xl p-8 text-center space-y-4">
        {status === 'loading' && (
          <>
            <div className="w-10 h-10 mx-auto border-4 border-brand-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-slate-600 dark:text-slate-300">Verifying your email…</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-emerald-100 dark:bg-emerald-900/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600 dark:text-emerald-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">{message}</h1>
            <Link
              to="/login"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition"
            >
              Go to Login
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 mx-auto rounded-full bg-rose-100 dark:bg-rose-900/40 flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-rose-600 dark:text-rose-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 dark:text-white">Verification Failed</h1>
            <p className="text-sm text-slate-500 dark:text-slate-400">{message}</p>
            <Link
              to="/login"
              className="inline-block mt-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition"
            >
              Go to Login
            </Link>
          </>
        )}
      </div>
    </div>
  );
}
