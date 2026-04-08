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
import { ArrowLeft, CalendarDays, Users, FileText, Brain, Sparkles, ListChecks, Upload, Plus, Send, MessageSquare, Paperclip } from 'lucide-react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const MeetingDetail = () => {
  const { meetingId } = useParams();
  const navigate = useNavigate();
  const { getMeeting, participants, addContribution, addDebateMessage, addParticipantToMeeting, addFileToMeeting, generateSummary, generateKeyPoints } = useData();
  const { user } = useAuth();
  const meeting = getMeeting(meetingId || '');

  const [newContribution, setNewContribution] = useState('');
  const [newDebateMessage, setNewDebateMessage] = useState('');
  const [contributorName, setContributorName] = useState('');
  const [selectedParticipant, setSelectedParticipant] = useState('');
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [summaryLoading, setSummaryLoading] = useState(false);
  const [keyPointsLoading, setKeyPointsLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);

  if (!meeting) return <p className="p-8">Reunión no encontrada</p>;

  const handleAddContribution = async () => {
    if ((!newContribution && !pendingFile) || !contributorName) return;
    setUploadLoading(true);
    try {
      await addContribution(meeting.id, contributorName, newContribution, pendingFile || undefined);
      setNewContribution('');
      setPendingFile(null);
    } catch (err) {
      console.error(err);
      alert('Error al enviar el aporte');
    } finally {
      setUploadLoading(false);
    }
  };

  const handleAddDebateMessage = async () => {
    if (!newDebateMessage) return;
    await addDebateMessage(meeting.id, user?.name || 'Invitado', newDebateMessage);
    setNewDebateMessage('');
  };

  const handleAddParticipant = () => {
    const p = participants.find(p => p.id === selectedParticipant);
    if (p) addParticipantToMeeting(meeting.id, p);
    setSelectedParticipant('');
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setPendingFile(file);
    }
  };

  const handleImmediateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadLoading(true);
      try {
        await addFileToMeeting(meeting.id, file, user?.name || 'Usuario');
      } catch (err) {
        console.error(err);
        alert('Error al subir el archivo');
      } finally {
        setUploadLoading(false);
        e.target.value = '';
      }
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

      <Tabs defaultValue="debate" className="space-y-4">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="debate" className="text-xs sm:text-sm"><MessageSquare className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Debate</TabsTrigger>
          <TabsTrigger value="contributions" className="text-xs sm:text-sm"><FileText className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Aportes</TabsTrigger>
          <TabsTrigger value="participants" className="text-xs sm:text-sm"><Users className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Participantes</TabsTrigger>
          <TabsTrigger value="files" className="text-xs sm:text-sm"><Upload className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />Archivos</TabsTrigger>
          <TabsTrigger value="ai" className="text-xs sm:text-sm"><Brain className="w-3.5 h-3.5 mr-1.5 hidden sm:inline" />IA</TabsTrigger>
        </TabsList>

        {/* Debate - Chat thread */}
        <TabsContent value="debate" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2"><MessageSquare className="w-4 h-4 text-primary" />Espacio de Debate</CardTitle>
              <CardDescription>Discusión sobre los temas y aportes de la reunión</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.debateMessages.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">Aún no hay mensajes en el debate. ¡Sé el primero en participar!</p>
              )}
              
              <div className="space-y-6 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                {[
                  ...meeting.debateMessages.map(m => ({ type: 'message' as const, id: m.id, author: m.authorName, content: m.content, time: m.createdAt })),
                  ...meeting.contributions.map(c => ({ 
                    type: 'contribution' as const, 
                    id: c.id, 
                    author: c.participantName, 
                    content: c.content, 
                    time: c.timestamp,
                    file: c.filePath ? { name: c.fileName, url: c.url, size: c.fileSize } : null
                  })),
                  ...meeting.files.map(f => ({ 
                    type: 'file' as const, 
                    id: f.id, 
                    author: f.uploadedBy, 
                    content: f.name, 
                    time: f.uploadedAt, 
                    size: f.size, 
                    url: f.url 
                  })),
                ]
                  .sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime())
                  .map((item) => {
                    if (item.type === 'message') {
                      return (
                        <div key={item.id} className={`flex flex-col gap-1 ${item.author === user?.name ? 'items-end' : 'items-start'}`}>
                          <div className="flex items-center gap-2 px-1">
                            <span className="text-[10px] font-semibold text-muted-foreground uppercase">{item.author}</span>
                            <span className="text-[10px] text-muted-foreground/60">{format(new Date(item.time), 'HH:mm')}</span>
                          </div>
                          <div className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                            item.author === user?.name 
                              ? 'bg-primary text-primary-foreground rounded-tr-none' 
                              : 'bg-muted rounded-tl-none'
                          }`}>
                            {item.content}
                          </div>
                        </div>
                      );
                    } else {
                      // Contribution (might have file) or independent File card
                      const isContribution = item.type === 'contribution';
                      const hasFile = isContribution ? !!(item as any).file : true;
                      const fileData = isContribution ? (item as any).file : { name: item.content, url: (item as any).url, size: (item as any).size };

                      return (
                        <div key={item.id} className="flex flex-col items-center gap-2 my-2">
                          <div className="flex items-center gap-2 w-full">
                            <div className="h-[1px] flex-1 bg-border/50"></div>
                            <span className="text-[10px] text-muted-foreground/50 font-medium uppercase tracking-widest bg-background px-2">
                              Aporte de {item.author} • {format(new Date(item.time), 'HH:mm')}
                            </span>
                            <div className="h-[1px] flex-1 bg-border/50"></div>
                          </div>
                          
                          <div className="w-full max-w-[90%] border rounded-xl p-3 bg-muted/20 border-dashed border-primary/30 space-y-3">
                            {isContribution && item.content && (
                              <p className={`text-sm ${hasFile ? 'font-medium' : 'text-muted-foreground italic'}`}>
                                {item.content}
                              </p>
                            )}
                            
                            {hasFile && (
                              <div className="flex gap-3 items-center bg-background p-3 rounded-lg border border-primary/10">
                                <div className="w-8 h-8 rounded-full bg-info/10 flex items-center justify-center flex-shrink-0">
                                  <Paperclip className="w-4 h-4 text-info" />
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="text-xs font-semibold truncate">{fileData.name}</span>
                                    {fileData.url && (
                                      <a href={fileData.url} target="_blank" rel="noopener noreferrer" className="text-[10px] text-primary hover:underline font-bold flex-shrink-0">
                                        VER ARCHIVO
                                      </a>
                                    )}
                                  </div>
                                  <p className="text-[10px] text-muted-foreground">{fileData.size}</p>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    }
                  })}
              </div>
            </CardContent>
          </Card>

          <Card className="sticky bottom-4 border-primary/20 shadow-lg">
            <CardContent className="pt-4 p-3 sm:p-4">
              <div className="flex gap-2">
                <Textarea 
                  placeholder="Escribe tu opinión o comentario para el debate..." 
                  value={newDebateMessage} 
                  onChange={e => setNewDebateMessage(e.target.value)} 
                  className="min-h-[50px] resize-none"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleAddDebateMessage();
                    }
                  }}
                />
                <Button onClick={handleAddDebateMessage} disabled={!newDebateMessage} className="h-auto px-4">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Aportes - Unified Entry and List */}
        <TabsContent value="contributions" className="space-y-4">
          <Card className="border-primary/20 bg-primary/5">
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Plus className="w-4 h-4 text-primary" />Nuevo Aporte o Archivo</CardTitle>
              <CardDescription>Sube documentos o escribe aportes formales aquí</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-3">
                  <Input placeholder="Tu nombre" value={contributorName} onChange={e => setContributorName(e.target.value)} />
                  <Textarea placeholder="Escribe el contenido del aporte..." value={newContribution} onChange={e => setNewContribution(e.target.value)} rows={3} />
                </div>
                
                <div className="flex flex-col justify-center gap-2">
                  <Label htmlFor="aporte-file-upload" className={`cursor-pointer ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                    <div className="border-2 border-dashed rounded-lg p-8 text-center bg-background/50 hover:border-primary/50 transition-colors">
                      {pendingFile ? (
                        <>
                          <FileText className="w-6 h-6 mx-auto text-primary mb-2" />
                          <p className="text-sm font-medium text-primary truncate px-2">{pendingFile.name}</p>
                          <Button variant="ghost" size="sm" className="mt-2 text-xs text-muted-foreground hover:text-destructive" onClick={(e) => { e.preventDefault(); setPendingFile(null); }}>
                            Quitar archivo
                          </Button>
                        </>
                      ) : (
                        <>
                          <Paperclip className="w-6 h-6 mx-auto text-primary mb-2" />
                          <p className="text-sm font-medium">Adjuntar Documento</p>
                          <p className="text-xs text-muted-foreground mt-1">Sube PDF, DOC o TXT directamente</p>
                        </>
                      )}
                    </div>
                  </Label>
                  <Input id="aporte-file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleFileSelect} />
                </div>
              </div>
              <div className="flex justify-end pt-2">
                <Button onClick={handleAddContribution} disabled={(!newContribution && !pendingFile) || !contributorName || uploadLoading} className="w-full sm:w-auto">
                  {uploadLoading ? 'Enviando...' : 'Publicar Aporte'}
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Contenido Aportado</CardTitle>
              <CardDescription>Todo lo cargado oficialmente para ser debatido</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {meeting.contributions.length === 0 && meeting.files.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">No hay aportes ni archivos cargados aún.</p>
              )}

              {[
                ...meeting.contributions.map(c => ({
                  type: 'contribution' as const,
                  id: c.id,
                  author: c.participantName,
                  content: c.content,
                  time: c.timestamp,
                  file: c.filePath ? { name: c.fileName, url: c.url, size: c.fileSize } : null
                })),
                ...meeting.files.map(f => ({
                  type: 'file' as const,
                  id: f.id,
                  author: f.uploadedBy,
                  content: f.name,
                  time: f.uploadedAt,
                  size: f.size,
                  url: f.url,
                })),
              ]
                .sort((a, b) => new Date(b.time).getTime() - new Date(a.time).getTime()) // Most recent first for primary feed
                .map(item => (
                  <div key={item.id} className="flex gap-3 border rounded-xl p-4 bg-muted/30">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
                      item.type === 'contribution' ? 'bg-primary/10' : 'bg-info/10'
                    }`}>
                      {item.type === 'contribution'
                        ? <FileText className="w-5 h-5 text-primary" />
                        : <Paperclip className="w-5 h-5 text-info" />
                      }
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-semibold text-sm">{item.author}</span>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] text-muted-foreground">{format(new Date(item.time), "HH:mm")}</span>
                          <Badge variant={item.type === 'contribution' ? 'secondary' : 'outline'} className="text-[10px] font-normal uppercase tracking-wider">
                            {item.type === 'contribution' ? 'Texto' : 'Documento'}
                          </Badge>
                        </div>
                      </div>
                      {item.type === 'contribution' ? (
                        <div className="space-y-3 mt-2">
                          {item.content && <p className="text-sm text-muted-foreground leading-relaxed">{item.content}</p>}
                          {(item as any).file && (
                            <div className="flex items-center gap-3 p-3 rounded-lg bg-background border border-primary/10">
                              <FileText className="w-5 h-5 text-primary" />
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{(item as any).file.name}</p>
                                <p className="text-[10px] text-muted-foreground">{(item as any).file.size}</p>
                              </div>
                              {(item as any).file.url && (
                                <Button variant="outline" size="sm" asChild className="h-8">
                                  <a href={(item as any).file.url} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                                </Button>
                              )}
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="flex items-center gap-3 mt-2 p-3 rounded-lg bg-background border border-primary/10">
                          <FileText className="w-5 h-5 text-primary" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{item.content}</p>
                            <p className="text-[10px] text-muted-foreground">{(item as any).size}</p>
                          </div>
                          {item.url && (
                            <Button variant="outline" size="sm" asChild className="h-8">
                              <a href={item.url as string} target="_blank" rel="noopener noreferrer">Ver archivo</a>
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                ))}
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

          {user?.role === 'admin' && availableParticipants.length > 0 && (
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
                      {f.url ? (
                        <a href={f.url} target="_blank" rel="noopener noreferrer" className="font-medium text-sm hover:underline hover:text-primary transition-colors">
                          {f.name}
                        </a>
                      ) : (
                        <p className="font-medium text-sm">{f.name}</p>
                      )}
                      <p className="text-xs text-muted-foreground">{f.size} · Subido por {f.uploadedBy}</p>
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground">{f.uploadedAt}</span>
                </div>
              ))}
              <div>
                <Label htmlFor="file-upload" className={`cursor-pointer ${uploadLoading ? 'opacity-50 pointer-events-none' : ''}`}>
                  <div className="border-2 border-dashed rounded-lg p-6 text-center hover:border-primary/50 transition-colors">
                    {uploadLoading ? (
                      <Upload className="w-6 h-6 mx-auto text-primary animate-bounce mb-2" />
                    ) : (
                      <Upload className="w-6 h-6 mx-auto text-muted-foreground mb-2" />
                    )}
                    <p className="text-sm text-muted-foreground">{uploadLoading ? 'Subiendo archivo...' : 'Haga clic para subir un archivo'}</p>
                    <p className="text-xs text-muted-foreground">PDF, DOC, TXT</p>
                  </div>
                </Label>
                <Input id="file-upload" type="file" className="hidden" accept=".pdf,.doc,.docx,.txt" onChange={handleImmediateUpload} />
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
