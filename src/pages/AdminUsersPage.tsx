import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import {
  ArrowLeft, Users, Search, ShieldCheck, ShieldOff,
  RefreshCw, Mail, Calendar, LogIn,
} from 'lucide-react';

// ── Types ─────────────────────────────────────────────────────────────────────

interface ManagedUser {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'comun';
  avatar_url: string;
  created_at: string;
  last_sign_in_at: string | null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

const EDGE_FN_URL = 'https://hkbnobojlsslhwyantdv.supabase.co/functions/v1/manage-users';

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];
const getInitials = (name: string) =>
  name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);
const getAvatarColor = (name: string) =>
  AVATAR_COLORS[name.charCodeAt(0) % AVATAR_COLORS.length];

const formatDate = (iso: string | null) => {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
  });
};

// ── Component ─────────────────────────────────────────────────────────────────

const AdminUsersPage = () => {
  // ⚠️ ALL hooks must be called unconditionally (Rules of Hooks)
  const { user, session } = useAuth();
  const navigate = useNavigate();

  const [users, setUsers] = useState<ManagedUser[]>([]);
  const [filtered, setFiltered] = useState<ManagedUser[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [updating, setUpdating] = useState<string | null>(null);

  // ── Fetch users ─────────────────────────────────────────────────────────────
  const fetchUsers = useCallback(async (token: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);
      setUsers(data.users);
      setFiltered(data.users);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al cargar usuarios');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Run only once session token is available
  useEffect(() => {
    if (session?.access_token && user?.role === 'admin') {
      fetchUsers(session.access_token);
    }
  }, [session?.access_token, user?.role, fetchUsers]);

  // ── Search filter ───────────────────────────────────────────────────────────
  useEffect(() => {
    const q = search.toLowerCase();
    setFiltered(
      users.filter(
        (u) =>
          u.name.toLowerCase().includes(q) ||
          u.email.toLowerCase().includes(q) ||
          u.role.toLowerCase().includes(q),
      ),
    );
  }, [search, users]);

  // ── Role update ─────────────────────────────────────────────────────────────
  const handleRoleChange = async (targetUser: ManagedUser, newRole: 'admin' | 'comun') => {
    if (targetUser.role === newRole || !session?.access_token) return;
    setUpdating(targetUser.id);
    try {
      const res = await fetch(EDGE_FN_URL, {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ userId: targetUser.id, role: newRole }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || `Error ${res.status}`);

      setUsers((prev) =>
        prev.map((u) => (u.id === targetUser.id ? { ...u, role: newRole } : u)),
      );
      toast.success(`Rol de ${targetUser.name} actualizado a "${newRole}"`);
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Error al actualizar rol');
    } finally {
      setUpdating(null);
    }
  };

  // ── Guard (after all hooks) ─────────────────────────────────────────────────
  if (user?.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
        <ShieldOff className="w-12 h-12 text-muted-foreground" />
        <p className="text-lg font-semibold text-foreground">Acceso restringido</p>
        <p className="text-sm text-muted-foreground">Solo los administradores pueden ver esta página.</p>
        <Button variant="ghost" onClick={() => navigate('/')}>Volver al inicio</Button>
      </div>
    );
  }

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-4xl mx-auto py-4 px-2">
      {/* Back */}
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>
      </div>

      <div className="glass-card rounded-3xl p-6 md:p-8 shadow-2xl">
        {/* Title row */}
        <div className="flex items-center justify-between flex-wrap gap-4 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Gestión de usuarios</h1>
              <p className="text-xs text-muted-foreground">
                {users.length} usuario{users.length !== 1 ? 's' : ''} registrado{users.length !== 1 ? 's' : ''}
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="rounded-xl gap-2"
            onClick={() => session?.access_token && fetchUsers(session.access_token)}
            disabled={isLoading}
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Actualizar
          </Button>
        </div>

        {/* Search */}
        <div className="relative mb-5">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
          <Input
            id="admin-users-search"
            placeholder="Buscar por nombre, email o rol…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 rounded-xl h-10 bg-background/60"
          />
        </div>

        {/* User list */}
        {isLoading ? (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">No se encontraron usuarios</p>
          </div>
        ) : (
          <div className="space-y-2">
            {filtered.map((u) => {
              const isCurrentUser = u.id === user?.id;
              const isUpdating = updating === u.id;

              return (
                <div
                  key={u.id}
                  className="flex items-center justify-between gap-3 px-4 py-3 rounded-2xl bg-background/50 border border-border/40 hover:border-primary/20 transition-all"
                >
                  {/* Avatar + info */}
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-9 h-9 rounded-full overflow-hidden flex-shrink-0 ring-2 ring-primary/10"
                      style={{ background: u.avatar_url ? 'transparent' : getAvatarColor(u.name) }}
                    >
                      {u.avatar_url ? (
                        <img src={u.avatar_url} alt={u.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="w-full h-full flex items-center justify-center text-white text-xs font-bold">
                          {getInitials(u.name)}
                        </span>
                      )}
                    </div>

                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-sm font-semibold text-foreground truncate">
                          {u.name}
                          {isCurrentUser && (
                            <span className="ml-1 text-[10px] text-primary font-normal">(vos)</span>
                          )}
                        </span>
                        <span
                          className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                            u.role === 'admin'
                              ? 'bg-primary/15 text-primary'
                              : 'bg-muted text-muted-foreground'
                          }`}
                        >
                          {u.role}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground truncate">
                          <Mail className="w-3 h-3 flex-shrink-0" />
                          {u.email}
                        </span>
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground hidden sm:flex">
                          <Calendar className="w-3 h-3" />
                          {formatDate(u.created_at)}
                        </span>
                        {u.last_sign_in_at && (
                          <span className="flex items-center gap-1 text-[11px] text-muted-foreground hidden md:flex">
                            <LogIn className="w-3 h-3" />
                            {formatDate(u.last_sign_in_at)}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Role toggle */}
                  <div className="flex items-center gap-2 flex-shrink-0">
                    {isUpdating ? (
                      <div className="w-5 h-5 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                    ) : u.role === 'comun' ? (
                      <Button
                        id={`promote-${u.id}`}
                        size="sm"
                        variant="outline"
                        className="rounded-xl h-8 text-xs gap-1.5 hover:border-primary hover:text-primary transition-colors"
                        onClick={() => handleRoleChange(u, 'admin')}
                        disabled={isCurrentUser}
                        title="Promover a admin"
                      >
                        <ShieldCheck className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Hacer admin</span>
                      </Button>
                    ) : (
                      <Button
                        id={`demote-${u.id}`}
                        size="sm"
                        variant="ghost"
                        className="rounded-xl h-8 text-xs gap-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                        onClick={() => handleRoleChange(u, 'comun')}
                        disabled={isCurrentUser}
                        title={isCurrentUser ? 'No podés quitarte el admin' : 'Quitar admin'}
                      >
                        <ShieldOff className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Quitar admin</span>
                      </Button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminUsersPage;
