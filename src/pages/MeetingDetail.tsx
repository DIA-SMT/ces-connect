import { useParams, useNavigate } from 'react-router-dom';
import { useData } from '@/contexts/DataContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, CalendarDays, Users, FileText, Brain, Sparkles, ListChecks, Upload, Plus, Send } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';

const MeetingDetail = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { getMeeting, participants, addContribution, addParticipantToMeeting, addFileToMeeting, generateSummary, generateKeyPoints } = useData();
  const meeting = getMeeting(meetingId || '');

  const [newContribution, setNewContribution] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [keyPointsLoading, setKeyPointsLoading] = useState(false);

  if (!meeting) return <p className="p-8">Reunión no encontrada</p>;

  const handleAddContribution = () => {
    if (!newContribution || !contributorName) return;
    addContribution(meeting.id, contributorName, newContribution);
    setNewContribution('');
  };

  const handleAddParticipant = () => {
    const p = participants.find(p => p.id === selectedParticipant);
    if (p) addParticipantToMeeting(meeting.id, p);
    setSelectedParticipant('');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      addFileToMeeting(meeting.id, {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024 / 1024).toFixed(1)} MB`,
      });
    }
  };

  const handleGenerateSummary = () => {
    setSummaryLoading(true);
    setTimeout(() => { generateSummary(meeting.id); setSummaryLoading(false); }, 1500);
  };

  const handleGenerateKeyPoints = () => {
    setKeyPointsLoading(true);
    setTimeout(() => { generateKeyPoints(meeting.id); setKeyPointsLoading(false); }, 1500);
  };

  const availableParticipants = participants.filter(p => !meeting.participants.find(mp => mp.id === p.id));

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
          <ArrowLeft className="w-4 h-4" />
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold">{meeting.title}</h1>
          <div className="flex items-center gap-3 mt-1 text-sm text-muted-foreground">
            <span className="flex items-center gap-1"><CalendarDays className="w-3.5 h-3.5" />{format(new Date(meeting.date), "d 'de' MMMM, yyyy", { locale: es })}</span>
            <Badge variant={meeting.status === 'completed' ? 'secondary' : 'default'}>{meeting.status === 'completed' ? 'Finalizada' : 'Próxima'}</Badge>
          </div>
        </div>
      </div>

      {meeting.description && (
        <Card>
          <CardContent className="py-4">
            <p className="text-sm text-muted-foreground">{meeting.description}</p>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="contributions" className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="contributions" className="text-xs sm:text-sm"><FileText className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Aportes</TabsTrigger>
          <TabsTrigger value="participants" className="text-xs sm:text-sm"><Users className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Participantes</TabsTrigger>
          <TabsTrigger value="files" className="text-xs sm:text-sm"><Upload className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Archivos</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs sm:text-sm"><Brain className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />IA</TabsTrigger>
        </TabsList>

        {/* Contributions */}
        <TabsContent value="contributions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Aportes individuales</CardTitle>
              <CardDescription>Contribuciones de los participantes</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.contributions.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay aportes aún.</p>}
              {meeting.contributions.map(c => (
                <div key={c.id} className="border rounded-lg p-3 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="font-medium text-sm">{c.participantName}</span>
                    <span className="text-xs text-muted-foreground">{format(new Date(c.timestamp), 'HH:mm')}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{c.content}</p>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-base">Nuevo aporte</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              <Input placeholder="Nombre del participante" value={contributorName} onChange={e => setContributorName(e.target.value)} />
              <Textarea placeholder="Escriba su aporte..." value={newContribution} onChange={e => setNewContribution(e.target.value)} rows={4} />
              <Button onClick={handleAddContribution} disabled={!newContribution || !contributorName}>
                <Send className="w-4 h-4 mr-2" />Enviar aporte
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Participants */}
        <TabsContent value="participants" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Participantes ({meeting.participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              {meeting.participants.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Sin participantes asignados.</p>}
              <div className="space-y-2">
                {meeting.participants.map(p => (
                  <div key={p.id} className="flex items-center justify-between border rounded-lg p-3">
                    <div>
                      <p className="font-medium text-sm">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.role} — {p.organization}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {availableParticipants.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Agregar participante</CardTitle></CardHeader>
              <CardContent className="flex gap-3">
                <Select value={selectedParticipant} onValueChange={setSelectedParticipant}>
                  <SelectTrigger className="flex-1"><SelectValue placeholder="Seleccionar participante" /></SelectTrigger>
                  <SelectContent>
                    {availableParticipants.map(p => (
                      <SelectItem key={p.id} value={p.id}>{p.name} — {p.organization}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Button onClick={handleAddParticipant} disabled={!selectedParticipant}>
                  <Plus className="w-4 h-4 mr-1" />Agregar
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Files */}
        <TabsContent value="files" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Documentos ({meeting.files.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {meeting.files.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">No hay archivos subidos.</p>}
              {meeting.files.map(f => (
                <div key={f.id} className="flex items-center justify-between border rounded-lg p-3">
                  <div className="flex items-center gap-3">
                    <FileText className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-sm">{f.name}</p>
                      <p className="text-xs text-muted-foreground">{f.size} · Subido por {f.uploadedBy}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.uploadedAt}</span>
                </div>
              ))}
              <div>
                <Label htmlFor="file-upload" className="cursor-pointer">
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Haga clic para subir un archivo</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, TXT</p>
                  </div>
                </Label>
                <Input id="file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileUpload} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* AI */}
        <TabsContent value="ai" className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" />Generar resumen</CardTitle>
                <CardDescription>La IA generará un resumen basado en los aportes</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerateSummary} disabled={summaryLoading} className="w-full">
                  {summaryLoading ? 'Generando...' : 'Generar resumen'}
                </Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2"><ListChecks className="w-4 h-4 text-primary" />Puntos clave</CardTitle>
                <CardDescription>Extraer los puntos más relevantes de la reunión</CardDescription>
              </CardHeader>
              <CardContent>
                <Button onClick={handleGenerateKeyPoints} disabled={keyPointsLoading} className="w-full">
                  {keyPointsLoading ? 'Extrayendo...' : 'Extraer puntos clave'}
                </Button>
              </CardContent>
            </Card>
          </div>

          {meeting.summary && (
            <Card>
              <CardHeader><CardTitle className="text-base">Resumen generado</CardTitle></CardHeader>
              <CardContent><p className="text-sm text-muted-foreground leading-relaxed">{meeting.summary}</p></CardContent>
            </Card>
          )}

          {meeting.keyPoints && meeting.keyPoints.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-base">Puntos clave</CardTitle></CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {meeting.keyPoints.map((point, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <span className="w-5 h-5 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-medium flex-shrink-0 mt-0.5">{i + 1}</span>
                      {point}
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default MeetingDetail;
