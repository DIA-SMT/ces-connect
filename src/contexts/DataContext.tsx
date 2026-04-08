import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Meeting, Participant, Contribution, UploadedFile } from '@/lib/mock-data';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/contexts/AuthContext';

interface DataContextType {
  meetings: Meeting[];
  participants: Participant[];
  isLoading: boolean;
  addMeeting: (meeting: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status'>) => Promise<void>;
  getMeetingsByCategory: (categoryId: string) => Meeting[];
  getMeeting: (id: string) => Meeting | undefined;
  addParticipant: (participant: { name: string; role: string; organization: string }) => Promise<void>;
  addContribution: (meetingId: string, participantName: string, content: string) => Promise<void>;
  addParticipantToMeeting: (meetingId: string, participant: Participant) => Promise<void>;
  addFileToMeeting: (meetingId: string, file: { name: string; type: string; size: string }) => Promise<void>;
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

const mapMeeting = (row: any, participants: Participant[], contributions: Contribution[], files: UploadedFile[]): Meeting => ({
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
});

const mapParticipant = (row: any): Participant => ({
  id: row.id,
  name: row.name,
  role: row.role,
  organization: row.organization,
});

const mapContribution = (row: any): Contribution => ({
  id: row.id,
  participantName: row.participant_name,
  content: row.content,
  timestamp: row.created_at,
});

const mapFile = (row: any): UploadedFile => ({
  id: row.id,
  name: row.name,
  type: row.type,
  size: row.size,
  uploadedBy: row.uploaded_by,
  uploadedAt: row.uploaded_at,
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
          meeting_files(*)
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

        return mapMeeting(row, meetingParticipants, contributions, files);
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

  const addMeeting = async (data: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status'>) => {
    const { data: row, error } = await supabase
      .from('meetings')
      .insert({ title: data.title, date: data.date, category: data.category, description: data.description, status: 'upcoming' })
      .select()
      .single();
    if (error) throw error;
    const newMeeting = mapMeeting(row, [], [], []);
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

  const addContribution = async (meetingId: string, participantName: string, content: string) => {
    const { data: row, error } = await supabase
      .from('contributions')
      .insert({ meeting_id: meetingId, participant_name: participantName, content })
      .select()
      .single();
    if (error) throw error;
    const newContrib = mapContribution(row);
    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, contributions: [...m.contributions, newContrib] } : m)
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

  const addFileToMeeting = async (meetingId: string, file: { name: string; type: string; size: string }) => {
    const { data: row, error } = await supabase
      .from('meeting_files')
      .insert({ meeting_id: meetingId, name: file.name, type: file.type, size: file.size, uploaded_by: 'Admin CES' })
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
      addContribution, addParticipantToMeeting, addFileToMeeting,
      generateSummary, generateKeyPoints,
    }}>
      {children}
    </DataContext.Provider>
  );
};
