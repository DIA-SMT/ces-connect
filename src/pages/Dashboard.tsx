import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { useData } from '@/contexts/DataContext';
import { useAuth } from '@/contexts/AuthContext';
import { 
  Building2, Bus, Brain, CalendarDays, Clock, ArrowRight, CheckCircle2, 
  LayoutList, AlertCircle, TrendingUp, Plus, Edit2, Trash2, 
  Users, Settings, Wallet, Globe, Shield, Search
} from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState, useMemo } from 'react';
import { 
  Dialog, DialogContent, DialogDescription, DialogFooter, 
  DialogHeader, DialogTitle, DialogTrigger 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';

type FilterType = 'all' | 'upcoming' | 'completed';

const iconOptions = [
  { id: 'Building2', icon: Building2, label: 'Edificio' },
  { id: 'Bus', icon: Bus, label: 'Transporte' },
  { id: 'Brain', icon: Brain, label: 'IA' },
  { id: 'Users', icon: Users, label: 'Usuarios' },
  { id: 'Settings', icon: Settings, label: 'Ajustes' },
  { id: 'Wallet', icon: Wallet, label: 'Economía' },
  { id: 'Globe', icon: Globe, label: 'Global' },
  { id: 'Shield', icon: Shield, label: 'Seguridad' },
];

const colorOptions = [
  { id: 'primary', bg: 'bg-primary', text: 'text-primary', label: 'Azul (Principal)' },
  { id: 'success', bg: 'bg-success', text: 'text-success', label: 'Verde (Éxito)' },
  { id: 'warning', bg: 'bg-warning', text: 'text-warning', label: 'Naranja (Aviso)' },
  { id: 'destructive', bg: 'bg-destructive', text: 'text-destructive', label: 'Rojo (Alerta)' },
  { id: 'info', bg: 'bg-blue-400', text: 'text-blue-400', label: 'Cian (Info)' },
];

const iconMap: Record<string, any> = { 
  Building2, Bus, Brain, Users, Settings, Wallet, Globe, Shield 
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { meetings, categories, isLoading, addCategory, updateCategory, deleteCategory } = useData();
  
  // Category Form State
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    icon: 'Building2',
    color: 'primary'
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleOpenDialog = (cat?: any) => {
    if (cat) {
      setEditingCategory(cat);
      setFormData({
        title: cat.title,
        description: cat.description,
        icon: cat.icon,
        color: cat.color
      });
    } else {
      setEditingCategory(null);
      setFormData({
        title: '',
        description: '',
        icon: 'Building2',
        color: 'primary'
      });
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.description) {
      toast.error('Por favor completa todos los campos obligatorios');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingCategory) {
        await updateCategory(editingCategory.id, formData);
        toast.success('Comisión actualizada correctamente');
      } else {
        await addCategory(formData.title, formData.description, formData.icon, formData.color);
        toast.success('Nueva comisión creada correctamente');
      }
      setIsDialogOpen(false);
    } catch (error: any) {
      toast.error(error.message || 'Error al procesar la solicitud');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm('¿Estás seguro de que deseas eliminar esta comisión?')) return;

    try {
      await deleteCategory(id);
      toast.success('Comisión eliminada correctamente');
    } catch (error: any) {
      toast.error(error.message || 'Error al eliminar');
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-10 px-2 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Panel de Control</h1>
          <p className="text-slate-600 mt-1">Gestione reuniones, participantes y aportes colaborativos</p>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card rounded-[2rem] p-6 min-h-[300px] animate-pulse">
              <div className="w-12 h-12 rounded-2xl bg-slate-200/60 mb-4" />
              <div className="h-5 bg-slate-200/60 rounded-lg w-3/4 mb-3" />
              <div className="h-3 bg-slate-200/40 rounded w-full mb-2" />
              <div className="h-3 bg-slate-200/40 rounded w-4/5" />
            </div>
          ))}
        </div>
        <div className="grid gap-3">
          {[1,2,3].map(i => (
            <div key={i} className="glass-card rounded-2xl p-4 animate-pulse">
              <div className="h-4 bg-slate-200/60 rounded w-2/3 mb-2" />
              <div className="h-3 bg-slate-200/40 rounded w-1/3" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-10 px-2 sm:px-0">
      <div className="relative">
        <div className="absolute -top-10 -left-10 w-64 h-64 bg-primary/5 rounded-full blur-3xl -z-10 animate-pulse" />
        <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">Panel de Control</h1>
        <p className="text-slate-600 dark:text-white/70 mt-2 text-lg">Gestione reuniones, participantes y aportes colaborativos</p>
      </div>

      <section className="space-y-6">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-8 bg-accent rounded-full" />
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">Comisiones Relevantes</h2>
          </div>
          {user?.role === 'admin' && (
            <Button 
              onClick={() => handleOpenDialog()} 
              className="rounded-2xl gap-2 shadow-lg shadow-primary/20"
            >
              <Plus className="w-4 h-4" />
              Nueva Comisión
            </Button>
          )}
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon] || LayoutList;
            const catMeetings = meetings.filter(m => m.category === cat.id);
            return (
              <div
                key={cat.id}
                className="glass-card rounded-[2.5rem] p-8 cursor-pointer hover:shadow-xl hover:-translate-y-1 transition-all group flex flex-col justify-between min-h-[320px] border-white/40"
                onClick={() => navigate(`/category/${cat.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between mb-6">
                    <div className="glass-icon-container w-14 h-14 rounded-2xl flex items-center justify-center bg-white/80 shadow-inner">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <div className="flex items-center gap-2">
                      {user?.role === 'admin' && (
                        <>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full bg-white/50 hover:bg-white text-slate-400 hover:text-primary transition-all"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDialog(cat);
                            }}
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="w-8 h-8 rounded-full bg-white/50 hover:bg-destructive/10 text-slate-400 hover:text-destructive transition-all"
                            onClick={(e) => handleDelete(e, cat.id)}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </Button>
                        </>
                      )}
                      <div className="w-10 h-10 rounded-full flex items-center justify-center bg-primary/5 group-hover:bg-primary group-hover:text-white transition-all">
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                      </div>
                    </div>
                  </div>
                  <h3 className="text-2xl font-bold leading-tight mb-3 text-slate-800 dark:text-white group-hover:text-primary transition-colors">{cat.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-white/70 line-clamp-3 leading-relaxed">{cat.description}</p>
                </div>
                
                <div className="mt-auto pt-6 flex items-center justify-between">
                  <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold px-4 py-1.5 rounded-xl">
                    {catMeetings.length} {catMeetings.length === 1 ? 'Reunión' : 'Reuniones'}
                  </Badge>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest group-hover:text-primary transition-colors">Ver Detalles</span>
                </div>
              </div>
            );
          })}
        </div>
      </section>



      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px] rounded-[2rem] border-white/40 bg-white/60 backdrop-blur-xl shadow-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-primary">
              {editingCategory ? 'Editar Comisión' : 'Nueva Comisión'}
            </DialogTitle>
            <DialogDescription>
              {editingCategory 
                ? 'Actualice los detalles de la comisión seleccionada.' 
                : 'Cree una nueva comisión para organizar sus reuniones vinculadas.'}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-6 py-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title" className="text-sm font-bold px-1">Título de la Comisión</Label>
                <Input
                  id="title"
                  placeholder="Ej: Infraestructura y Obra Pública"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl border-slate-200 focus-visible:ring-primary h-11"
                  disabled={!!editingCategory} // Only allow title change for NEW categories to keep slug ID logic simple
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description" className="text-sm font-bold px-1">Descripción</Label>
                <Textarea
                  id="description"
                  placeholder="Describa el propósito de esta comisión..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="rounded-xl border-slate-200 focus-visible:ring-primary min-h-[100px]"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label className="text-sm font-bold px-1 text-center block">Icono</Label>
                  <div className="grid grid-cols-4 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    {iconOptions.map((opt) => {
                      const Icon = opt.icon;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() => setFormData({ ...formData, icon: opt.id })}
                          className={`w-full aspect-square rounded-xl flex items-center justify-center transition-all ${
                            formData.icon === opt.id 
                              ? 'bg-primary text-white shadow-md' 
                              : 'bg-white text-slate-400 hover:text-primary hover:bg-primary/5'
                          }`}
                          title={opt.label}
                        >
                          <Icon className="w-4 h-4" />
                        </button>
                      );
                    })}
                  </div>
                </div>
                <div className="space-y-2">
                  <Label className="text-sm font-bold px-1 text-center block">Color</Label>
                  <div className="grid grid-cols-5 gap-2 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                    {colorOptions.map((opt) => (
                      <button
                        key={opt.id}
                        type="button"
                        onClick={() => setFormData({ ...formData, color: opt.id })}
                        className={`w-full aspect-square rounded-full transition-all border-4 ${
                          formData.color === opt.id 
                            ? 'border-white shadow-md scale-110' 
                            : 'border-transparent scale-90 opacity-60 hover:opacity-100'
                        } ${opt.bg}`}
                        title={opt.label}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter className="pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsDialogOpen(false)}
                className="rounded-xl"
              >
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={isSubmitting}
                className="rounded-xl gap-2 min-w-[120px]"
              >
                {isSubmitting && <Clock className="w-4 h-4 animate-spin" />}
                {editingCategory ? 'Guardar Cambios' : 'Crear Comisión'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;
