export interface AnalyticalTrace {
  id: string;
  traceNumber: string;
  matchScore: number;
  timestamp: string;
  query: string;
  summary: string;
  highlightPhrase?: string;
  highlightValue?: string;
  summarySuffix?: string;
  sources: Array<{
    title: string;
    detail: string;
  }>;
  vectorChunk: {
    id: string;
    cosineSim: number;
    chunkBytes: number;
    context: string;
  };
}

export interface EngineStatus {
  id: string;
  name: string;
  badge: string;
  badgeType: 'primary' | 'secondary' | 'neutral';
  description: string;
  latencyOrStatus: string;
  substatus: string;
  substatusColor?: 'green' | 'slate';
}

export interface IngestionWorker {
  id: string;
  filename: string;
  progress: number;
  statusText: string;
  speedOrChunks: string;
  color: 'blue' | 'amber';
  isSpinning?: boolean;
}

export interface AuditLogItem {
  id: string;
  title: string;
  timeUTC: string;
  actor: string;
  hash: string;
  fullHash: string;
}

export interface MetricCardData {
  title: string;
  value: string;
  subtext: string;
  footerText: string;
  footerType: 'neutral' | 'success' | 'primary';
  footerIcon?: string;
}
