export interface EvidenceSource {
  id: string;
  sourceNumber: number;
  title: string;
  location: string;
  excerpt: string;
  highlightedPhrase: string;
  similarity: number;
  fullContent?: string;
  metadata?: {
    fileType: string;
    fileSize: string;
    lastUpdated: string;
    author: string;
    sha256: string;
    chunkId: string;
    vectors: number;
  };
}

export interface UploadedDoc {
  name: string;
  type: string;
  size: string;
  pages?: number;
  status: 'ready' | 'uploading' | 'indexed';
  progress?: number;
  sha256?: string;
}

export interface ThoughtProcess {
  durationSeconds: number;
  summary: string;
  steps: string[];
}

export interface ThreadMessage {
  id: string;
  type: 'user' | 'assistant';
  author: string;
  roleTitle?: string;
  timestamp: string;
  verified?: boolean;
  content: string;
  tags?: string[];
  uploadedDocs?: UploadedDoc[];
  thoughtProcess?: ThoughtProcess;
  citations?: { [key: number]: string };
  codeSnippet?: {
    fileName: string;
    schemaVersion: string;
    language: string;
    code: string;
  };
  metrics?: {
    validationTitle: string;
    validationSubtitle: string;
    cosineMatch: number;
    latencyMs: number;
  };
  suggestedFollowUps?: string[];
}
