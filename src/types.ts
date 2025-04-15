export interface OCRResult {
  text: string;
  confidence: number;
  fonts?: FontResult[];
  equations?: EquationResult[];
  language?: string;
  latex?: string;
}

export interface FontResult {
  name: string;
  confidence: number;
  provider: string;
}

export interface EquationResult {
  original: string;
  latex: string;
  confidence: number;
}

export interface Document {
  id: string;
  title: string;
  content: string;
  metadata: DocumentMetadata;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DocumentMetadata {
  source?: string;
  language?: string;
  confidence?: number;
  tags?: string[];
  latex?: string;
}

export interface DocumentVersion {
  id: string;
  document_id: string;
  content: string;
  metadata: DocumentMetadata;
  created_at: string;
  user_id: string;
}

export interface DocumentListParams {
  page: number;
  perPage: number;
  search?: string;
  sortBy?: 'title' | 'created_at' | 'updated_at';
  sortOrder?: 'asc' | 'desc';
}