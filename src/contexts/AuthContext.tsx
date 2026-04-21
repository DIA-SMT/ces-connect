import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: string;
  avatar_url: string;
}

interface AuthContextType {
  user: AuthUser | null;
  session: Session | null;
  login: (email: string, pass: string) => Promise<void>;
  register: (email: string, pass: string, name: string, role: string, organization: string) => Promise<void>;
  logout: () => Promise<void>;
  updateProfile: (name: string, avatarFile?: File) => Promise<void>;
  updateEmail: (newEmail: string) => Promise<void>;
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
    id: supabaseUser.id,
    name: supabaseUser.user_metadata?.name || supabaseUser.email?.split('@')[0] || 'Usuario',
    email: supabaseUser.email || '',
    role: supabaseUser.user_metadata?.role || (isEmailAdmin ? 'admin' : 'comun'),
    avatar_url: supabaseUser.user_metadata?.avatar_url || '',
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

  const updateProfile = async (name: string, avatarFile?: File) => {
    if (!user) throw new Error('No hay usuario autenticado');

    let avatar_url = user.avatar_url;

    // Upload avatar if a new file was provided
    if (avatarFile) {
      const ext = avatarFile.name.split('.').pop();
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, avatarFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      // Append cache-busting param so the browser reloads the image after update
      avatar_url = `${urlData.publicUrl}?t=${Date.now()}`;
    }

    const { data, error } = await supabase.auth.updateUser({
      data: { name, avatar_url },
    });

    if (error) throw error;
    if (data.user) setUser(mapUser(data.user));
  };

  const updateEmail = async (newEmail: string) => {
    const { error } = await supabase.auth.updateUser({ email: newEmail });
    if (error) throw error;
    // Supabase sends a confirmation email; actual change requires clicking the link
  };

  return (
    <AuthContext.Provider value={{
      user, session, isAuthenticated: !!user, isLoading,
      login, register, logout, updateProfile, updateEmail,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
