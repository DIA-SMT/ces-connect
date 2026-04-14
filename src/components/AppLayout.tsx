import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import VirtualAssistant from '@/components/VirtualAssistant';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

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
                variant={location.pathname === '/meetings' || location.pathname.startsWith('/meeting') ? 'default' : 'ghost'} 
                onClick={() => navigate('/meetings')}
                className={`rounded-xl h-9 ${location.pathname === '/meetings' || location.pathname.startsWith('/meeting') ? 'shadow-md shadow-primary/20' : ''}`}
              >
                Reuniones
              </Button>
              <Button 
                variant={location.pathname === '/participants' ? 'default' : 'ghost'} 
                onClick={() => navigate('/participants')}
                className={`rounded-xl h-9 ${location.pathname === '/participants' ? 'shadow-md shadow-primary/20' : ''}`}
              >
                Participantes
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="md:hidden flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>Comisiones</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/meetings')}>Reuniones</Button>
              <Button variant="ghost" size="sm" onClick={() => navigate('/participants')}>Participantes</Button>
            </div>
            <div className="flex flex-col items-end mr-2">
              <span className="text-sm font-semibold text-foreground hidden sm:block">{user?.name}</span>
              <span className="text-[10px] text-muted-foreground hidden sm:block">Conectado</span>
            </div>
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

export default AppLayout;
