import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Plus, ArrowLeft, Users, ArrowRight, Clock, CheckCircle2, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

type FilterType = 'all' | 'upcoming' | 'completed';

const filters: { key: FilterType; label: string; icon: typeof LayoutList }[] = [
  { key: 'all', label: 'Todas', icon: LayoutList },
  { key: 'upcoming', label: 'Próximas', icon: Clock },
  { key: 'completed', label: 'Anteriores', icon: CheckCircle2 },
];

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { categories, getMeetingsByCategory, addMeeting, isLoading } = useData();
  const { user } = useAuth();
  const category = categories.find(c => c.id === categoryId);
  const allMeetings = getMeetingsByCategory(categoryId || '');

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');
  const [filter, setFilter] = useState<FilterType>('all');

  if (isLoading) return <div className="p-8 text-center animate-pulse text-slate-400">Cargando comisión...</div>;
  if (!category) return <div className="p-8 text-center text-slate-400">Categoría no encontrada</div>;

  const handleCreate = async () => {
    if (!title || !date) return;
    await addMeeting({ title, date, category: categoryId!, description });
    setTitle(''); setDate(''); setDescription('');
    setOpen(false);
  };

  const filteredMeetings = allMeetings.filter(m => {
    if (filter === 'all') return true;
    return m.status === filter;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')} className="rounded-xl">
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">{category.title}</h1>
          <p className="text-sm text-slate-500 mt-0.5">{category.description}</p>
        </div>
      </div>

      {/* Filter Bar + New Button */}
      <div className="flex items-center justify-between gap-4 flex-wrap">
        {/* Filter pills */}
        <div className="glass-card rounded-2xl p-1.5 flex gap-1">
          {filters.map(f => {
            const Icon = f.icon;
            const count = f.key === 'all'
              ? allMeetings.length
              : allMeetings.filter(m => m.status === f.key).length;
            const active = filter === f.key;
            return (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-slate-600 hover:bg-white/60 dark:text-white/70'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {f.label}
                <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                  active ? 'bg-white/20' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60'
                }`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>

        {/* New meeting button */}
        {user?.role === 'admin' && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button className="rounded-xl gap-2">
                <Plus className="w-4 h-4" />
                Nueva reunión
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white/80 backdrop-blur-xl border border-white/60 shadow-xl rounded-3xl sm:max-w-md w-[95vw] max-h-[85vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="text-slate-800">Crear reunión</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label className="text-slate-700">Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la reunión" className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Fecha</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} className="rounded-xl" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-slate-700">Descripción</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción de la reunión..." className="rounded-xl" />
              </div>
              <Button onClick={handleCreate} className="w-full rounded-xl">Crear reunión</Button>
            </div>
          </DialogContent>
        </Dialog>
        )}
      </div>

      {/* Meetings list */}
      {filteredMeetings.length === 0 ? (
        <div className="glass-card rounded-2xl p-12 text-center">
          <div className="text-4xl mb-3">
            {filter === 'upcoming' ? '📅' : filter === 'completed' ? '✅' : '📋'}
          </div>
          <p className="text-slate-500 font-medium">
            {filter === 'upcoming' && 'No hay reuniones próximas en esta comisión.'}
            {filter === 'completed' && 'No hay reuniones anteriores en esta comisión.'}
            {filter === 'all' && 'No hay reuniones en esta comisión aún.'}
          </p>
        </div>
      ) : (
        <div className="grid gap-3">
          {filteredMeetings.map(m => (
            <div
              key={m.id}
              className="glass-card rounded-2xl cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/meeting/${m.id}`)}
            >
              <div className="flex items-center justify-between p-4 sm:px-6">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-white">{m.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-3.5 h-3.5" />
                      {format(new Date(m.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" />
                      {m.participants.length} participantes
                    </span>
                    <span className={`glass-pill px-3 py-0.5 rounded-full text-xs font-semibold ${
                      m.status === 'completed'
                        ? 'text-slate-500'
                        : 'text-primary'
                    }`}>
                      {m.status === 'completed' ? 'Finalizada' : 'Próxima'}
                    </span>
                  </div>
                  {m.summary && (
                    <p className="text-xs text-slate-400 line-clamp-1 mt-1">{m.summary}</p>
                  )}
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors flex-shrink-0 ml-4" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
