export type SourceType = 'url' | 'database' | 'supabase' | 'documents';
export type DatabaseType = 'postgresql' | 'mysql' | 'mongodb';
export type AssistantStatus = 'creating' | 'processing' | 'ready' | 'error';
export type WizardStep = 1 | 2 | 3;

export interface DatabaseCredentials {
  host: string;
  database: string;
  user: string;
  password: string;
  port?: string;
}

export interface SupabaseCredentials {
  supabaseUrl: string;
  supabaseKey: string;
  tableName?: string;
  columns?: string;
}

export interface Assistant {
  id: string;
  name: string;
  sourceType: SourceType;
  url?: string;
  databaseType?: DatabaseType;
  fileNames?: string[];
  status: AssistantStatus;
  createdAt: string;
  messageCount?: number;
}

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  sources?: string[];
}

export interface CreateRagPayload {
  name: string;
  sourceType: SourceType;
  url?: string;
  databaseType?: DatabaseType;
  credentials?: DatabaseCredentials;
  supabaseUrl?: string;
  supabaseKey?: string;
  tableName?: string;
  columns?: string;
}

export interface CreateRagResponse {
  success: boolean;
  ragId: string;
  name: string;
  sourceType: SourceType;
  status: AssistantStatus;
  message?: string;
  createdAt: string;
}

export interface ChatPayload {
  ragId: string;
  question: string;
  conversationHistory?: Array<{ role: string; content: string }>;
}

export interface ChatResponse {
  answer: string;
  sources?: string[];
  confidence?: number;
  ragId: string;
}
