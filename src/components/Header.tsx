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
          <Link to="/" className="text-sm font-medium hover:text-brand-600 transition">
            {t.nav.home}
          </Link>
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
            <button onClick={signIn} className="text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline ml-2">
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
