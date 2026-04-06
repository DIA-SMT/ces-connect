import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { categories } from '@/lib/mock-data';
import { useData } from '@/contexts/DataContext';
import { Building2, Bus, Brain, CalendarDays, Clock, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

const iconMap: Record<string, any> = { Building2, Bus, Brain };

const Dashboard = () => {
  const navigate = useNavigate();
  const { meetings } = useData();

  const recentMeetings = [...meetings]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Panel de Control</h1>
        <p className="text-muted-foreground mt-1">Gestione reuniones, participantes y aportes colaborativos</p>
      </div>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Comisiones</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {categories.map(cat => {
            const Icon = iconMap[cat.icon];
            const catMeetings = meetings.filter(m => m.category === cat.id);
            return (
              <Card
                key={cat.id}
                className="cursor-pointer hover:shadow-md transition-all hover:border-primary/30 group"
                onClick={() => navigate(`/category/${cat.id}`)}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary" />
                    </div>
                    <ArrowRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                  <CardTitle className="text-base mt-3">{cat.title}</CardTitle>
                  <CardDescription className="text-sm">{cat.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Badge variant="secondary">{catMeetings.length} reuniones</Badge>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="text-lg font-semibold">Reuniones recientes</h2>
        <div className="grid gap-3">
          {recentMeetings.map(m => (
            <Card
              key={m.id}
              className="cursor-pointer hover:shadow-sm transition-all hover:border-primary/20"
              onClick={() => navigate(`/meeting/${m.id}`)}
            >
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{m.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3 h-3" />
                      {format(new Date(m.date), "d 'de' MMMM, yyyy", { locale: es })}
                    </span>
                    <Badge variant={m.status === 'completed' ? 'secondary' : 'default'} className="text-xs">
                      {m.status === 'completed' ? 'Finalizada' : 'Próxima'}
                    </Badge>
                  </div>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
};

export default Dashboard;
