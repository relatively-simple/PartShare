import { Outlet, Link } from 'react-router-dom';
import { Header } from './Header';

export function Layout() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 w-full max-w-3xl mx-auto px-4 py-6">
        <Outlet />
      </main>
      <footer className="w-full bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 flex flex-wrap gap-4 justify-center text-sm text-gray-500 dark:text-gray-400">
          <Link to="/about" className="hover:text-brand-600 transition">About</Link>
          <Link to="/how-it-works" className="hover:text-brand-600 transition">How It Works</Link>
          <Link to="/rules" className="hover:text-brand-600 transition">Community Rules</Link>
          <Link to="/privacy" className="hover:text-brand-600 transition">Privacy</Link>
          <span>&copy; {new Date().getFullYear()} PartShare</span>
        </div>
      </footer>
    </div>
  );
}
