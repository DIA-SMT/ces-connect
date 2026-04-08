import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  name: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role: string, organization: string) => Promise<void>;
  logout: () => Promise<void>;
  isAuthenticated: boolean;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
};

const mapUser = (supabaseUser: User): AuthUser => {
  const isEmailAdmin = supabaseUser.email?.includes('admin');
  return {
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
    email: supabaseUser.email || '',
    role: supabaseUser.user_metadata?.role || (isEmailAdmin ? 'admin' : 'comun'),
  };
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      setUser(session?.user ? mapUser(session.user) : null);
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, pass: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: pass,
    });
    if (error) throw error;
    setUser(mapUser(data.user!));
  };

  const register = async (email: string, pass: string, name: string, role: string, organization: string) => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password: pass,
      options: {
        data: {
          name,
          role,
          organization,
        }
      }
    });
    if (error) throw error;
    
    // Supabase auto-logins after sign up if email confirmation is disabled
    if (data.session) {
      setUser(mapUser(data.user!));
    }
  };

  const logout = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{
      user, session, isAuthenticated: !!user, isLoading, login, register, logout
    }}>
      {children}
    </AuthContext.Provider>
  );
};
