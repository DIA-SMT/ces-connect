import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Loader2, UserPlus, LogIn } from 'lucide-react';

const Login = () => {
  const { login, register } = useAuth();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [org, setOrg] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsLoading(true);

    try {
      if (mode === 'login') {
        await login(email, password);
      } else {
        await register(email, password, name, role, org);
        // Sometimes Supabase requires email confirmation
        setSuccess('Cuenta creada exitosamente. Si no ingresaste automáticamente, verifica tu correo.');
        setMode('login'); // switch to login implicitly if they need to verify
      }
    } catch (err: any) {
      setError(err.message === 'Invalid login credentials' ? 'Credenciales incorrectas. Verificá tu correo y contraseña.' : err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center p-4 rounded-[2.5rem] glass-card shadow-2xl shadow-primary/10 mb-2 border-white/60">
            <img src="/img_logo.png" alt="CES Connect Logo" className="h-16 w-auto object-contain" />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">CES Connect</h1>
            <p className="text-slate-500 font-medium">Municipalidad de San Miguel de Tucumán</p>
          </div>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div className="flex bg-white/40 p-1 rounded-xl">
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'login' ? 'bg-white shadow-sm text-primary' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <LogIn className="w-4 h-4" />
              Ingresar
            </button>
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
              className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium transition-all ${mode === 'register' ? 'bg-white shadow-sm text-primary' : 'text-slate-600 hover:text-slate-800'}`}
            >
              <UserPlus className="w-4 h-4" />
              Crear cuenta
            </button>
          </div>

          <div>
            <h2 className="text-xl font-bold text-slate-800">
              {mode === 'login' ? 'Iniciar sesión' : 'Registro de Participante'}
            </h2>
            <p className="text-sm text-slate-500 mt-1">
              {mode === 'login' ? 'Ingresá tus credenciales para acceder' : 'Completá tus datos para ingresar al portal'}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="name" className="text-slate-700 font-medium">Nombre completo</Label>
                  <Input id="name" value={name} onChange={e => setName(e.target.value)} placeholder="Ej: Juan Pérez" required={mode === 'register'} className="glass-pill border-white/50 bg-white/50 h-10 rounded-xl" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label htmlFor="role" className="text-slate-700 font-medium">Cargo/Rol</Label>
                    <Input id="role" value={role} onChange={e => setRole(e.target.value)} placeholder="Ej: Directora" required={mode === 'register'} className="glass-pill border-white/50 bg-white/50 h-10 rounded-xl" />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="org" className="text-slate-700 font-medium">Organización</Label>
                    <Input id="org" value={org} onChange={e => setOrg(e.target.value)} placeholder="Ej: UTN" required={mode === 'register'} className="glass-pill border-white/50 bg-white/50 h-10 rounded-xl" />
                  </div>
                </div>
              </>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="glass-pill border-white/50 bg-white/50 h-10 rounded-xl"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-medium">Contraseña</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                className="glass-pill border-white/50 bg-white/50 h-10 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50/80 rounded-xl px-4 py-2.5 border border-red-100">
                {error}
              </p>
            )}
            
            {success && (
              <p className="text-sm text-emerald-700 bg-emerald-50/80 rounded-xl px-4 py-2.5 border border-emerald-100">
                {success}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-base mt-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Aguarde...</>
              ) : mode === 'login' ? (
                <><Landmark className="w-4 h-4 mr-2" />Ingresar</>
              ) : (
                <><UserPlus className="w-4 h-4 mr-2" />Crear cuenta</>
              )}
            </Button>
          </form>
        </div>

        <p className="text-center text-xs text-slate-400">
          Municipalidad de San Miguel de Tucumán
        </p>
      </div>
    </div>
  );
};

export default Login;
