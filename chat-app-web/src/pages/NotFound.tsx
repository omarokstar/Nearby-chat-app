import { Link } from 'react-router-dom';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-brand-50 via-white to-violet-50 dark:from-slate-950 dark:via-slate-900 dark:to-brand-950 px-4">
      <div className="text-center animate-fade-in space-y-4">
        <h1 className="text-7xl font-extrabold bg-gradient-to-r from-brand-500 to-violet-500 bg-clip-text text-transparent">
          404
        </h1>
        <p className="text-lg text-slate-600 dark:text-slate-400">
          The page you're looking for doesn't exist.
        </p>
        <Link
          to="/"
          className="inline-block px-6 py-2.5 rounded-xl bg-gradient-to-r from-brand-600 to-violet-600 text-white font-semibold text-sm shadow-lg shadow-brand-500/25 hover:shadow-brand-500/40 transition"
        >
          Go Home
        </Link>
      </div>
    </div>
  );
}
