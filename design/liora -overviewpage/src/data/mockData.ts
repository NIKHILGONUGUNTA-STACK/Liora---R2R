import { AnalyticalTrace, EngineStatus, IngestionWorker, AuditLogItem } from '../types';

export const INITIAL_TRACES: AnalyticalTrace[] = [
  {
    id: 'trace-1',
    traceNumber: 'Trace #TX-88204',
    matchScore: 99.4,
    timestamp: '14m ago',
    query: '"What is the token expiration TTL policy inside the Aegis authentication mesh during cold reboot?"',
    summary: 'During node recovery under cold-boot thresholds, the session leases default to strict ',
    highlightValue: '900_000ms (15 minutes)',
    summarySuffix: ', superseding any legacy ephemeral JWT payloads until consensus heartbeat reaches quorum across all regional sidecars.',
    sources: [
      { title: 'Aegis-Auth-Spec-v4.pdf', detail: 'Page 14' },
      { title: 'rfc-mesh-consensus.md', detail: '§3.12' },
    ],
    vectorChunk: {
      id: '88204-C4',
      cosineSim: 0.9942,
      chunkBytes: 412,
      context: 'TTL enforcement override applies exclusively to bootstrap runlevel 0...',
    },
  },
  {
    id: 'trace-2',
    traceNumber: 'Trace #TX-88191',
    matchScore: 98.1,
    timestamp: '1h 42m ago',
    query: '"Summarize liquidity margin haircut constraints mandated for Level-2 collateralized treasuries."',
    summary: 'Level-2 securities exhibit variable valuation reductions between ',
    highlightValue: '3.5% and 7.2%',
    summarySuffix: ' depending on residual maturity and daily volatility index values. No synthetic offset is authorized without Tier-1 sovereign guarantees.',
    sources: [
      { title: 'Basel-IV-Compliance-Framework.pdf', detail: 'Page 89' },
    ],
    vectorChunk: {
      id: '88191-B2',
      cosineSim: 0.9814,
      chunkBytes: 840,
      context: 'Haircut adjustments take automatic precedence under section 14-B clearing...',
    },
  },
  {
    id: 'trace-3',
    traceNumber: 'Trace #TX-88045',
    matchScore: 96.7,
    timestamp: '3h 10m ago',
    query: '"What is the expected latency overhead of the eBPF packet tracing sandbox under 40Gbps load?"',
    summary: 'Observed kernel dispatch delay remains bounded strictly beneath ',
    highlightValue: '1.2 microseconds per frame',
    summarySuffix: ', provided ring buffer saturation stays below 82% allocation depth.',
    sources: [
      { title: 'eBPF-Production-Bench-2025.json', detail: 'Bench Log #4' },
    ],
    vectorChunk: {
      id: '88045-A9',
      cosineSim: 0.9678,
      chunkBytes: 388,
      context: 'Mean packet inspection cost normalized across 12-core NUMA sockets...',
    },
  },
];

export const INITIAL_ENGINES: EngineStatus[] = [
  {
    id: 'eng-1',
    name: 'Claude 3.5 Sonnet / Liora 4.5',
    badge: 'Primary',
    badgeType: 'primary',
    description: 'High-entropy logical deduction & citation synthesis',
    latencyOrStatus: '28ms avg',
    substatus: 'Zero-failure',
    substatusColor: 'slate',
  },
  {
    id: 'eng-2',
    name: 'text-embedding-3-large',
    badge: 'Embedding',
    badgeType: 'neutral',
    description: 'Multi-layer semantic manifold (3,072-dims)',
    latencyOrStatus: '11ms avg',
    substatus: 'HNSW cluster',
    substatusColor: 'slate',
  },
  {
    id: 'eng-3',
    name: 'Ollama v0.5.8 deepseek-r1',
    badge: 'Local Air-gap',
    badgeType: 'neutral',
    description: 'On-premise confidential parsing (NVIDIA H100)',
    latencyOrStatus: 'Idle',
    substatus: 'Ready',
    substatusColor: 'green',
  },
];

export const INITIAL_WORKERS: IngestionWorker[] = [
  {
    id: 'work-1',
    filename: 'Q3-Audited-Statements-Consolidated.pdf',
    progress: 78,
    statusText: 'Extracting table vectors: pg 142 of 180',
    speedOrChunks: '1.2 MB/s',
    color: 'blue',
    isSpinning: true,
  },
  {
    id: 'work-2',
    filename: 'Internal-Engineering-RFC-Archive.tar',
    progress: 42,
    statusText: 'Tokenization & graph cross-linking',
    speedOrChunks: 'Chunk 410/980',
    color: 'amber',
  },
];

export const INITIAL_AUDIT_LOGS: AuditLogItem[] = [
  {
    id: 'audit-1',
    title: 'Corpus Policy Re-indexed',
    timeUTC: '11:42:09 UTC',
    actor: 'Actor: System (Automated-Cron)',
    hash: 'hash: 9f4e...88a2',
    fullHash: 'd82fa7c89f4e41ba9205bce88a2119ecb001a41e9742',
  },
  {
    id: 'audit-2',
    title: 'API Key Rotated: Workspace Admin',
    timeUTC: '09:14:52 UTC',
    actor: 'Actor: evelyn.voss@enterprise',
    hash: 'hash: c42b...17ef',
    fullHash: 'e7135a9cc42b1029cbb3d84f17ef9925eac127391ab7',
  },
  {
    id: 'audit-3',
    title: 'Access Token Verified: Claude-3.5',
    timeUTC: '08:00:01 UTC',
    actor: 'Actor: Ingestion-Worker-US-East',
    hash: 'hash: e01a...991d',
    fullHash: '394a10f8e01aa3755498877bc991d752ab9900223401',
  },
];
