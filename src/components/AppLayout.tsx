import { ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Landmark, LogOut } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';

const AppLayout = ({ children }: { children: ReactNode }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  return (
    <div className="min-h-screen bg-transparent">
      <header className="sticky top-4 z-50 mx-4 sm:mx-8 mt-4 rounded-2xl glass-card">
        <div className="container flex h-16 items-center justify-between px-4 sm:px-6">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-10 h-10 rounded-2xl bg-white/50 shadow-sm border border-white/60">
              <Landmark className="w-5 h-5 text-primary" />
            </div>
            <div className="leading-none">
              <span className="font-bold text-foreground">CES</span>
              <span className="hidden sm:block text-xs text-muted-foreground">Consejo Económico y Social</span>
            </div>
          </button>

          <div className="flex items-center gap-4">
            <span className="text-sm text-muted-foreground hidden sm:block">{user?.name}</span>
            <Button variant="ghost" size="icon" onClick={() => { logout(); navigate('/'); }}>
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container py-8">{children}</main>
    </div>
  );
};

export default AppLayout;
