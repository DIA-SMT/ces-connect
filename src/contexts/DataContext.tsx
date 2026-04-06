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
    setMeetings(prev =>
      prev.map(m =>
        m.id === meetingId
          ? {
              ...m,
              summary:
                'Resumen generado por IA: Durante la reunión se abordaron los temas principales de la agenda. Los participantes expresaron diversas perspectivas y se alcanzaron consensos parciales en los puntos clave. Se definieron acciones de seguimiento para la próxima sesión.',
            }
          : m
      )
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
