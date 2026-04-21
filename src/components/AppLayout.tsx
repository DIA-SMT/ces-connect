import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut, HelpCircle } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import VirtualAssistant from '@/components/VirtualAssistant';
import { OnboardingTourProvider, useTour } from '@/components/OnboardingTour';

// ── Avatar helpers ─────────────────────────────────────────────────────────
const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

// ── Inner layout (needs access to useTour inside provider) ────────────────────

const AppLayoutInner = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { startTour } = useTour();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-4 z-50 mx-4 sm:mx-8 mt-4 rounded-2xl glass-card border-primary/10">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-6">
            <button onClick={() => navigate('/')} className="flex items-center hover:opacity-80 transition-opacity">
              <img src="/img_logo.png" alt="Logo" className="h-10 w-auto object-contain" />
            </button>
            
            <nav className="hidden md:flex items-center gap-1">
              <Button 
                variant={location.pathname === '/' || location.pathname.startsWith('/category') ? 'default' : 'ghost'} 
                onClick={() => navigate('/')}
                className={`rounded-xl h-9 ${location.pathname === '/' || location.pathname.startsWith('/category') ? 'shadow-md shadow-primary/20' : ''}`}
              >
                Comisiones
              </Button>
              <Button 
                id="tour-nav-reuniones"
                variant={location.pathname === '/meetings' || location.pathname.startsWith('/meeting') ? 'default' : 'ghost'} 
                onClick={() => navigate('/meetings')}
                className={`rounded-xl h-9 ${location.pathname === '/meetings' || location.pathname.startsWith('/meeting') ? 'shadow-md shadow-primary/20' : ''}`}
              >
                Reuniones
              </Button>
              <Button 
                id="tour-nav-participantes"
                variant={location.pathname === '/participants' ? 'default' : 'ghost'} 
                onClick={() => navigate('/participants')}
                className={`rounded-xl h-9 ${location.pathname === '/participants' ? 'shadow-md shadow-primary/20' : ''}`}
              >
                Participantes
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-2">
            <div className="md:hidden flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Comisiones</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>Reuniones</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/participants')}>Participantes</Button>
            </div>
            {/* Avatar → goes to /profile */}
            <button
              id="header-avatar-btn"
              onClick={() => navigate('/profile')}
              title={`Perfil de ${user?.name}`}
              className="w-9 h-9 rounded-full overflow-hidden ring-2 ring-primary/30 hover:ring-primary/70 transition-all shadow-md flex-shrink-0 focus:outline-none focus:ring-primary"
              style={{ background: user?.avatar_url ? 'transparent' : getAvatarColor(user?.name || 'U') }}
            >
              {user?.avatar_url ? (
                <img src={user.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                  {getInitials(user?.name || 'U')}
                </span>
              )}
            </button>
            {/* Tour replay button */}
            <Button
              variant="ghost"
              size="icon"
              className="rounded-xl w-8 h-8 text-muted-foreground hover:text-primary"
              onClick={startTour}
              title="Ver tour de introducción"
            >
              <HelpCircle className="w-4 h-4" />
            </Button>
            <Button variant="secondary" size="icon" className="rounded-xl" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4 text-primary" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">{children}</main>
      <VirtualAssistant />
    </div>
  );
};

// ── AppLayout wraps everything in the tour provider ───────────────────────────

const AppLayout = ({ children }: { children: ReactNode }) => (
  <OnboardingTourProvider>
    <AppLayoutInner>{children}</AppLayoutInner>
  </OnboardingTourProvider>
);

export default AppLayout;
