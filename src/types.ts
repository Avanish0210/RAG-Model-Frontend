export interface User {
  id: string;
  username: string;
  name: string;
  token?: string;
}

export interface DocumentVersion {
  version: number;
  filename: string;
  uploadDate: string;
  size: string;
  active: boolean;
}

export interface Document {
  id: string;
  filename: string;
  size: string;
  status: 'Active' | 'Archived';
  uploadDate: string;
  version: number;
  versions: DocumentVersion[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  documentId?: string;
  documentName?: string;
}

export interface ApiLog {
  id: string;
  timestamp: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  url: string;
  payload?: string;
  response?: string;
  status: number;
}

export interface DashboardStats {
  totalDocuments: number;
  totalQueries: number;
  activeDocuments: number;
}
