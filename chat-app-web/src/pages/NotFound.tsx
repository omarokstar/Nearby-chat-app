import { Link } from 'react-router-dom';

/**
 * 404 Not Found fallback view rendered when an unknown route is accessed.
 */
export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F8F8F8] dark:bg-[#111] px-4">
      <div className="text-center max-w-sm space-y-4">
        <h1 className="text-8xl font-black text-[#131313] dark:text-white tracking-tighter">
          404
        </h1>
        <p className="text-base font-medium text-[#131313] dark:text-white">Page not found</p>
        <p className="text-sm text-[#868686]">
          The page or user resource you requested could not be located.
        </p>
        <div className="pt-2">
          <Link
            to="/"
            className="inline-flex items-center justify-center px-6 h-11 rounded-[14px] bg-[#131313] text-white dark:bg-white dark:text-[#131313] font-medium text-sm hover:opacity-85 transition-opacity"
          >
            Return to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
