export interface VerifiedSource {
  id: string;
  badgeIndex: number;
  filename: string;
  section: string;
  quote: string;
  similarity: number;
  sha256: string;
  byteOffset: string;
}

export interface ThreadStep {
  number: string;
  title: string;
  description: string;
  citationId: number;
}

export interface BenchmarkThread {
  id: string;
  title: string;
  operator: {
    name: string;
    role: string;
    time: string;
  };
  query: string;
  tags: string[];
  corpus: string;
  fragmentsCount: string;
  synthesizedLead: string;
  steps: ThreadStep[];
  codeConfig: {
    filename: string;
    code: string;
  };
  groundingFidelity: number;
  hallucinationDrift: number;
  sources: VerifiedSource[];
  enclaveNode: string;
  p95Latency: string;
  tokensSynthesized: number;
  groundingPassRate: string;
}

export const BENCHMARK_THREADS: BenchmarkThread[] = [
  {
    id: 'THREAD-8492',
    title: 'Mutual TLS Certificate Rotation & Regional Failover',
    operator: {
      name: 'Dr. Marcus Vance',
      role: '11:42:08 UTC • Operator',
      time: '11:42:08 UTC',
    },
    query: "In our high-availability deployment, how does Envoy's dynamic Secret Discovery Service (SDS) maintain continuous mTLS integrity during a dual-region split-brain failover?",
    tags: ['#envoy-sds', '#split-brain', '#mtls-fallback'],
    corpus: 'Aegis Core Vault',
    fragmentsCount: '42,910 fragments',
    synthesizedLead: "Envoy guarantees zero downtime during asymmetric split-brain partitions through its Warm Secret Staging Pipeline and decoupled SDS gRPC streaming architecture",
    steps: [
      {
        number: '01',
        title: 'Atomic Cache Preservation',
        description: 'Retains pre-rotation TLS context while accepting certificates from either CA bundle via dual-bundle trust anchor overlay',
        citationId: 2,
      },
      {
        number: '02',
        title: 'Circuit Severing Guard',
        description: 'SDS suppresses upstream resets without renegotiation until peer verifies reciprocal support',
        citationId: 3,
      },
    ],
    codeConfig: {
      filename: 'envoy.transport_sockets.tls.sds_failover.yaml',
      code: 'trusted_ca: { filename: "/etc/envoy/certs/dual_trust_anchors.pem" }\nvalidation_context_sds_secret_config: { api_type: GRPC }',
    },
    groundingFidelity: 99.82,
    hallucinationDrift: 0.0,
    sources: [
      {
        id: 's1',
        badgeIndex: 1,
        filename: 'Aegis-SDS-Arch-v3.2.pdf',
        section: 'Page 41',
        quote: '"...in non-convergent partition events, Envoy SDS pipelines must not sever downstream keep-alives..."',
        similarity: 0.962,
        sha256: '4b9a...1ef8',
        byteOffset: 'bytes 10428-10940',
      },
      {
        id: 's2',
        badgeIndex: 2,
        filename: 'envoy_core_proxy.md',
        section: 'Sec 8.4',
        quote: '"Validation context SDS configs ensure root CA updates are non-destructive and retain fallback keychains until confirmed."',
        similarity: 0.941,
        sha256: '8a0c...93d2',
        byteOffset: 'bytes 4280-4690',
      },
      {
        id: 's3',
        badgeIndex: 3,
        filename: 'mtls_mesh_invariants_2026.pdf',
        section: 'Page 112',
        quote: '"During split-brain network topologies, reciprocal verification gates block silent cipher downgrade across regional boundaries."',
        similarity: 0.938,
        sha256: '9f21...cc54',
        byteOffset: 'bytes 18902-19210',
      },
    ],
    enclaveNode: 'Hardware Enclave Node #EU-WEST-4',
    p95Latency: '42ms flat',
    tokensSynthesized: 384,
    groundingPassRate: '100%',
  },
  {
    id: 'THREAD-9104',
    title: 'Distributed Raft Quorum & Zero-Loss Log Compaction',
    operator: {
      name: 'Elena Rostova',
      role: '14:05:12 UTC • Principal SRE',
      time: '14:05:12 UTC',
    },
    query: 'What mathematical guarantees prevent state drift when streaming snapshots during active Raft leader re-election under 40% network packet drop?',
    tags: ['#raft-consensus', '#snapshot-sync', '#split-vote'],
    corpus: 'Aegis Consensus Spec',
    fragmentsCount: '19,440 fragments',
    synthesizedLead: 'Log index monotonicity is enforced via term barrier hashing and monotonic commit watermarks before snapshot serialization begins',
    steps: [
      {
        number: '01',
        title: 'Term Barrier Enforcement',
        description: 'Followers reject incoming snapshot chunks unless sender provides verifiable lease proof matching the higher epoch number',
        citationId: 1,
      },
      {
        number: '02',
        title: 'Zero-Copy Compaction Lock',
        description: 'Compaction daemon operates on copy-on-write snapshot delta ring buffer, leaving in-flight log commits undisturbed',
        citationId: 2,
      },
    ],
    codeConfig: {
      filename: 'consensus.raft.compaction_invariants.json',
      code: '{\n  "snapshot_quorum_threshold": 0.67,\n  "enforce_term_monotonicity": true,\n  "ephemeral_ring_buffer_mb": 512\n}',
    },
    groundingFidelity: 99.94,
    hallucinationDrift: 0.0,
    sources: [
      {
        id: 'r1',
        badgeIndex: 1,
        filename: 'raft_formal_verification_tla.pdf',
        section: 'Theorem 4.2',
        quote: '"Under arbitrary packet drop, log index monotonicity holds iff snapshot chunks carry term-sealed SHA-256 state assertions."',
        similarity: 0.981,
        sha256: '7c33...88bb',
        byteOffset: 'bytes 8400-8920',
      },
      {
        id: 'r2',
        badgeIndex: 2,
        filename: 'storage_engine_ring_buffer.md',
        section: 'Sec 12.1',
        quote: '"Copy-on-write ring buffers prevent dirty snapshot reads by holding read locks on committed log tails until flush acknowledgement."',
        similarity: 0.957,
        sha256: '3d12...e041',
        byteOffset: 'bytes 3100-3490',
      },
    ],
    enclaveNode: 'Hardware Enclave Node #US-EAST-1',
    p95Latency: '38ms flat',
    tokensSynthesized: 412,
    groundingPassRate: '100%',
  },
  {
    id: 'THREAD-7729',
    title: 'HIPAA 45 CFR § 164.312 Ephemeral RAM Key Derivation',
    operator: {
      name: 'Sarah Chen, MD PhD',
      role: '09:18:44 UTC • Chief Compliance Officer',
      time: '09:18:44 UTC',
    },
    query: 'How does Liora satisfy HIPAA § 164.312(a)(2)(iv) encryption requirements during multi-tenant vector similarity searches over protected health records?',
    tags: ['#hipaa-compliance', '#zero-retention', '#enclave-kms'],
    corpus: 'Clinical Health Corpus',
    fragmentsCount: '84,120 fragments',
    synthesizedLead: 'Protected health information vectors are decrypted exclusively inside AWS Nitro Enclaves with ephemeral session keys wiped upon response completion',
    steps: [
      {
        number: '01',
        title: 'Sub-Millisecond Key Zeroization',
        description: 'Session symmetric keys are derived in enclave CPU registers and immediately zeroized following Merkle signature calculation',
        citationId: 1,
      },
      {
        number: '02',
        title: 'Cryptographic Audit Trail',
        description: 'Generates zero-knowledge attestation proving vector calculation executed without persistent storage attachment or host memory leakage',
        citationId: 2,
      },
    ],
    codeConfig: {
      filename: 'nitro_enclave.kms_attestation.rego',
      code: 'default allow = false\nallow { input.pcr0_hash == data.expected_enclave_hash; input.zero_retention_acknowledged == true }',
    },
    groundingFidelity: 100.0,
    hallucinationDrift: 0.0,
    sources: [
      {
        id: 'h1',
        badgeIndex: 1,
        filename: 'hipaa_security_rule_audit_2026.pdf',
        section: 'Clause 45-B',
        quote: '"Ephemeral enclave processing satisfies statutory technical safeguards provided decryption keys are never written to physical media."',
        similarity: 0.994,
        sha256: 'aa19...55c2',
        byteOffset: 'bytes 5510-6120',
      },
      {
        id: 'h2',
        badgeIndex: 2,
        filename: 'nitro_pcr_attestation_spec.md',
        section: 'Sec 3.1',
        quote: '"PCR0 and PCR1 registers provide cryptographically verifiable proof of enclave image integrity to external KMS auditors."',
        similarity: 0.978,
        sha256: '18be...92ff',
        byteOffset: 'bytes 920-1340',
      },
    ],
    enclaveNode: 'Hardware Enclave Node #US-WEST-2',
    p95Latency: '46ms flat',
    tokensSynthesized: 320,
    groundingPassRate: '100%',
  },
];
