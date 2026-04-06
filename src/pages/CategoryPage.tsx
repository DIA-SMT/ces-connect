import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { categories } from '@/lib/mock-data';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CalendarDays, Plus, ArrowLeft, Users, ArrowRight } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

const CategoryPage = () => {
  const { categoryId } = useParams();
  const navigate = useNavigate();
  const { getMeetingsByCategory, addMeeting } = useData();
  const category = categories.find(c => c.id === categoryId);
  const meetings = getMeetingsByCategory(categoryId || '');

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [date, setDate] = useState('');
  const [description, setDescription] = useState('');

  if (!category) return <p>Categoría no encontrada</p>;

  const handleCreate = () => {
    if (!title || !date) return;
    addMeeting({ title, date, category: categoryId!, description });
    setTitle(''); setDate(''); setDescription('');
    setOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{category.title}</h1>
          <p className="text-sm text-muted-foreground">{category.description}</p>
        </div>
      </div>

      <div className="flex justify-end">
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button><Plus className="w-4 h-4 mr-2" />Nueva reunión</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Crear reunión</DialogTitle></DialogHeader>
            <div className="space-y-4 pt-2">
              <div className="space-y-2">
                <Label>Título</Label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Título de la reunión" />
              </div>
              <div className="space-y-2">
                <Label>Fecha</Label>
                <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
              </div>
              <div className="space-y-2">
                <Label>Descripción</Label>
                <Textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Descripción..." />
              </div>
              <Button onClick={handleCreate} className="w-full">Crear reunión</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {meetings.length === 0 ? (
        <Card><CardContent className="py-12 text-center text-muted-foreground">No hay reuniones en esta comisión aún.</CardContent></Card>
      ) : (
        <div className="grid gap-3">
          {meetings.map(m => (
            <Card key={m.id} className="cursor-pointer hover:shadow-sm transition-all hover:border-primary/20" onClick={() => navigate(`/meeting/${m.id}`)}>
              <CardContent className="flex items-center justify-between py-4">
                <div className="space-y-1">
                  <p className="font-medium text-sm">{m.title}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1"><CalendarDays className="w-3 h-3" />{format(new Date(m.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
                    <span className="flex items-center gap-1"><Users className="w-3 h-3" />{m.participants.length} participantes</span>
                    <Badge variant={m.status === 'completed' ? 'secondary' : 'default'} className="text-xs">{m.status === 'completed' ? 'Finalizada' : 'Próxima'}</Badge>
                  </div>
                  {m.summary && <p className="text-xs text-muted-foreground line-clamp-1 mt-1">{m.summary}</p>}
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default CategoryPage;
