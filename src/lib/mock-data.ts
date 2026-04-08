export interface Meeting {
  id: string;
  title: string;
  date: string;
  category: string;
  description: string;
  participants: Participant[];
  contributions: Contribution[];
  files: UploadedFile[];
  debateMessages: DebateMessage[];
  summary?: string;
  keyPoints?: string[];
  status: 'upcoming' | 'completed';
}

export interface DebateMessage {
  id: string;
  authorName: string;
  content: string;
  createdAt: string;
}

export interface Participant {
  id: string;
  name: string;
  role: string;
  organization: string;
}

export interface Contribution {
  id: string;
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
  filePath?: string;
  url?: string;
}

export interface Category {
  id: string;
  title: string;
  description: string;
  icon: string;
  color: string;
}

// Static categories (fixed list - managed in DB)
export const categories: Category[] = [
  {
    id: 'planeamiento',
    title: 'Código de Planeamiento Urbano',
    description: 'Normativas y regulaciones para el desarrollo urbano sostenible',
    icon: 'Building2',
    color: 'primary',
  },
  {
    id: 'movilidad',
    title: 'Movilidad',
    description: 'Transporte público, infraestructura vial y movilidad sustentable',
    icon: 'Bus',
    color: 'info',
  },
  {
    id: 'ia',
    title: 'Buenas Prácticas en I.A.',
    description: 'Regulación y ética en el uso de inteligencia artificial',
    icon: 'Brain',
    color: 'warning',
  },
];
