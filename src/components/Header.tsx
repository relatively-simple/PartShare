import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, X, Share2, LogOut, User, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { APP_NAME } from '../config';
import { t } from '../i18n/en';

export function Header() {
  const { user, profile, signIn, signOut } = useAuth();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const inviteLink = `https://wa.me/?text=${encodeURIComponent(`Check out ${APP_NAME} — share leftover parts with fellow students and makers! ${window.location.origin}`)}`;

  const toggleMenu = () => setMobileMenuOpen(!mobileMenuOpen);
  
  const handlePostClick = () => {
    if (!user) {
      signIn();
    } else {
      navigate('/new?type=offer');
    }
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md">
      <div className="mx-auto w-full px-4 sm:px-6 flex h-16 items-center justify-between">
        
        {/* Left Side: Logo */}
        <div className="flex items-center w-1/4">
          <Link to="/" className="text-xl font-bold text-brand-600 dark:text-brand-400">
            {APP_NAME}
          </Link>
        </div>
        
        {/* Center: Navigation (Hidden on mobile) */}
        <nav className="hidden md:flex flex-1 items-center justify-center gap-6">
          {user && (
            <Link to="/me" className="text-sm font-medium hover:text-brand-600 transition">
              {t.nav.myPosts}
            </Link>
          )}
        </nav>

        {/* Right Side: Actions */}
        <div className="hidden md:flex items-center justify-end gap-4 w-1/4 min-w-max">
          <button onClick={handlePostClick} className="btn-primary py-1.5 px-3 text-sm flex items-center gap-1 shadow-sm">
            <Plus className="h-4 w-4" />
            Post a Part
          </button>
          
          <a href={inviteLink} target="_blank" rel="noopener noreferrer" className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-1">
            <Share2 className="h-4 w-4" />
            <span className="hidden lg:inline">{t.nav.inviteFriends}</span>
          </a>
          
          {user ? (
            <div className="flex items-center gap-3 ml-2 border-l border-gray-200 dark:border-gray-800 pl-4">
              <span className="text-sm font-medium flex items-center gap-1 text-gray-700 dark:text-gray-300">
                <User className="h-4 w-4" /> 
                <span className="hidden xl:inline">{profile?.display_name || 'User'}</span>
              </span>
              <button onClick={signOut} className="text-gray-500 hover:text-red-500 transition-colors p-1" aria-label="Sign out">
                <LogOut className="h-5 w-5" />
              </button>
            </div>
          ) : (
            <button onClick={signIn} className="btn-secondary py-1.5 px-3 text-sm flex items-center gap-2 font-medium">
              <svg className="w-4 h-4" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              {t.nav.signIn}
            </button>
          )}
        </div>

        {/* Mobile menu toggle */}
        <div className="flex md:hidden items-center gap-3">
          <button onClick={handlePostClick} className="btn-primary p-1.5 rounded-lg shadow-sm">
            <Plus className="h-5 w-5" />
          </button>
          <button onClick={toggleMenu} aria-label="Toggle mobile menu" className="p-1 text-gray-600 dark:text-gray-300">
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 px-4 py-4 space-y-4 shadow-lg absolute w-full left-0">
          <nav className="flex flex-col gap-4">
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
              <button onClick={() => { signIn(); toggleMenu(); }} className="btn-secondary w-full justify-center flex items-center gap-2">
                <svg className="w-5 h-5" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
                </svg>
                {t.nav.signIn}
              </button>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
