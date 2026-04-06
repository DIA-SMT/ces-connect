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
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border/50 bg-card/80 backdrop-blur-md">
        <div className="container flex h-16 items-center justify-between">
          <button onClick={() => navigate('/')} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
            <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-primary/10">
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
