import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { isBefore, startOfDay } from 'date-fns';
import { Meeting, Participant, Contribution, UploadedFile, DebateMessage, Category } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface DataContextType {
  meetings: Meeting[];
  participants: Participant[];
  categories: Category[];
  isLoading: boolean;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status' | 'debateMessages'>) => Promise<void>;
  addCategory: (title: string, description: string, icon: string, color: string) => Promise<void>;
  updateCategory: (id: string, data: Partial<Category>) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  getMeetingsByCategory: (categoryId: string) => Meeting[];
  getMeeting: (id: string) => Meeting | undefined;
  addParticipant: (participant: { name: string; role: string; organization: string }) => Promise<void>;
  addContribution: (meetingId: string, participantName: string, content: string, file?: File) => Promise<void>;
  addDebateMessage: (meetingId: string, authorName: string, content: string) => Promise<void>;
  addParticipantToMeeting: (meetingId: string, participant: Participant) => Promise<void>;
  addFileToMeeting: (meetingId: string, file: File, uploaderName: string) => Promise<void>;
  generateSummary: (meetingId: string) => Promise<void>;
  generateKeyPoints: (meetingId: string) => Promise<void>;
  updateMeetingOutcome: (meetingId: string, notes: string, progress: string) => Promise<void>;
  completeMeeting: (meetingId: string) => Promise<void>;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

// ─── Helpers to map Supabase rows to app interfaces ───────────────────────────

const mapMeeting = (row: any, participants: Participant[], contributions: Contribution[], files: UploadedFile[], debateMessages: DebateMessage[]): Meeting => {
  const meetingDate = new Date(row.date);
  const today = startOfDay(new Date());
  
  const status = row.status;

  return {
    id: row.id,
    title: row.title,
    date: row.date,
    category: row.category,
    description: row.description || '',
    summary: row.summary || undefined,
    keyPoints: row.key_points || undefined,
    outcomeNotes: row.outcome_notes || undefined,
    progressLevel: row.progress_level || undefined,
    status,
    participants,
    contributions,
    files,
    debateMessages,
  };
};

const mapParticipant = (row: any): Participant => ({
  id: row.id,
  name: row.name,
  role: row.role,
  organization: row.organization,
});

const mapContribution = (row: any): Contribution => {
  const filePath = row.file_path;
  const url = filePath ? supabase.storage.from('meeting_files').getPublicUrl(filePath).data.publicUrl : undefined;

  return {
    id: row.id,
    participantName: row.participant_name,
    content: row.content,
    timestamp: row.created_at,
    filePath,
    fileName: row.file_name,
    fileType: row.file_type,
    fileSize: row.file_size,
    url,
  };
};

const mapFile = (row: any): UploadedFile => {
  const filePath = row.file_path;
  const url = filePath ? supabase.storage.from('meeting_files').getPublicUrl(filePath).data.publicUrl : undefined;

  return {
    id: row.id,
    name: row.name,
    type: row.type,
    size: row.size,
    uploadedBy: row.uploaded_by,
    uploadedAt: row.uploaded_at,
    filePath,
    url,
  };
};

const mapDebateMessage = (row: any): DebateMessage => ({
  id: row.id,
  authorName: row.author_name,
  content: row.content,
  createdAt: row.created_at,
});
const mapCategory = (row: any): Category => ({
  id: row.id,
  title: row.title,
  description: row.description,
  icon: row.icon,
  color: row.color,
});

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const { session, user } = useAuth();

  const loadAll = async (currentUser?: any) => {
    setIsLoading(true);
    try {
      // Load participants
      const { data: participantsData } = await supabase.from('participants').select('*').order('name');
      const allParticipants: Participant[] = (participantsData || []).map(mapParticipant);
      setParticipants(allParticipants);

      // Load categories
      const { data: categoriesData } = await supabase.from('categories').select('*').order('title');
      setCategories((categoriesData || []).map(mapCategory));

      // Load meetings with related data
      const { data: meetingsData } = await supabase
        .from('meetings')
        .select(`
          *,
          meeting_participants(participant_id),
          contributions(*),
          meeting_files(*),
          debate_messages(*)
        `)
        .order('date', { ascending: false });

      const mapped: Meeting[] = (meetingsData || []).map(row => {
        const meetingParticipants = (row.meeting_participants || [])
          .map((mp: any) => allParticipants.find(p => p.id === mp.participant_id))
          .filter(Boolean) as Participant[];

        const contributions: Contribution[] = (row.contributions || [])
          .map(mapContribution)
          .sort((a: Contribution, b: Contribution) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

        const files: UploadedFile[] = (row.meeting_files || []).map(mapFile);
        
        const debateMessages: DebateMessage[] = (row.debate_messages || [])
          .map(mapDebateMessage)
          .sort((a: DebateMessage, b: DebateMessage) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

        return mapMeeting(row, meetingParticipants, contributions, files, debateMessages);
      });

      let finalMeetings = mapped;
      if (currentUser?.role === 'comun') {
        finalMeetings = mapped.filter(m => 
          m.participants.some(p => p.name.toLowerCase() === currentUser.name.toLowerCase())
        );
      }

      setMeetings(finalMeetings);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!session) {
      setMeetings([]);
      setParticipants([]);
      setIsLoading(false);
      return;
    }
    loadAll(user);
  }, [session, user]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addMeeting = async (data: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status' | 'debateMessages'>) => {
    const meetingDate = new Date(data.date);
    const status = 'upcoming';

    const { data: row, error } = await supabase
      .from('meetings')
      .insert({ title: data.title, date: data.date, category: data.category, description: data.description, status })
      .select()
      .single();
    if (error) throw error;
    const newMeeting = mapMeeting(row, [], [], [], []);
    setMeetings(prev => [newMeeting, ...prev]);
  };

  const addCategory = async (title: string, description: string, icon: string, color: string) => {
    // Generate slug-style ID from title
    const id = title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    
    const { data: row, error } = await supabase
      .from('categories')
      .insert({ id, title, description, icon, color })
      .select()
      .single();
    
    if (error) throw error;
    setCategories(prev => [...prev, mapCategory(row)].sort((a, b) => a.title.localeCompare(b.title)));
  };

  const updateCategory = async (id: string, data: Partial<Category>) => {
    const { data: row, error } = await supabase
      .from('categories')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? mapCategory(row) : c).sort((a, b) => a.title.localeCompare(b.title)));
  };

  const deleteCategory = async (id: string) => {
    // Check if there are meetings in this category
    const { count, error: countError } = await supabase
      .from('meetings')
      .select('*', { count: 'exact', head: true })
      .eq('category', id);
    
    if (countError) throw countError;
    if (count && count > 0) throw new Error('No se puede eliminar una comisión que tiene reuniones asociadas.');

    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
    setCategories(prev => prev.map(c => c.id === id ? null : c).filter(Boolean) as Category[]);
  };

  const addParticipant = async (data: { name: string; role: string; organization: string }) => {
    const { data: row, error } = await supabase
      .from('participants')
      .insert({ name: data.name, role: data.role, organization: data.organization })
      .select()
      .single();
    if (error) throw error;
    const newParticipant = mapParticipant(row);
    // Sort participants alphabetically after adding
    setParticipants(prev => [...prev, newParticipant].sort((a, b) => a.name.localeCompare(b.name)));
  };

  const addContribution = async (meetingId: string, participantName: string, content: string, file?: File) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting?.status === 'completed') throw new Error('No se pueden agregar aportes a una reunión finalizada');

    let fileInfo: any = {};
    
    if (file) {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `${meetingId}/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('meeting_files').upload(filePath, file);
      if (uploadError) throw uploadError;

      fileInfo = {
        file_path: filePath,
        file_name: file.name,
        file_type: file.type,
        file_size: `${(file.size / 1024 / 1024).toFixed(1)} MB`
      };
    }

    const { data: row, error } = await supabase
      .from('contributions')
      .insert({ 
        meeting_id: meetingId, 
        participant_name: participantName, 
        content,
        ...fileInfo
      })
      .select()
      .single();
    if (error) throw error;
    const newContrib = mapContribution(row);
    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, contributions: [...m.contributions, newContrib] } : m)
    );
  };

  const addDebateMessage = async (meetingId: string, authorName: string, content: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting?.status === 'completed') throw new Error('El debate está cerrado para esta reunión');

    const { data: row, error } = await supabase
      .from('debate_messages')
      .insert({ meeting_id: meetingId, author_name: authorName, content })
      .select()
      .single();
    if (error) throw error;
    const newMessage = mapDebateMessage(row);
    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, debateMessages: [...m.debateMessages, newMessage] } : m)
    );
  };

  const addParticipantToMeeting = async (meetingId: string, participant: Participant) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting?.status === 'completed') return;

    const { error } = await supabase
      .from('meeting_participants')
      .insert({ meeting_id: meetingId, participant_id: participant.id });
    if (error) return; // ignore duplicate
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId && !m.participants.find(p => p.id === participant.id)
          ? { ...m, participants: [...m.participants, participant] }
          : m
      )
    );
  };

  const addFileToMeeting = async (meetingId: string, file: File, uploaderName: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (meeting?.status === 'completed') throw new Error('No se pueden subir archivos a una reunión finalizada');

    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
    const filePath = `${meetingId}/${fileName}`;

    const { error: uploadError } = await supabase.storage.from('meeting_files').upload(filePath, file);
    if (uploadError) throw uploadError;

    const sizeStr = `${(file.size / 1024 / 1024).toFixed(1)} MB`;
    const { data: row, error } = await supabase
      .from('meeting_files')
      .insert({ 
        meeting_id: meetingId, 
        name: file.name, 
        type: file.type, 
        size: sizeStr, 
        uploaded_by: uploaderName,
        file_path: filePath
      })
      .select()
      .single();
      
    if (error) throw error;
    
    const newFile = mapFile(row);
    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, files: [...m.files, newFile] } : m)
    );
  };

  const callOpenRouter = async (prompt: string) => {
    const apiKey = import.meta.env.VITE_OPENROUTER_API_KEY;
    const model = import.meta.env.VITE_OPENROUTER_MODEL || "openai/gpt-4o-mini";
    
    if (!apiKey) {
      throw new Error("No hay VITE_OPENROUTER_API_KEY configurada.");
    }

    const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json",
        "HTTP-Referer": window.location.href,
        "X-Title": "CES Connect"
      },
      body: JSON.stringify({
        model: model,
        messages: [
          { role: "system", content: "Eres un asistente experto para comisiones y reuniones. Resumes debates y aportes con lenguaje claro, profesional y estructurado." },
          { role: "user", content: prompt }
        ]
      })
    });

    const data = await response.json();
    if (data.error) {
      throw new Error(data.error.message);
    }
    return data.choices[0].message.content;
  };

  const generateSummary = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const contribText = meeting.contributions.length > 0
      ? meeting.contributions.map(c => `- ${c.participantName}: "${c.content}"`).join('\n')
      : 'No se registraron aportes escritos.';
      
    const debateText = meeting.debateMessages.length > 0
      ? meeting.debateMessages.map(d => `- ${d.authorName}: "${d.content}"`).join('\n')
      : 'No hubo debate en el chat.';

    const prompt = `Por favor, genera un resumen profesional y estructurado (en texto claro, no más de 2-3 párrafos) de la siguiente reunión llamada "${meeting.title}" (Fecha: ${meeting.date}).

Participantes: ${meeting.participants.map(p => p.name).join(', ') || 'Sin asistentes confirmados'}.

Aportes formales enviados:
${contribText}

Debate informal / Chat:
${debateText}

El resumen debe integrar de forma coherente los puntos discutidos y los aportes, indicando brevemente las contribuciones principales de forma profesional.`;

    const summary = await callOpenRouter(prompt);

    await supabase.from('meetings').update({ summary }).eq('id', meetingId);
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, summary } : m));
  };

  const generateKeyPoints = async (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    
    const contribText = meeting.contributions.length > 0
      ? meeting.contributions.map(c => `- ${c.participantName}: "${c.content}"`).join('\n')
      : 'No se registraron aportes escritos.';
      
    const debateText = meeting.debateMessages.length > 0
      ? meeting.debateMessages.map(d => `- ${d.authorName}: "${d.content}"`).join('\n')
      : 'No hubo debate en el chat.';

    const prompt = `A partir de la siguiente reunión llamada "${meeting.title}", extrae entre 3 a 5 puntos clave.

Aportes:
${contribText}

Debate:
${debateText}

Proporciona ÚNICAMENTE los puntos, uno por línea, iniciados por un número y un punto (ej: "1. Primer punto."). No incluyas introducción ni despedida.`;

    const rawResponse = await callOpenRouter(prompt);
    
    const keyPoints = rawResponse
      .split('\n')
      .map((line: string) => line.replace(/^[\d\.\-\*]+\s*/, '').trim())
      .filter((line: string) => line.length > 0)
      .slice(0, 7);

    await supabase.from('meetings').update({ key_points: keyPoints }).eq('id', meetingId);
    setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, keyPoints } : m));
  };

  const updateMeetingOutcome = async (meetingId: string, notes: string, progress: string) => {
    const { error } = await supabase
      .from('meetings')
      .update({ 
        outcome_notes: notes, 
        progress_level: progress
      })
      .eq('id', meetingId);
    
    if (error) throw error;
    
    setMeetings(prev => prev.map(m => 
      m.id === meetingId ? { ...m, outcomeNotes: notes, progressLevel: progress } : m
    ));
  };

  const completeMeeting = async (meetingId: string) => {
    const { error } = await supabase
      .from('meetings')
      .update({ status: 'completed' })
      .eq('id', meetingId);
    
    if (error) throw error;
    
    setMeetings(prev => prev.map(m => 
      m.id === meetingId ? { ...m, status: 'completed' } : m
    ));
  };

  const getMeetingsByCategory = (categoryId: string) => meetings.filter(m => m.category === categoryId);
  const getMeeting = (id: string) => meetings.find(m => m.id === id);

  return (
    <DataContext.Provider value={{
      meetings, participants, categories, isLoading,
      addMeeting, addCategory, updateCategory, deleteCategory,
      getMeetingsByCategory, getMeeting, addParticipant,
      addContribution, addDebateMessage, addParticipantToMeeting, addFileToMeeting,
      generateSummary, generateKeyPoints, updateMeetingOutcome, completeMeeting,
    }}>
      {children}
    </DataContext.Provider>
  );
};
