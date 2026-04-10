import { useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { LayoutList, Clock, CheckCircle2, CalendarDays, TrendingUp, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

type FilterType = 'all' | 'upcoming' | 'completed';

const filters: { key: FilterType; label: string; icon: typeof LayoutList }[] = [
  { key: 'all', label: 'Todas', icon: LayoutList },
  { key: 'upcoming', label: 'Próximas', icon: Clock },
  { key: 'completed', label: 'Anteriores', icon: CheckCircle2 },
];

const MeetingsPage = () => {
  const navigate = useNavigate();
  const { meetings, categories, isLoading } = useData();
  const [filter, setFilter] = useState<FilterType>('all');

  const recentMeetings = [...meetings]
    .filter(m => filter === 'all' || m.status === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (isLoading) {
    return (
      <div className="space-y-10 px-2 sm:px-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-800">Reuniones Globales</h1>
          <p className="text-slate-600 mt-1">Explora todas las reuniones de las distintas comisiones</p>
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
        <h1 className="text-4xl font-extrabold tracking-tight text-primary drop-shadow-sm">Todas las Reuniones</h1>
        <p className="text-slate-600 dark:text-white/70 mt-2 text-lg">Busca y filtra reuniones de todas las comisiones</p>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Listado Global</h2>
          <div className="glass-card rounded-2xl p-1.5 flex gap-1">
            {filters.map(f => {
              const Icon = f.icon;
              const count = f.key === 'all'
                ? meetings.length
                : meetings.filter(m => m.status === f.key).length;
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
                  <span className="hidden sm:inline">{f.label}</span>
                  <span className={`text-xs font-bold px-1.5 py-0.5 rounded-full ${
                    active ? 'bg-white/20' : 'bg-slate-100 text-slate-500 dark:bg-white/10 dark:text-white/60'
                  }`}>
                    {count}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
        {recentMeetings.length === 0 ? (
          <div className="glass-card rounded-2xl p-10 text-center">
            <p className="text-4xl mb-3">
              {filter === 'upcoming' ? '📅' : filter === 'completed' ? '✅' : '📋'}
            </p>
            <p className="text-slate-500 font-medium">
              {filter === 'upcoming' && 'No hay reuniones próximas.'}
              {filter === 'completed' && 'No hay reuniones anteriores.'}
              {filter === 'all' && 'No hay reuniones registradas aún.'}
            </p>
            {meetings.length === 0 && <p className="text-slate-400 text-sm mt-1">Crea una reunión desde alguna comisión para comenzar.</p>}
          </div>
        ) : (
        <div className="grid gap-3">
          {recentMeetings.map(m => (
            <div
              key={m.id}
              className="glass-card rounded-2xl cursor-pointer hover:shadow-md transition-all group"
              onClick={() => navigate(`/meeting/${m.id}`)}
            >
              <div className="flex items-center justify-between p-4 sm:px-6">
                <div className="space-y-1.5">
                  <p className="font-semibold text-slate-800 dark:text-white">{m.title}</p>
                  <div className="flex items-center gap-3 text-sm text-slate-600 dark:text-white/70">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays className="w-4 h-4" />
                      {format(new Date(m.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    <div className={`glass-pill px-3 py-0.5 rounded-full text-xs font-semibold ${m.status === 'completed' ? 'text-slate-600 dark:text-white/70' : 'text-primary dark:text-white'}`}>
                      {m.status === 'completed' ? 'Finalizada' : 'Próxima'}
                    </div>
                    {categories.find(c => c.id === m.category) && (
                      <div className="flex items-center gap-1.5 text-xs font-bold text-slate-500 bg-slate-100/50 dark:bg-white/5 px-2 py-0.5 rounded-md">
                        <LayoutList className="w-3 h-3" />
                        {categories.find(c => c.id === m.category)?.title}
                      </div>
                    )}
                    {m.progressLevel && (
                      <div className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-md uppercase tracking-tighter ${
                        m.progressLevel === 'excelente' || m.progressLevel === 'bueno' ? 'text-success bg-success/10' : 
                        m.progressLevel === 'regular' ? 'text-warning bg-warning/10' : 'text-destructive bg-destructive/10'
                      }`}>
                        <TrendingUp className="w-3 h-3" />
                        {m.progressLevel}
                      </div>
                    )}
                  </div>
                </div>
                <ArrowRight className="w-5 h-5 text-slate-400 group-hover:text-primary transition-colors" />
              </div>
            </div>
          ))}
        </div>
        )}
      </section>
    </div>
  );
};

export default MeetingsPage;
