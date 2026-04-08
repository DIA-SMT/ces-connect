import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Meeting, Participant, Contribution, UploadedFile, DebateMessage } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface DataContextType {
  meetings: Meeting[];
  participants: Participant[];
  isLoading: boolean;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status' | 'debateMessages'>) => Promise<void>;
  getMeetingsByCategory: (categoryId: string) => Meeting[];
  getMeeting: (id: string) => Meeting | undefined;
  addParticipant: (participant: { name: string; role: string; organization: string }) => Promise<void>;
  addContribution: (meetingId: string, participantName: string, content: string, file?: File) => Promise<void>;
  addDebateMessage: (meetingId: string, authorName: string, content: string) => Promise<void>;
  addParticipantToMeeting: (meetingId: string, participant: Participant) => Promise<void>;
  addFileToMeeting: (meetingId: string, file: File, uploaderName: string) => Promise<void>;
  generateSummary: (meetingId: string) => void;
  generateKeyPoints: (meetingId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

// ─── Helpers to map Supabase rows to app interfaces ───────────────────────────

const mapMeeting = (row: any, participants: Participant[], contributions: Contribution[], files: UploadedFile[], debateMessages: DebateMessage[]): Meeting => ({
  id: row.id,
  title: row.title,
  date: row.date,
  category: row.category,
  description: row.description || '',
  summary: row.summary || undefined,
  keyPoints: row.key_points || undefined,
  status: row.status,
  participants,
  contributions,
  files,
  debateMessages,
});

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

// ─── Provider ─────────────────────────────────────────────────────────────────

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const loadAll = async () => {
    setIsLoading(true);
    try {
      // Load participants
      const { data: participantsData } = await supabase.from('participants').select('*').order('name');
      const allParticipants: Participant[] = (participantsData || []).map(mapParticipant);
      setParticipants(allParticipants);

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
      if (user?.role === 'comun') {
        finalMeetings = mapped.filter(m => 
          m.participants.some(p => p.name.toLowerCase() === user.name.toLowerCase())
        );
      }

      setMeetings(finalMeetings);
    } finally {
      setIsLoading(false);
    }
  };

  const { session, user } = useAuth();

  useEffect(() => {
    if (!session) {
      setMeetings([]);
      setParticipants([]);
      setIsLoading(false);
      return;
    }
    loadAll();
  }, [session, user]);

  // ─── Mutations ───────────────────────────────────────────────────────────────

  const addMeeting = async (data: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status' | 'debateMessages'>) => {
    const { data: row, error } = await supabase
      .from('meetings')
      .insert({ title: data.title, date: data.date, category: data.category, description: data.description, status: 'upcoming' })
      .select()
      .single();
    if (error) throw error;
    const newMeeting = mapMeeting(row, [], [], [], []);
    setMeetings(prev => [newMeeting, ...prev]);
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

  const generateSummary = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;
    const contribText = meeting.contributions.length > 0
      ? meeting.contributions.map(c => `• ${c.participantName}: "${c.content}"`).join('\n')
      : 'No se registraron aportes escritos.';
    const filesText = meeting.files.length > 0
      ? meeting.files.map(f => `📄 ${f.name} (${f.size})`).join('\n')
      : 'No se adjuntaron documentos.';
    const summary =
      `Resumen integral generado:\n\n` +
      `📋 Reunión: "${meeting.title}" — ${meeting.date}\n` +
      `👥 Participantes: ${meeting.participants.map(p => p.name).join(', ') || 'Sin participantes registrados'}\n\n` +
      `📝 Aportes:\n${contribText}\n\n📎 Documentación:\n${filesText}\n\n` +
      `📌 Conclusión: Se abordaron los temas de agenda con participación activa.`;

    supabase.from('meetings').update({ summary }).eq('id', meetingId).then(() => {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, summary } : m));
    });
  };

  const generateKeyPoints = (meetingId: string) => {
    const keyPoints = [
      'Consenso sobre la necesidad de actualización normativa',
      'Propuesta de comisión técnica para análisis detallado',
      'Plazo de 30 días para presentación de informes',
      'Próxima reunión programada para revisión de avances',
    ];
    supabase.from('meetings').update({ key_points: keyPoints }).eq('id', meetingId).then(() => {
      setMeetings(prev => prev.map(m => m.id === meetingId ? { ...m, keyPoints } : m));
    });
  };

  const getMeetingsByCategory = (categoryId: string) => meetings.filter(m => m.category === categoryId);
  const getMeeting = (id: string) => meetings.find(m => m.id === id);

  return (
    <DataContext.Provider value={{
      meetings, participants, isLoading,
      addMeeting, getMeetingsByCategory, getMeeting, addParticipant,
      addContribution, addDebateMessage, addParticipantToMeeting, addFileToMeeting,
      generateSummary, generateKeyPoints,
    }}>
      {children}
    </DataContext.Provider>
  );
};
