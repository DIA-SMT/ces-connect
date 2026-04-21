import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Camera, ArrowLeft, Save, LogOut, Mail, User, ShieldCheck } from 'lucide-react';

// ── Utilities ────────────────────────────────────────────────────────────────

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

const AVATAR_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f59e0b',
  '#10b981', '#3b82f6', '#ef4444', '#14b8a6',
];

const getAvatarColor = (name: string) => {
  const idx = name.charCodeAt(0) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
};

// ── Component ────────────────────────────────────────────────────────────────

const ProfilePage = () => {
  const { user, logout, updateProfile, updateEmail } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // ── Avatar selection ──────────────────────────────────────────────────────

  const handleAvatarChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error('La imagen no puede superar los 5 MB');
      return;
    }
    setAvatarFile(file);
    setAvatarPreview(URL.createObjectURL(file));
  }, []);

  // ── Save handler ──────────────────────────────────────────────────────────

  const handleSave = async () => {
    if (!name.trim()) {
      toast.error('El nombre no puede estar vacío');
      return;
    }

    setIsSaving(true);
    try {
      // Update name + optional avatar
      await updateProfile(name.trim(), avatarFile ?? undefined);

      // Update email only if changed
      if (email.trim() && email.trim() !== user?.email) {
        await updateEmail(email.trim());
        toast.success('¡Perfil actualizado! Revisá tu casilla para confirmar el nuevo email.');
      } else {
        toast.success('¡Perfil actualizado correctamente!');
      }

      setAvatarFile(null); // clear pending file after upload
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al guardar los cambios';
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  // ── Current avatar src ────────────────────────────────────────────────────

  const avatarSrc = avatarPreview || user?.avatar_url || null;
  const initials = getInitials(user?.name || 'U');
  const bgColor = getAvatarColor(user?.name || 'U');

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center py-12 px-4">
      <div className="w-full max-w-lg">
        {/* Back button */}
        <button
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 group"
        >
          <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
          Volver
        </button>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 shadow-2xl">
          {/* Title */}
          <div className="flex items-center gap-3 mb-8">
            <div className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
              <User className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-xl font-bold text-foreground">Mi Perfil</h1>
              <p className="text-xs text-muted-foreground">Editá tu información personal</p>
            </div>
          </div>

          {/* Avatar section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative group">
              {/* Avatar circle */}
              <div
                className="w-28 h-28 rounded-full overflow-hidden ring-4 ring-primary/20 shadow-xl transition-transform group-hover:scale-105"
                style={{ background: avatarSrc ? 'transparent' : bgColor }}
              >
                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt="Avatar"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-white font-bold text-3xl">
                    {initials}
                  </div>
                )}
              </div>

              {/* Camera overlay button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="absolute inset-0 rounded-full flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer"
                type="button"
                title="Cambiar foto"
              >
                <Camera className="w-7 h-7 text-white drop-shadow" />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />

            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-3 text-xs text-primary hover:underline font-medium transition-colors"
              type="button"
            >
              Cambiar foto de perfil
            </button>
            <p className="text-[10px] text-muted-foreground mt-1">JPG, PNG, WEBP – máx. 5 MB</p>
          </div>

          {/* Form */}
          <div className="space-y-5">
            {/* Name */}
            <div className="space-y-2">
              <Label htmlFor="profile-name" className="flex items-center gap-2 text-sm font-medium">
                <User className="w-3.5 h-3.5 text-muted-foreground" />
                Nombre completo
              </Label>
              <Input
                id="profile-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tu nombre"
                className="rounded-xl h-11 bg-background/60"
              />
            </div>

            {/* Email */}
            <div className="space-y-2">
              <Label htmlFor="profile-email" className="flex items-center gap-2 text-sm font-medium">
                <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                Email
              </Label>
              <Input
                id="profile-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="tu@email.com"
                className="rounded-xl h-11 bg-background/60"
              />
              {email !== user?.email && email.trim() !== '' && (
                <p className="text-[11px] text-amber-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3" />
                  Recibirás un email de confirmación en la nueva dirección
                </p>
              )}
            </div>

            {/* Role badge */}
            <div className="flex items-center gap-2 px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
              <ShieldCheck className="w-4 h-4 text-primary" />
              <span className="text-sm text-foreground">
                Rol: <span className="font-semibold capitalize">{user?.role}</span>
              </span>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-8 flex flex-col gap-3">
            <Button
              id="profile-save-btn"
              onClick={handleSave}
              disabled={isSaving}
              className="w-full h-12 rounded-2xl text-base font-semibold shadow-lg shadow-primary/20 transition-all"
            >
              {isSaving ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  Guardando…
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Save className="w-4 h-4" />
                  Guardar cambios
                </span>
              )}
            </Button>

            <Button
              id="profile-logout-btn"
              variant="ghost"
              onClick={async () => { await logout(); navigate('/'); }}
              className="w-full h-11 rounded-2xl text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
            >
              <LogOut className="w-4 h-4 mr-2" />
              Cerrar sesión
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
