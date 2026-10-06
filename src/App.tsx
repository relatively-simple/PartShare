import { Suspense, lazy } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ToastProvider } from './contexts/ToastContext';
import { Layout } from './components/Layout';
import { LoadingSpinner } from './components/LoadingSpinner';

const Home = lazy(() => import('./pages/Home').then(m => ({ default: m.Home })));
const NewPost = lazy(() => import('./pages/NewPost').then(m => ({ default: m.NewPost })));
const PostDetail = lazy(() => import('./pages/PostDetail').then(m => ({ default: m.PostDetail })));
const MyPosts = lazy(() => import('./pages/MyPosts').then(m => ({ default: m.MyPosts })));
const Onboarding = lazy(() => import('./pages/Onboarding').then(m => ({ default: m.Onboarding })));
const EditPost = lazy(() => import('./pages/EditPost').then(m => ({ default: m.EditPost })));
const About = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.About })));
const HowItWorks = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.HowItWorks })));
const Rules = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Rules })));
const Privacy = lazy(() => import('./pages/StaticPages').then(m => ({ default: m.Privacy })));

function RequireAuth({ children, requireOnboarding = true }: { children: React.ReactNode; requireOnboarding?: boolean }) {
  const { user, loading, needsOnboarding } = useAuth();
  
  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/" />;
  if (requireOnboarding && needsOnboarding) return <Navigate to="/onboarding" />;
  return <>{children}</>;
}

export function App() {
  return (
    <AuthProvider>
      <ToastProvider>
        <BrowserRouter>
          <Suspense fallback={<LoadingSpinner />}>
            <Routes>
              <Route path="/" element={<Layout />}>
                <Route index element={<Home />} />
                <Route path="p/:id" element={<PostDetail />} />
                <Route path="new" element={<RequireAuth><NewPost /></RequireAuth>} />
                <Route path="edit/:id" element={<RequireAuth><EditPost /></RequireAuth>} />
                <Route path="me" element={<RequireAuth><MyPosts /></RequireAuth>} />
                <Route path="onboarding" element={<RequireAuth requireOnboarding={false}><Onboarding /></RequireAuth>} />
                
                <Route path="about" element={<About />} />
                <Route path="how-it-works" element={<HowItWorks />} />
                <Route path="rules" element={<Rules />} />
                <Route path="privacy" element={<Privacy />} />
                
                <Route path="*" element={<Navigate to="/" />} />
              </Route>
            </Routes>
          </Suspense>
        </BrowserRouter>
      </ToastProvider>
    </AuthProvider>
  );
}
