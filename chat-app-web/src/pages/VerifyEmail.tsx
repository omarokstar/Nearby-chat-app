import { useParams, Link } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { authApi } from '../api/auth';
import { getErrorMessage } from '../utils';

/**
 * Email verification endpoint page.
 * Validates the email activation token sent via URL parameters and informs the user of their account status.
 */
export default function VerifyEmail() {
  const { userId, token } = useParams<{ userId: string; token: string }>();
  const isInvalid = !userId || !token;
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>(() => (isInvalid ? 'error' : 'loading'));
  const [message, setMessage] = useState(() => (isInvalid ? 'Invalid verification link.' : ''));

  // Dispatches token validation request to backend upon mounting with route parameters
  useEffect(() => {
    if (isInvalid) return;

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
  }, [userId, token, isInvalid]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] dark:bg-[#111] px-4">
      <div className="w-full max-w-md bg-white dark:bg-[#1a1a1a] border border-[#E3E3E3] dark:border-[#2a2a2a] rounded-3xl shadow-sm p-8 text-center space-y-5">
        {status === 'loading' && (
          <div className="py-6 space-y-4">
            <div className="w-10 h-10 mx-auto border-3 border-[#131313] dark:border-white border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-[#5D5D5D] dark:text-[#aaa]">Verifying your email address…</p>
          </div>
        )}

        {status === 'success' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#F0FDF4] border border-[#DCFCE7] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-emerald-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#131313] dark:text-white">{message || 'Email Verified!'}</h1>
            <p className="text-sm text-[#868686]">Your account is now fully active and ready to use.</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 h-11 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] font-medium text-sm hover:opacity-85 transition-opacity"
              >
                Continue to Sign In
              </Link>
            </div>
          </div>
        )}

        {status === 'error' && (
          <div className="py-4 space-y-4">
            <div className="w-14 h-14 mx-auto rounded-2xl bg-[#FFF0F0] border border-[#FFDADA] flex items-center justify-center">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-7 w-7 text-[#DD0000]" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-[#131313] dark:text-white">Verification Failed</h1>
            <p className="text-sm text-[#868686]">{message}</p>
            <div className="pt-2">
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-6 h-11 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] font-medium text-sm hover:opacity-85 transition-opacity"
              >
                Back to Sign In
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
