import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/mock-data';
import { useData } from '@/contexts/DataContext';
import { Building2, Bus, Brain, CalendarDays, Clock, ArrowRight, CheckCircle2, LayoutList } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

type FilterType = 'all' | 'upcoming' | 'completed';

const filters: { key: FilterType; label: string; icon: typeof LayoutList }[] = [
  { key: 'all', label: 'Todas', icon: LayoutList },
  { key: 'upcoming', label: 'Próximas', icon: Clock },
  { key: 'completed', label: 'Anteriores', icon: CheckCircle2 },
];

const iconMap: Record<string, any> = { Building2, Bus, Brain };

const Dashboard = () => {
  const navigate = useNavigate();
  const { meetings, isLoading } = useData();
  const [filter, setFilter] = useState<FilterType>('all');

  const recentMeetings = [...meetings]
    .filter(m => filter === 'all' || m.status === filter)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 10);

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
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-slate-800 dark:text-white">Panel de Control</h1>
        <p className="text-slate-600 dark:text-white/70 mt-1">Gestione reuniones, participantes y aportes colaborativos</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-xl font-bold text-slate-800 dark:text-white">Comisiones</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon];
            const catMeetings = meetings.filter(m => m.category === cat.id);
            return (
              <div
                key={cat.id}
                className="glass-card rounded-[2rem] p-6 cursor-pointer hover:shadow-lg transition-all group flex flex-col justify-between min-h-[300px]"
                onClick={() => navigate(`/category/${cat.id}`)}
              >
                <div>
                  <div className="flex items-start justify-between mb-4">
                    <div className="glass-icon-container w-12 h-12 rounded-2xl flex items-center justify-center">
                      <Icon className="w-6 h-6 text-primary" />
                    </div>
                    <ArrowRight className="w-5 h-5 text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <h3 className="text-xl font-bold leading-tight mb-2 text-slate-800 dark:text-white">{cat.title}</h3>
                  <p className="text-sm text-slate-600 dark:text-white/70 line-clamp-3">{cat.description}</p>
                </div>
                
                <div className="mt-8 space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      {/* Placeholder space for future avatars */}
                      <span className="text-sm font-medium text-slate-700 dark:text-white">{catMeetings.length} reuniones programadas</span>
                    </div>
                    {/* Placeholder Progress Ring */}
                    <div className="relative w-10 h-10 flex items-center justify-center">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                        <path
                          className="text-primary/20 dark:text-white/10"
                          strokeWidth="3"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                        <path
                          className="text-primary dark:text-white"
                          strokeDasharray="60, 100"
                          strokeWidth="3"
                          strokeLinecap="round"
                          stroke="currentColor"
                          fill="none"
                          d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        />
                      </svg>
                    </div>
                  </div>
                  <div className="glass-pill px-4 py-1.5 rounded-full text-sm font-medium text-primary w-fit inline-flex">
                    {catMeetings.length} reuniones
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-xl font-bold text-slate-800 dark:text-white">Reuniones</h2>
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
            {meetings.length === 0 && <p className="text-slate-400 text-sm mt-1">Creá una reunión desde alguna comisión para comenzar.</p>}
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

export default Dashboard;
