import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Menu, X, Share2, LogOut, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../config';
import { t } from '../i18n/en';

export function Header() {
  const { user, profile, signIn, signOut } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const inviteLink = `https://wa.me/?text=${encodeURIComponent(`Check out ${APP_NAME} — share leftover parts with fellow students and makers! ${window.location.origin}`)}`;

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto max-w-3xl px-4 flex h-16 items-center justify-between">
        <div className="flex items-center gap-4">
          <Link to="/" className="text-xl font-bold text-brand-600 dark:text-brand-400">
            {APP_NAME}
          </Link>
          
          <nav className="hidden md:flex items-center gap-4">
            <Link to="/" className="text-sm font-medium hover:text-brand-600 transition">
              {t.nav.home}
            </Link>
            {user && (
              <Link to="/me" className="text-sm font-medium hover:text-brand-600 transition">
                {t.nav.myPosts}
              </Link>
            )}
          </nav>
        </div>

        <div className="hidden md:flex items-center gap-4">
          <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-xs">
            <Share2 className="h-4 w-4" />
            {t.nav.inviteFriends}
          </a>
          
          {user ? (
            <div className="flex items-center gap-3">
              <span className="text-sm flex items-center gap-1"><User className="h-4 w-4" /> {profile?.display_name || 'User'}</span>
              <button onClick={signOut} className="btn-secondary py-1.5 px-3 text-xs">
                <LogOut className="h-4 w-4" />
                {t.nav.signOut}
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="btn-primary py-1.5 px-4 text-xs">
              {t.nav.signIn}
            </button>
          )}
        </div>

        <div className="flex md:hidden items-center gap-2">
          <button onClick={toggleMenu} aria-label="Toggle mobile menu" className="p-2 text-gray-600 dark:text-gray-300">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-4">
          <nav className="flex flex-col gap-4">
            <Link to="/" onClick={toggleMenu} className="text-base font-medium">
              {t.nav.home}
            </Link>
            {user && (
              <Link to="/me" onClick={toggleMenu} className="text-base font-medium">
                {t.nav.myPosts}
              </Link>
            )}
            <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="text-base font-medium flex items-center gap-2 text-brand-600 dark:text-brand-400">
              <Share2 className="h-5 w-5" />
              {t.nav.inviteFriends}
            </a>
          </nav>
          
          <div className="pt-4 border-t border-gray-200 dark:border-gray-800">
            {user ? (
              <div className="flex flex-col gap-4">
                <span className="text-sm flex items-center gap-2"><User className="h-5 w-5" /> {profile?.display_name || 'User'}</span>
                <button onClick={() => { signOut(); toggleMenu(); }} className="btn-secondary w-full justify-center">
                  <LogOut className="h-4 w-4" />
                  {t.nav.signOut}
                </button>
              </div>
            ) : (
              <button onClick={() => { signIn(); toggleMenu(); }} className="btn-primary w-full justify-center">
                {t.nav.signIn}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
