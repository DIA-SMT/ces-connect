import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Landmark, Loader2 } from 'lucide-react';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    const result = await login(email, password);
    if (result.error) {
      setError('Credenciales incorrectas. Verificá tu correo y contraseña.');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8">
        {/* Logo */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl glass-card mb-2">
            <img src="/logoMuni-sm.png" alt="Logo Municipalidad" className="w-12 h-12 object-contain" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">CES Connect</h1>
          <p className="text-slate-600">Consejo Económico y Social · SMT</p>
        </div>

        {/* Card */}
        <div className="glass-card rounded-3xl p-8 space-y-6">
          <div>
            <h2 className="text-xl font-bold text-slate-800">Iniciar sesión</h2>
            <p className="text-sm text-slate-500 mt-1">Ingresá tus credenciales para acceder</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-medium">Correo electrónico</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="tu@correo.com"
                required
                className="glass-pill border-white/50 bg-white/50 h-11 rounded-xl"
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
                className="glass-pill border-white/50 bg-white/50 h-11 rounded-xl"
              />
            </div>

            {error && (
              <p className="text-sm text-red-600 bg-red-50/80 rounded-xl px-4 py-2.5 border border-red-100">
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="w-full h-11 rounded-xl font-semibold text-base"
              disabled={isLoading}
            >
              {isLoading ? (
                <><Loader2 className="w-4 h-4 mr-2 animate-spin" />Ingresando...</>
              ) : (
                <><Landmark className="w-4 h-4 mr-2" />Ingresar</>
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
