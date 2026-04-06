export interface Meeting {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  participants: Participant[];
  contributions: Contribution[];
  files: UploadedFile[];
  summary?: string;
  keyPoints?: string[];
  status: 'upcoming' | 'completed';
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  organization: string;
}

export interface Contribution {
  id: string;
  participantId: string;
  participantName: string;
  content: string;
  timestamp: string;
}

export interface UploadedFile {
  id: string;
  name: string;
  type: string;
  size: string;
  uploadedAt: string;
  uploadedBy: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  meetingCount: number;
  color: string;
}

export const categories: Category[] = [
  {
    id: 'planeamiento',
    title: 'Código de Planeamiento Urbano',
    description: 'Normativas y regulaciones para el desarrollo urbano sostenible',
    icon: 'Building2',
    meetingCount: 5,
    color: 'primary',
  },
  {
    id: 'movilidad',
    title: 'Movilidad',
    description: 'Transporte público, infraestructura vial y movilidad sustentable',
    icon: 'Bus',
    meetingCount: 3,
    color: 'info',
  },
  {
    id: 'ia',
    title: 'Buenas Prácticas en I.A.',
    description: 'Regulación y ética en el uso de inteligencia artificial',
    icon: 'Brain',
    meetingCount: 4,
    color: 'warning',
  },
];

export const mockParticipants: Participant[] = [
  { id: '1', name: 'María González', role: 'Coordinadora', organization: 'CES' },
  { id: '2', name: 'Carlos López', role: 'Asesor Técnico', organization: 'Ministerio de Planificación' },
  { id: '3', name: 'Ana Martínez', role: 'Representante', organization: 'Cámara de Comercio' },
  { id: '4', name: 'Roberto Sánchez', role: 'Especialista', organization: 'Universidad Nacional' },
  { id: '5', name: 'Laura Fernández', role: 'Delegada', organization: 'Sindicato de Trabajadores' },
];

export const mockMeetings: Meeting[] = [
  {
    id: '1',
    title: 'Revisión del Código de Planeamiento - Zona Norte',
    date: '2025-04-10',
    category: 'planeamiento',
    description: 'Análisis de las modificaciones propuestas para la zona norte de la ciudad, incluyendo altura máxima de edificaciones y uso del suelo.',
    participants: [mockParticipants[0], mockParticipants[1], mockParticipants[3]],
    contributions: [
      { id: 'c1', participantId: '1', participantName: 'María González', content: 'Propongo limitar la altura a 12 pisos en la franja costera para preservar la visual urbana.', timestamp: '2025-04-10T10:30:00' },
      { id: 'c2', participantId: '2', participantName: 'Carlos López', content: 'Es necesario considerar el impacto en la densidad poblacional y los servicios disponibles.', timestamp: '2025-04-10T10:45:00' },
    ],
    files: [
      { id: 'f1', name: 'Propuesta_Zona_Norte.pdf', type: 'application/pdf', size: '2.4 MB', uploadedAt: '2025-04-09', uploadedBy: 'María González' },
    ],
    summary: 'Se discutieron las modificaciones al código de planeamiento para la zona norte. Se propuso un límite de altura de 12 pisos en la franja costera.',
    keyPoints: ['Límite de altura de 12 pisos en franja costera', 'Análisis de densidad poblacional necesario', 'Revisión de servicios públicos requerida'],
    status: 'completed',
  },
  {
    id: '2',
    title: 'Plan de Movilidad Sustentable 2025',
    date: '2025-04-15',
    category: 'movilidad',
    description: 'Presentación y debate del plan integral de movilidad sustentable para el período 2025-2030.',
    participants: [mockParticipants[0], mockParticipants[2], mockParticipants[4]],
    contributions: [
      { id: 'c3', participantId: '3', participantName: 'Ana Martínez', content: 'El sector comercial necesita rutas de transporte eficientes hacia los centros logísticos.', timestamp: '2025-04-15T14:00:00' },
    ],
    files: [],
    status: 'upcoming',
  },
  {
    id: '3',
    title: 'Marco Regulatorio para IA en el Sector Público',
    date: '2025-04-08',
    category: 'ia',
    description: 'Definición de lineamientos éticos y regulatorios para la implementación de IA en organismos gubernamentales.',
    participants: [mockParticipants[0], mockParticipants[3]],
    contributions: [
      { id: 'c4', participantId: '4', participantName: 'Roberto Sánchez', content: 'Es fundamental establecer principios de transparencia algorítmica desde el inicio.', timestamp: '2025-04-08T09:15:00' },
    ],
    files: [
      { id: 'f2', name: 'Marco_Etico_IA.pdf', type: 'application/pdf', size: '1.8 MB', uploadedAt: '2025-04-07', uploadedBy: 'Roberto Sánchez' },
      { id: 'f3', name: 'Casos_de_Estudio.pdf', type: 'application/pdf', size: '3.1 MB', uploadedAt: '2025-04-07', uploadedBy: 'María González' },
    ],
    summary: 'Se establecieron los principios base para un marco regulatorio de IA en el sector público, priorizando transparencia y rendición de cuentas.',
    keyPoints: ['Transparencia algorítmica obligatoria', 'Auditorías periódicas de sistemas IA', 'Comité de ética permanente'],
    status: 'completed',
  },
  {
    id: '4',
    title: 'Zonificación Comercial - Centro Histórico',
    date: '2025-03-28',
    category: 'planeamiento',
    description: 'Revisión de la zonificación comercial del centro histórico y propuestas de preservación patrimonial.',
    participants: [mockParticipants[0], mockParticipants[1], mockParticipants[2]],
    contributions: [],
    files: [],
    summary: 'Se acordó mantener la restricción de uso comercial en edificios patrimoniales y crear incentivos fiscales para la restauración.',
    keyPoints: ['Restricción comercial en edificios patrimoniales', 'Incentivos fiscales para restauración', 'Catálogo de edificios protegidos actualizado'],
    status: 'completed',
  },
];
