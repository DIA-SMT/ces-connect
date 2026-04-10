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
  outcomeNotes?: string;
  progressLevel?: string;
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
  filePath?: string;
  fileName?: string;
  fileType?: string;
  fileSize?: string;
  url?: string;
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

// Dynamic categories are managed in the database via DataContext.
