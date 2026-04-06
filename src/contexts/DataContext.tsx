import { createContext, useContext, useState, ReactNode } from 'react';
import { Meeting, Participant, mockMeetings, mockParticipants } from '@/lib/mock-data';

interface DataContextType {
  meetings: Meeting[];
  participants: Participant[];
  addMeeting: (meeting: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status'>) => void;
  getMeetingsByCategory: (categoryId: string) => Meeting[];
  getMeeting: (id: string) => Meeting | undefined;
  addContribution: (meetingId: string, participantName: string, content: string) => void;
  addParticipantToMeeting: (meetingId: string, participant: Participant) => void;
  addFileToMeeting: (meetingId: string, file: { name: string; type: string; size: string }) => void;
  generateSummary: (meetingId: string) => void;
  generateKeyPoints: (meetingId: string) => void;
}

const DataContext = createContext<DataContextType | null>(null);

export const useData = () => {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error('useData must be used within DataProvider');
  return ctx;
};

export const DataProvider = ({ children }: { children: ReactNode }) => {
  const [meetings, setMeetings] = useState<Meeting[]>(mockMeetings);
  const [participants] = useState<Participant[]>(mockParticipants);

  const addMeeting = (data: Omit<Meeting, 'id' | 'participants' | 'contributions' | 'files' | 'status'>) => {
    const newMeeting: Meeting = {
      ...data,
      id: Date.now().toString(),
      participants: [],
      contributions: [],
      files: [],
      status: 'upcoming',
    };
    setMeetings(prev => [...prev, newMeeting]);
  };

  const getMeetingsByCategory = (categoryId: string) =>
    meetings.filter(m => m.category === categoryId);

  const getMeeting = (id: string) => meetings.find(m => m.id === id);

  const addContribution = (meetingId: string, participantName: string, content: string) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              contributions: [
                ...m.contributions,
                {
                  id: Date.now().toString(),
                  participantId: Date.now().toString(),
                  participantName,
                  content,
                  timestamp: new Date().toISOString(),
                },
              ],
            }
          : m
      )
    );
  };

  const addParticipantToMeeting = (meetingId: string, participant: Participant) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId && !m.participants.find(p => p.id === participant.id)
          ? { ...m, participants: [...m.participants, participant] }
          : m
      )
    );
  };

  const addFileToMeeting = (meetingId: string, file: { name: string; type: string; size: string }) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              files: [
                ...m.files,
                {
                  id: Date.now().toString(),
                  ...file,
                  uploadedAt: new Date().toISOString().split('T')[0],
                  uploadedBy: 'Admin CES',
                },
              ],
            }
          : m
      )
    );
  };

  const generateSummary = (meetingId: string) => {
    const meeting = meetings.find(m => m.id === meetingId);
    if (!meeting) return;

    const contribText = meeting.contributions.length > 0
      ? meeting.contributions.map(c => `• ${c.participantName}: "${c.content}"`).join('\n')
      : 'No se registraron aportes escritos.';
    const filesText = meeting.files.length > 0
      ? meeting.files.map(f => `📄 ${f.name} (${f.size}, subido por ${f.uploadedBy})`).join('\n')
      : 'No se adjuntaron documentos.';

    const summary = `Resumen integral generado por IA:\n\n` +
      `📋 Reunión: "${meeting.title}" — ${meeting.date}\n` +
      `👥 Participantes: ${meeting.participants.map(p => p.name).join(', ') || 'Sin participantes registrados'}\n\n` +
      `📝 Aportes recibidos:\n${contribText}\n\n` +
      `📎 Documentación adjunta:\n${filesText}\n\n` +
      `📌 Conclusión: Se abordaron los temas de agenda con participación activa. Los aportes reflejan consensos parciales y se identificaron áreas que requieren seguimiento en próximas sesiones.`;

    setMeetings(prev =>
      prev.map(m => m.id === meetingId ? { ...m, summary } : m)
    );
  };

  const generateKeyPoints = (meetingId: string) => {
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              keyPoints: [
                'Consenso sobre la necesidad de actualización normativa',
                'Propuesta de comisión técnica para análisis detallado',
                'Plazo de 30 días para presentación de informes',
                'Próxima reunión programada para revisión de avances',
              ],
            }
          : m
      )
    );
  };

  return (
    <DataContext.Provider
      value={{
        meetings, participants, addMeeting, getMeetingsByCategory,
        getMeeting, addContribution, addParticipantToMeeting,
        addFileToMeeting, generateSummary, generateKeyPoints,
      }}
    >
      {children}
    </DataContext.Provider>
  );
};
