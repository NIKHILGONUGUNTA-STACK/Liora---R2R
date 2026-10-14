/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { Sidebar, ChatSession } from './components/Sidebar';
import { EvidenceInspector } from './components/EvidenceInspector';
import { PromptComposer } from './components/PromptComposer';
import { ContextModal } from './components/ContextModal';
import { GraphAuditModal } from './components/GraphAuditModal';
import { CommandPalette } from './components/CommandPalette';
import { ProfileModal } from './components/ProfileModal';
import { Icon } from './components/Icon';
import { EvidenceSource, ThreadMessage, UploadedDoc } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('chat-and-research');
  const [currentWorkspace, setCurrentWorkspace] = useState('Enterprise Production');
  const [selectedModel, setSelectedModel] = useState('Liora Precision 4.5');
  const [selectedCorpus, setSelectedCorpus] = useState('Aegis Core Vault');
  const [generationMode, setGenerationMode] = useState<'stream' | 'instant'>('stream');

  // Sidebar and Evidence states
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isEvidenceOpen, setIsEvidenceOpen] = useState(false); // Default CLOSED as requested
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);

  // Interactive states
  const [highlightedSourceId, setHighlightedSourceId] = useState<string | null>(null);
  const [activeInspectSource, setActiveInspectSource] = useState<EvidenceSource | null>(null);
  const [isGraphAuditOpen, setIsGraphAuditOpen] = useState(false);
  const [isCommandPaletteOpen, setIsCommandPaletteOpen] = useState(false);
  const [isCopiedSnippet, setIsCopiedSnippet] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [unsupportedFileNotice, setUnsupportedFileNotice] = useState<string | null>(null);

  // Streaming and Loading state
  const [isGenerating, setIsGenerating] = useState(false);
  const [streamingText, setStreamingText] = useState('');
  const streamingIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Chat sessions for the dropdown
  const [chatSessions, setChatSessions] = useState<ChatSession[]>([
    {
      id: 'chat-1',
      title: 'Mutual TLS Certificate Rotation & Failover',
      timestamp: 'Today',
      corpus: 'Aegis Core Vault',
      docCount: 1,
    },
    {
      id: 'chat-2',
      title: 'SPIFFE Trust Domain Migration Policy',
      timestamp: 'Yesterday',
      corpus: 'Edge Proxy Mesh',
      docCount: 2,
    },
    {
      id: 'chat-3',
      title: 'Envoy SDS Hot Restart & Socket Invariants',
      timestamp: 'Oct 11',
      corpus: 'Aegis Core Vault',
      docCount: 1,
    },
    {
      id: 'chat-4',
      title: 'Disaster Recovery Dual-Region Ingress Test',
      timestamp: 'Oct 08',
      corpus: 'Disaster Recovery Index',
      docCount: 3,
    },
  ]);
  const [activeChatId, setActiveChatId] = useState('chat-1');

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage((prev) => (prev === msg ? null : prev));
    }, 2500);
  };

  // Evidence Sources
  const initialSources: EvidenceSource[] = [
    {
      id: 'src-1',
      sourceNumber: 1,
      title: 'Aegis-Security-Architecture-v3.2.pdf',
      location: 'P. 41',
      excerpt:
        '...in non-convergent partition events, Envoy Dynamic Secret Discovery (SDS) pipelines must under no circumstances sever current downstream keep-alives. The staging cache stores the superset of dual intermediate keys until explicit gRPC teardown occurs...',
      highlightedPhrase: 'Envoy Dynamic Secret Discovery (SDS)',
      similarity: 0.962,
      fullContent:
        'Section 4.1.2 SDS Partition Invariance: In non-convergent partition events, Envoy Dynamic Secret Discovery (SDS) pipelines must under no circumstances sever current downstream keep-alives. The staging cache stores the superset of dual intermediate keys until explicit gRPC teardown occurs, protecting TLS handshakes from premature dropouts during transient network splits.',
      metadata: {
        fileType: 'PDF Document',
        fileSize: '4.8 MB',
        lastUpdated: '2024-Q3 Audit',
        author: 'Aegis Platform Security Working Group',
        sha256: '9f83a210bc8201fa816e91024bdc3821049281a1bbcf8019',
        chunkId: 'PDF-P41-C03',
        vectors: 1536,
      },
    },
    {
      id: 'src-2',
      sourceNumber: 2,
      title: 'Envoy-Core-Proxy-Internals.md',
      location: '§ 8.4',
      excerpt:
        '...Validation Context SDS config ensures that root CA updates are non-destructive. combined_validation_context provides parallel validation against both retired and newly distributed SPIFFE trust bundles...',
      highlightedPhrase: 'combined_validation_context',
      similarity: 0.938,
      fullContent:
        '§ 8.4 Trust Anchor Multi-Versioning: Validation Context SDS config ensures that root CA updates are non-destructive. combined_validation_context provides parallel validation against both retired and newly distributed SPIFFE trust bundles, preventing client verification rejections during active certificate re-issue.',
      metadata: {
        fileType: 'Markdown Doc',
        fileSize: '620 KB',
        lastUpdated: '2024-09-18',
        author: 'Mesh Networking Core Team',
        sha256: '3e098a129ef3104cba77112009210aefc9182301982bca98',
        chunkId: 'MD-S84-C12',
        vectors: 1536,
      },
    },
    {
      id: 'src-3',
      sourceNumber: 3,
      title: 'Disaster-Recovery-Runbook-Prod.pdf',
      location: 'P. 119',
      excerpt:
        '...ALPN-based mutual handshakes during cross-region rollover defer certificate replacement until TLS 1.3 key exchange verifies reciprocal intermediate signature availability...',
      highlightedPhrase: 'ALPN-based mutual handshakes',
      similarity: 0.914,
      fullContent:
        'Runbook Procedure 11.9 Cross-Region Split-Brain Rollover: ALPN-based mutual handshakes during cross-region rollover defer certificate replacement until TLS 1.3 key exchange verifies reciprocal intermediate signature availability. If telemetry latency exceeds 180ms, traffic is re-routed via the auxiliary disaster recovery ingress node without interrupting established persistent gRPC streams.',
      metadata: {
        fileType: 'Operational Runbook',
        fileSize: '8.1 MB',
        lastUpdated: '2024-08-30',
        author: 'Site Reliability Engineering',
        sha256: '7b2098d01f004927bbca710927810ecba981023749210492',
        chunkId: 'RUNBOOK-P119-04',
        vectors: 1536,
      },
    },
  ];

  const [sources] = useState<EvidenceSource[]>(initialSources);

  // Initial messages for thread 1
  const initialThreadMessages: ThreadMessage[] = [
    {
      id: 'msg-1',
      type: 'user',
      author: 'Dr. Marcus Vance',
      roleTitle: 'Verified Operator',
      timestamp: '11:42:08 UTC',
      content:
        'In our high-availability deployment, how does Envoy’s dynamic Secret Discovery Service (SDS) maintain continuous mTLS integrity during a dual-region split-brain failover when the primary control-plane node becomes unreachable halfway through an active intermediate CA rotation cycle?',
      tags: ['envoy-sds', 'split-brain', 'mtls-fallback'],
      uploadedDocs: [
        {
          name: 'Aegis-Security-Architecture-v3.2.pdf',
          type: 'PDF Document',
          size: '4.8 MB',
          pages: 48,
          status: 'indexed',
          sha256: '9f83a210bc8201fa816e91024bdc3821049281a1bbcf8019',
        },
      ],
    },
    {
      id: 'msg-2',
      type: 'assistant',
      author: 'Liora Synthesizer',
      timestamp: '11:42:09 UTC',
      content:
        'Envoy guarantees zero downtime during asymmetric split-brain partition through its Warm Secret Staging Pipeline and decoupled SDS gRPC streaming architecture. When the control plane partition triggers before Envoy receives the final ACK of the rotated intermediate trust chain, the Envoy data plane executes a strict deterministic state preservation routine:',
      citations: { 1: 'src-1', 2: 'src-2', 3: 'src-3' },
      codeSnippet: {
        fileName: 'envoy.transport_sockets.tls.sds_failover.yaml',
        schemaVersion: 'v3 Schema',
        language: 'yaml',
        code: `transport_socket:
  name: envoy.transport_sockets.tls
  typed_config:
    "@type": type.googleapis.com/envoy.extensions.transport_sockets.tls.v3.DownstreamTlsContext
    common_tls_context:
      tls_certificate_sds_secret_configs:
        - name: aegis_workload_cert
          sds_config:
            resource_api_version: V3
            api_config_source:
              api_type: GRPC
              transport_api_version: V3
              grpc_services:
                - envoy_grpc:
                    cluster_name: sds_control_plane_primary
      combined_validation_context:
        default_validation_context:
          match_typed_subject_alt_names:
            - san_type: URI
              matcher:
                exact: "spiffe://aegis.internal/cluster/production"
        # Dual-root grace window preserves valid handshake across split-brain
        validation_context_sds_secret_config:
          name: aegis_dual_intermediate_bundle`,
      },
      metrics: {
        validationTitle: 'Synthesis Validation: Verified Invariant',
        validationSubtitle: 'Zero transport reset signals recorded in chaos benchmark 2024-Q3',
        cosineMatch: 0.9412,
        latencyMs: 412,
      },
      suggestedFollowUps: [
        'Inspect SPIFFE SAN validation policy',
        "Show Envoy admin '/certs' dump example",
      ],
    },
  ];

  // Map of messages per chat
  const [messagesByChat, setMessagesByChat] = useState<{ [key: string]: ThreadMessage[] }>({
    'chat-1': initialThreadMessages,
    'chat-2': [],
    'chat-3': [],
    'chat-4': [],
  });

  const currentMessages = messagesByChat[activeChatId] || [];

  // Handler to open evidence inspector and highlight evidence card
  const focusEvidence = (sourceId: string) => {
    setIsEvidenceOpen(true);
    setHighlightedSourceId(sourceId);
    setTimeout(() => {
      const element = document.getElementById(sourceId);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }
    }, 150);
    setTimeout(() => {
      setHighlightedSourceId(null);
    }, 2200);
  };

  const copySnippet = () => {
    const yamlCode = currentMessages[1]?.codeSnippet?.code || '';
    navigator.clipboard.writeText(yamlCode);
    setIsCopiedSnippet(true);
    showToast('YAML configuration copied');
    setTimeout(() => {
      setIsCopiedSnippet(false);
    }, 2000);
  };

  const copyMarkdown = () => {
    const text = `# Synthesized Verification & Operational Path\n\nEnvoy guarantees zero downtime during asymmetric split-brain partition through its Warm Secret Staging Pipeline and decoupled SDS gRPC streaming architecture [1].\n\n01. Atomic Cache Preservation & Grace Period Continuation [2]\n02. Downstream Circuit Severing Guard [3]\n03. Secondary Regional Failover Convergence\n\nSchema: envoy.transport_sockets.tls.sds_failover.yaml`;
    navigator.clipboard.writeText(text);
    showToast('Markdown copied to clipboard');
  };

  const branchThread = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newId,
      title: 'Branched: SDS Failover Fork',
      timestamp: 'Just now',
      corpus: selectedCorpus,
      docCount: 1,
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setMessagesByChat((prev) => ({
      ...prev,
      [newId]: [...(messagesByChat[activeChatId] || [])],
    }));
    setActiveChatId(newId);
    showToast('Branched into a new connected research session');
  };

  // Start fresh clean chat
  const handleStartNewChat = () => {
    const newId = `chat-${Date.now()}`;
    const newChat: ChatSession = {
      id: newId,
      title: 'New Query Session',
      timestamp: 'Just now',
      corpus: selectedCorpus,
      docCount: 0,
    };
    setChatSessions((prev) => [newChat, ...prev]);
    setMessagesByChat((prev) => ({ ...prev, [newId]: [] }));
    setActiveChatId(newId);
    showToast('Initialized clean chat session');
  };

  // Chat management actions
  const handleRenameChat = (chatId: string, newTitle: string) => {
    setChatSessions((prev) =>
      prev.map((c) => (c.id === chatId ? { ...c, title: newTitle } : c))
    );
    showToast('Renamed chat session');
  };

  const handleDeleteChat = (chatId: string) => {
    setChatSessions((prev) => prev.filter((c) => c.id !== chatId));
    if (activeChatId === chatId) {
      const remaining = chatSessions.filter((c) => c.id !== chatId);
      if (remaining.length > 0) {
        setActiveChatId(remaining[0].id);
      } else {
        handleStartNewChat();
      }
    }
    showToast('Deleted chat session');
  };

  const handleArchiveChat = (chatId: string) => {
    setChatSessions((prev) => prev.filter((c) => c.id !== chatId));
    showToast('Chat archived to compliance cold storage');
  };

  // User queries or clicks suggested exploration
  const handleQuerySubmit = (queryText: string, attachedDoc?: UploadedDoc) => {
    const userMsg: ThreadMessage = {
      id: `msg-${Date.now()}`,
      type: 'user',
      author: 'Dr. Marcus Vance',
      roleTitle: 'Verified Operator',
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      content: queryText,
      tags: attachedDoc ? ['document-grounded', 'invariant-query'] : ['follow-up', 'grounded-query'],
      uploadedDocs: attachedDoc ? [attachedDoc] : undefined,
    };

    setMessagesByChat((prev) => ({
      ...prev,
      [activeChatId]: [...(prev[activeChatId] || []), userMsg],
    }));

    setIsGenerating(true);

    let replySnippet = undefined;
    let replyContent = '';
    const suggested: string[] = [];

    if (queryText.toLowerCase().includes('spiffe') || queryText.toLowerCase().includes('san')) {
      replyContent =
        'SPIFFE SAN verification enforces strict deterministic validation via the match_typed_subject_alt_names stanza. Both intermediate trust domains are vetted simultaneously with exact URI matching, guaranteeing that workloads presenting rotated certificates are accepted without handshake degradation.';
      replySnippet = {
        fileName: 'spiffe.san_validation_policy.yaml',
        schemaVersion: 'v3 Schema',
        language: 'yaml',
        code: `match_typed_subject_alt_names:
  - san_type: URI
    matcher:
      exact: "spiffe://aegis.internal/cluster/production"
  - san_type: DNS
    matcher:
      suffix: "mesh.aegis.internal"`,
      };
      suggested.push("Export Envoy SDS metrics endpoint ('/stats/prometheus')");
      suggested.push('Simulate cross-region partition in chaos harness');
    } else if (queryText.toLowerCase().includes('certs') || queryText.toLowerCase().includes('dump')) {
      replyContent =
        'The Envoy administration endpoint exposes `/certs` formatted as JSON or human-readable text. It confirms both active in-flight certificates and staged warm secrets prior to the final control plane ACK.';
      replySnippet = {
        fileName: 'admin_certs_dump.json',
        schemaVersion: 'Envoy Admin v3',
        language: 'json',
        code: `{
  "certificates": [
    {
      "ca_cert": [{ "path": "sds:aegis_dual_intermediate_bundle", "days_until_expiration": "89" }],
      "cert_chain": [{ "path": "sds:aegis_workload_cert", "subject_alt_names": ["spiffe://aegis.internal/cluster/production"] }]
    }
  ]
}`,
      };
      suggested.push('Compare active vs staged CA hashes');
    } else {
      replyContent = `Cognitive synthesis complete for query: "${queryText}". The operational invariant holds across both active clusters with 99.8% grounding fidelity in Aegis Vault v3.2. SDS keep-alives remain intact without renegotiation.`;
      suggested.push('Audit cryptographic root of trust');
      suggested.push('Generate Terraform mesh manifest');
    }

    const assistantMsg: ThreadMessage = {
      id: `msg-${Date.now() + 1}`,
      type: 'assistant',
      author: 'Liora Synthesizer',
      timestamp: new Date().toISOString().substring(11, 19) + ' UTC',
      content: replyContent,
      citations: { 1: 'src-1', 2: 'src-2' },
      codeSnippet: replySnippet,
      metrics: {
        validationTitle: 'Synthesis Validation: Grounded',
        validationSubtitle: 'Validated against Aegis Knowledge Corpus',
        cosineMatch: 0.952,
        latencyMs: 388,
      },
      suggestedFollowUps: suggested,
    };

    if (generationMode === 'stream') {
      // Stream tokens like ChatGPT
      setStreamingText('');
      const words = replyContent.split(' ');
      let currentWordIndex = 0;

      setTimeout(() => {
        if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);

        streamingIntervalRef.current = setInterval(() => {
          if (currentWordIndex < words.length) {
            setStreamingText((prev) => (prev ? prev + ' ' + words[currentWordIndex] : words[0]));
            currentWordIndex++;
          } else {
            if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
            setIsGenerating(false);
            setStreamingText('');
            setMessagesByChat((prev) => ({
              ...prev,
              [activeChatId]: [...(prev[activeChatId] || []), assistantMsg],
            }));
            showToast('Token streaming complete');
          }
        }, 28);
      }, 600);
    } else {
      // Instant mode
      setTimeout(() => {
        setIsGenerating(false);
        setMessagesByChat((prev) => ({
          ...prev,
          [activeChatId]: [...(prev[activeChatId] || []), assistantMsg],
        }));
        showToast('Synthesized at once');
      }, 700);
    }
  };

  useEffect(() => {
    return () => {
      if (streamingIntervalRef.current) clearInterval(streamingIntervalRef.current);
    };
  }, []);

  const handleUnsupportedFile = (fileName: string) => {
    setUnsupportedFileNotice(
      `"${fileName}" is not supported yet. OCR parsing engine will be available soon for image scans. Please attach PDF, Word (.docx), PowerPoint (.pptx), or Text (.txt/.md) documents.`
    );
  };

  const mainPaddingLeft = isSidebarCollapsed ? 'pl-14' : 'pl-56';

  return (
    <div className="bg-background font-body-md text-on-surface min-h-screen antialiased">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-3 right-28 z-50 bg-[#0b1c30] text-white px-3 py-1.5 rounded-lg shadow-xl flex items-center gap-2 font-label-md text-[11.5px] border border-slate-700 animate-in fade-in slide-in-from-top-1">
          <Icon name="check_circle" size={14} className="text-[#10b981]" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Floating Top-Right Actions (No duplicate Evidence, replaced with Notifications as requested) */}
      <div className="fixed top-3 right-4 z-40 flex items-center gap-2 pointer-events-auto select-none">
        {/* New Chat Button */}
        <button
          onClick={handleStartNewChat}
          className="inline-flex items-center gap-1.5 h-7.5 px-3 bg-primary hover:bg-primary-container text-white font-label-md text-[12px] font-medium rounded-lg shadow-xs transition-all cursor-pointer"
          type="button"
        >
          <Icon name="add" size={13} className="text-white" />
          <span>New Chat</span>
        </button>

        {/* Notifications Button (Replacing duplicate evidence at top) */}
        <div className="relative">
          <button
            onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
            className={`w-7.5 h-7.5 rounded-lg border flex items-center justify-center transition-colors cursor-pointer shadow-xs ${
              isNotificationsOpen
                ? 'bg-primary-container text-white border-primary-container'
                : 'bg-white hover:bg-slate-50 text-secondary border-[#e2e8f0]'
            }`}
            title="Cluster Telemetry & Alerts"
            type="button"
          >
            <Icon name="notifications" size={15} />
            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-primary-container"></span>
          </button>

          {isNotificationsOpen && (
            <div className="absolute right-0 top-9 w-72 bg-white border border-[#e2e8f0] rounded-xl shadow-xl z-50 p-2 text-[12px]">
              <div className="flex items-center justify-between pb-1.5 border-b border-slate-100 font-semibold text-on-surface">
                <span>Cluster Notifications</span>
                <span className="text-[10px] text-secondary font-code-sm">US-EAST-01</span>
              </div>
              <div className="space-y-1.5 py-1.5 font-label-md">
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#10b981] mt-1 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-on-surface text-[11px]">mTLS Invariant Verified</p>
                    <p className="text-[10px] text-secondary">Zero transport resets in benchmark 2024-Q3</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-primary mt-1 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-on-surface text-[11px]">Aegis Vault Synced</p>
                    <p className="text-[10px] text-secondary">42,910 fragments vector indexed</p>
                  </div>
                </div>
                <div className="p-1.5 rounded-lg bg-slate-50 border border-slate-100 flex items-start gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#f59e0b] mt-1 shrink-0"></span>
                  <div>
                    <p className="font-semibold text-on-surface text-[11px]">CA Rotation Window</p>
                    <p className="text-[10px] text-secondary">Dual-root anchor grace window active</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Floating Left Expand Button when sidebar is collapsed */}
      {isSidebarCollapsed && (
        <button
          onClick={() => setIsSidebarCollapsed(false)}
          className="fixed top-3 left-16 z-40 w-7.5 h-7.5 rounded-lg bg-white/90 backdrop-blur-sm border border-[#e2e8f0] shadow-sm text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
          title="Expand Sidebar"
        >
          <Icon name="panel_left" size={16} className="text-secondary" />
        </button>
      )}

      {/* Persistent Left Navigation with Dropdown Chats, 3-dots hover menu, & Profile Modal Trigger */}
      <Sidebar
        currentTab={activeTab}
        onTabChange={(tab) => {
          setActiveTab(tab);
          if (tab !== 'chat-and-research') {
            showToast(`Switched view to ${tab}`);
          }
        }}
        workspace={currentWorkspace}
        onWorkspaceChange={(ws) => {
          setCurrentWorkspace(ws);
          showToast(`Active workspace: ${ws}`);
        }}
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onOpenGlobalSearch={() => setIsCommandPaletteOpen(true)}
        onOpenProfile={() => setIsProfileOpen(true)}
        activeChatId={activeChatId}
        onSelectChat={(id) => {
          setActiveChatId(id);
          showToast(`Loaded research thread`);
        }}
        onNewChat={handleStartNewChat}
        chatSessions={chatSessions}
        onRenameChat={handleRenameChat}
        onDeleteChat={handleDeleteChat}
        onBranchChat={branchThread}
        onArchiveChat={handleArchiveChat}
      />

      {/* Main Content Area without top header bar */}
      <div className={`${mainPaddingLeft} transition-all duration-200`}>
        <main className="relative pt-6 w-full bg-surface min-h-screen">
          {activeTab === 'chat-and-research' ? (
            <div className="flex flex-col w-full">
              {/* Clean Empty State when user creates a New Chat */}
              {currentMessages.length === 0 ? (
                <div className="w-full max-w-3xl mx-auto px-4 pt-12 pb-24 text-center space-y-6 animate-in fade-in">
                  <div className="w-12 h-12 rounded-2xl bg-primary text-white flex items-center justify-center mx-auto shadow-md">
                    <Icon name="hub" size={24} className="text-white" />
                  </div>

                  <div>
                    <h2 className="font-headline-md text-[22px] font-semibold text-on-surface">
                      What would you like to synthesize today?
                    </h2>
                    <p className="font-body-md text-[13px] text-secondary mt-1">
                      Attach architecture specifications, runbooks, or mTLS policies for deterministic verification.
                    </p>
                  </div>

                  {/* Document Dropzone & Upload Action */}
                  <div className="p-4 rounded-2xl border-2 border-dashed border-[#cbd5e1] hover:border-primary bg-slate-50/60 hover:bg-slate-50 transition-colors text-center cursor-pointer group">
                    <div className="flex flex-col items-center gap-1.5">
                      <div className="w-8 h-8 rounded-full bg-primary-fixed text-primary flex items-center justify-center group-hover:scale-105 transition-transform">
                        <Icon name="file_text" size={16} className="text-primary" />
                      </div>
                      <span className="font-label-md text-[12.5px] font-semibold text-on-surface">
                        Upload Document (.pdf, .docx, .pptx, .txt)
                      </span>
                      <span className="font-code-sm text-[11px] text-secondary">
                        OCR extraction coming soon • Vectorized with Aegis Invariant Indexing
                      </span>
                    </div>
                  </div>

                  {/* Suggested Quick Inquiries */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-left pt-2">
                    {[
                      {
                        title: 'Audit Envoy SDS failover invariants',
                        desc: 'Verify DownstreamTlsContext state preservation across split-brain',
                      },
                      {
                        title: 'Inspect SPIFFE SAN validation policy',
                        desc: 'Check exact URI matching with match_typed_subject_alt_names',
                      },
                      {
                        title: 'Compare active vs staged CA hashes',
                        desc: 'Inspect Envoy admin /certs dump and grace window',
                      },
                      {
                        title: 'Generate Terraform mesh manifest',
                        desc: 'Produce dual-bundle trust anchor overlay configuration',
                      },
                    ].map((sug, idx) => (
                      <button
                        key={idx}
                        onClick={() => handleQuerySubmit(sug.title)}
                        className="p-3 rounded-xl border border-[#e2e8f0] bg-white hover:bg-slate-50 hover:border-primary transition-all text-left cursor-pointer group shadow-2xs"
                      >
                        <p className="font-label-md text-[12.5px] font-semibold text-on-surface group-hover:text-primary transition-colors">
                          {sug.title}
                        </p>
                        <p className="font-body-sm text-[11px] text-secondary mt-0.5">{sug.desc}</p>
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                /* Chat Stream: User messages on the RIGHT with Gemini-style attached doc, Liora on LEFT (clean, fluid, no heavy nested cards, thought process hidden) */
                <div className="w-full max-w-4xl mx-auto px-4 space-y-6 pb-24">
                  {currentMessages.map((msg, index) => {
                    const isUser = msg.type === 'user';

                    if (isUser) {
                      return (
                        <div key={msg.id} className="w-full flex justify-end">
                          <div className="max-w-2xl flex items-start gap-2.5 flex-row-reverse">
                            {/* User Avatar */}
                            <div className="w-7 h-7 rounded-full bg-surface-container-highest text-primary flex items-center justify-center shrink-0 border border-[#e2e8f0] shadow-2xs">
                              <Icon name="fingerprint" size={16} className="text-primary" />
                            </div>

                            {/* User Message Bubble with Gemini-style Attached Document */}
                            <div className="bg-slate-50 border border-slate-200/90 rounded-2xl rounded-tr-xs p-3.5 shadow-2xs space-y-2.5">
                              {/* Operator Header & Branch Action */}
                              <div className="flex items-center justify-between gap-3 pb-1 border-b border-slate-200/60">
                                <div className="flex items-center gap-1.5">
                                  <button
                                    onClick={branchThread}
                                    className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md hover:bg-white text-secondary hover:text-primary transition-colors text-[10.5px] font-label-md cursor-pointer border border-transparent hover:border-slate-200"
                                    title="Branch this thread to explore an alternative hypothesis"
                                  >
                                    <Icon name="fork_right" size={12} className="text-secondary" />
                                    <span>Branch</span>
                                  </button>
                                </div>
                                <div className="flex items-center gap-1.5 text-right">
                                  <span className="font-label-md text-[12px] font-semibold text-on-surface">
                                    Dr. Marcus Vance
                                  </span>
                                  <span className="font-code-sm text-[10px] text-secondary">
                                    {msg.timestamp}
                                  </span>
                                </div>
                              </div>

                              {/* Gemini-Style Uploaded Document Chip in Chat */}
                              {msg.uploadedDocs && msg.uploadedDocs.length > 0 && (
                                <div className="p-2 rounded-xl bg-white border border-slate-200 shadow-2xs flex items-center justify-between gap-2.5">
                                  <div className="flex items-center gap-2 overflow-hidden">
                                    <div className="w-8 h-8 rounded-lg bg-red-50 text-red-600 border border-red-100 flex items-center justify-center shrink-0">
                                      <Icon name="file_text" size={16} className="text-red-500" />
                                    </div>
                                    <div className="min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-label-md text-[12px] font-semibold text-on-surface truncate">
                                          {msg.uploadedDocs[0].name}
                                        </span>
                                      </div>
                                      <p className="font-code-sm text-[10.5px] text-secondary flex items-center gap-1.5">
                                        <span>{msg.uploadedDocs[0].type || 'Doc'} • {msg.uploadedDocs[0].size}</span>
                                        <span>•</span>
                                        <span className="text-[#10b981] font-medium flex items-center gap-0.5">
                                          <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                                          Grounded (Vector Ready)
                                        </span>
                                      </p>
                                    </div>
                                  </div>

                                  <div className="flex items-center gap-1 shrink-0">
                                    <button
                                      onClick={() => focusEvidence('src-1')}
                                      className="px-2 py-1 rounded-lg bg-slate-50 hover:bg-slate-100 text-primary font-label-md text-[11px] font-medium transition-colors cursor-pointer border border-slate-200"
                                    >
                                      View Source
                                    </button>
                                  </div>
                                </div>
                              )}

                              {/* Question Text */}
                              <p className="font-body-md text-[13px] text-on-surface leading-relaxed">
                                {msg.content}
                              </p>

                              {/* Tags */}
                              {msg.tags && msg.tags.length > 0 && (
                                <div className="flex items-center justify-end gap-1.5 flex-wrap pt-0.5">
                                  {msg.tags.map((tg, tIdx) => (
                                    <span
                                      key={tIdx}
                                      className="px-1.5 py-0.2 rounded-md bg-white border border-[#e2e8f0] font-code-sm text-[10.5px] text-on-surface-variant flex items-center gap-1"
                                    >
                                      <Icon name="tag" size={10} className="text-primary" />
                                      {tg}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    }

                    // Assistant Message
                    return (
                      <div key={msg.id} className="w-full flex justify-start">
                        <div className="max-w-3xl flex items-start gap-2.5">
                          {/* Liora Assistant Avatar */}
                          <div className="w-7 h-7 rounded-full bg-primary-container text-on-primary flex items-center justify-center shrink-0 shadow-xs">
                            <Icon name="neurology" size={16} className="text-on-primary" />
                          </div>

                          {/* Fluid Assistant Response Area */}
                          <div className="flex-1 min-w-0 space-y-3">
                            {/* Synthesized Header */}
                            <div className="flex items-center justify-between pb-1 border-b border-slate-200/60">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-headline-sm text-[13.5px] font-semibold text-on-surface">
                                  Synthesized Verification & Operational Path
                                </span>
                                <span className="px-1.5 py-0.2 rounded bg-primary-fixed text-on-primary-fixed-variant font-label-sm text-[10px] font-semibold">
                                  DETERMINISTIC
                                </span>
                              </div>
                              <div className="flex items-center gap-1.5">
                                <button
                                  onClick={copyMarkdown}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-secondary hover:text-on-surface transition-colors cursor-pointer"
                                  title="Copy Markdown"
                                  type="button"
                                >
                                  <Icon name="content_copy" size={14} className="text-secondary" />
                                </button>
                                <button
                                  onClick={() => setIsGraphAuditOpen(true)}
                                  className="p-1 rounded-lg hover:bg-slate-100 text-secondary hover:text-on-surface transition-colors cursor-pointer"
                                  title="Audit Query Graph"
                                  type="button"
                                >
                                  <Icon name="account_tree" size={14} className="text-secondary" />
                                </button>
                              </div>
                            </div>

                            {/* Synthesis Paragraph */}
                            <p className="font-body-md text-[13px] text-on-surface leading-relaxed">
                              {msg.content}{' '}
                              {msg.citations && (
                                <button
                                  onClick={() => focusEvidence('src-1')}
                                  className="inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-code-sm text-[11px] font-semibold hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                                  type="button"
                                  title="View Source 1 in Evidence Inspector"
                                >
                                  [1]
                                </button>
                              )}
                            </p>

                            {/* 3 Numbered Steps formatted cleanly (for base message) */}
                            {index === 1 && (
                              <div className="space-y-2 pl-0.5">
                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-lg bg-slate-100 border border-[#e2e8f0] font-code-sm text-[10px] font-bold text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    01
                                  </span>
                                  <div>
                                    <p className="font-label-md text-[12px] text-on-surface font-semibold">
                                      Atomic Cache Preservation & Grace Period Continuation
                                    </p>
                                    <p className="font-body-sm text-[11.5px] text-secondary mt-0.5 leading-relaxed">
                                      The local Envoy memory store retains the pre-rotation TLS context as
                                      valid while simultaneously accepting certificates signed by either
                                      the old or newly staged CA bundle via dual-bundle trust anchor overlay{' '}
                                      <button
                                        onClick={() => focusEvidence('src-2')}
                                        className="inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-code-sm text-[11px] font-semibold hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                                        type="button"
                                        title="View Source 2 in Evidence Inspector"
                                      >
                                        [2]
                                      </button>
                                      .
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-lg bg-slate-100 border border-[#e2e8f0] font-code-sm text-[10px] font-bold text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    02
                                  </span>
                                  <div>
                                    <p className="font-label-md text-[12px] text-on-surface font-semibold">
                                      Downstream Circuit Severing Guard
                                    </p>
                                    <p className="font-body-sm text-[11.5px] text-secondary mt-0.5 leading-relaxed">
                                      SDS suppresses upstream resets. Active client connections on
                                      ephemeral workers persist without renegotiation. Transport socket
                                      updates are deferred until the remote peer verifies reciprocal
                                      support via ALPN negotiation{' '}
                                      <button
                                        onClick={() => focusEvidence('src-3')}
                                        className="inline-flex items-center justify-center px-1.5 py-0.2 mx-0.5 rounded bg-primary-fixed text-on-primary-fixed-variant font-code-sm text-[11px] font-semibold hover:bg-primary hover:text-on-primary transition-all cursor-pointer"
                                        type="button"
                                        title="View Source 3 in Evidence Inspector"
                                      >
                                        [3]
                                      </button>
                                      .
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-start gap-2.5">
                                  <span className="w-5 h-5 rounded-lg bg-slate-100 border border-[#e2e8f0] font-code-sm text-[10px] font-bold text-primary flex items-center justify-center shrink-0 mt-0.5">
                                    03
                                  </span>
                                  <div>
                                    <p className="font-label-md text-[12px] text-on-surface font-semibold">
                                      Secondary Regional Failover Convergence
                                    </p>
                                    <p className="font-body-sm text-[11.5px] text-secondary mt-0.5 leading-relaxed">
                                      Upon cross-zone latency spike (&gt;180ms over 3 heartbeats), regional
                                      routing directs ingress via the disaster recovery ingress gate,
                                      pulling cached secrets from the secondary control tier without
                                      dropping peer TLS handshakes.
                                    </p>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Code Block Container */}
                            {msg.codeSnippet && (
                              <div className="rounded-xl bg-inverse-surface text-inverse-on-surface overflow-hidden border border-[#e2e8f0]">
                                <div className="px-3 py-1.5 bg-surface-container-high/10 border-b border-surface-container-high/20 flex items-center justify-between font-code-sm text-[10.5px] text-surface-container-highest">
                                  <div className="flex items-center gap-1.5">
                                    <Icon name="code" size={13} className="text-primary-fixed" />
                                    <span className="font-medium text-white truncate">
                                      {msg.codeSnippet.fileName}
                                    </span>
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="px-1.5 py-0.2 rounded bg-surface-container-high/20 font-label-sm text-[9.5px] text-white">
                                      {msg.codeSnippet.schemaVersion}
                                    </span>
                                    <button
                                      onClick={copySnippet}
                                      className="hover:text-white text-surface-container-highest transition-colors p-0.5 cursor-pointer"
                                      type="button"
                                      title="Copy code snippet"
                                    >
                                      <Icon name={isCopiedSnippet ? 'check' : 'content_copy'} size={13} />
                                    </button>
                                  </div>
                                </div>

                                <pre className="p-3 font-code-sm text-[11px] leading-relaxed overflow-x-auto text-primary-fixed-dim">
                                  <code className="text-secondary-fixed">{msg.codeSnippet.code}</code>
                                </pre>
                              </div>
                            )}

                            {/* Synthesis Validation Metric Bar */}
                            {msg.metrics && (
                              <div className="rounded-xl bg-slate-50 border border-[#e2e8f0] p-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5">
                                <div className="flex items-center gap-2">
                                  <div className="w-6 h-6 rounded-full bg-[#10b981]/15 text-[#10b981] flex items-center justify-center shrink-0">
                                    <Icon name="verified" size={15} className="text-[#10b981]" />
                                  </div>
                                  <div>
                                    <p className="font-label-md text-[11.5px] font-semibold text-on-surface">
                                      {msg.metrics.validationTitle}
                                    </p>
                                    <p className="font-code-sm text-[10px] text-secondary">
                                      {msg.metrics.validationSubtitle}
                                    </p>
                                  </div>
                                </div>

                                <div className="flex items-center gap-3 text-right shrink-0">
                                  <div>
                                    <span className="font-label-sm text-[9px] uppercase tracking-wider text-secondary block">
                                      Cosine Match
                                    </span>
                                    <span className="font-code-sm text-[10.5px] font-semibold text-on-surface">
                                      {msg.metrics.cosineMatch}
                                    </span>
                                  </div>
                                  <div>
                                    <span className="font-label-sm text-[9px] uppercase tracking-wider text-secondary block">
                                      Latency
                                    </span>
                                    <span className="font-code-sm text-[10.5px] font-semibold text-on-surface">
                                      {msg.metrics.latencyMs}ms
                                    </span>
                                  </div>
                                  <div className="w-10 h-5 flex items-center justify-center">
                                    <svg className="w-full h-full text-primary" fill="none" viewBox="0 0 48 20">
                                      <path
                                        d="M1 15 L9 13 L17 17 L25 7 L33 9 L41 3 L47 4"
                                        stroke="currentColor"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth="1.75"
                                      />
                                    </svg>
                                  </div>
                                </div>
                              </div>
                            )}

                            {/* Suggested Explorations */}
                            {msg.suggestedFollowUps && msg.suggestedFollowUps.length > 0 && (
                              <div className="pt-0.5 flex flex-wrap items-center gap-1.5">
                                <span className="font-label-sm text-[10px] text-secondary uppercase tracking-wider">
                                  Suggested:
                                </span>
                                {msg.suggestedFollowUps.map((sug, sIdx) => (
                                  <button
                                    key={sIdx}
                                    onClick={() => handleQuerySubmit(sug)}
                                    className="px-2 py-1 rounded-lg border border-[#e2e8f0] bg-white hover:bg-slate-50 text-on-surface font-body-sm text-[11px] transition-colors flex items-center gap-1 cursor-pointer shadow-2xs"
                                    type="button"
                                  >
                                    <span>{sug}</span>
                                    <Icon name="arrow_forward" size={11} className="text-secondary" />
                                  </button>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Animated Loading & Token Streaming Progress (Processing symbol as requested) */}
              {isGenerating && (
                <div className="w-full max-w-4xl mx-auto px-4 pb-24 flex justify-start animate-in fade-in">
                  <div className="max-w-3xl flex items-start gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-primary-container text-white flex items-center justify-center shrink-0 shadow-xs animate-pulse">
                      <Icon name="sparkles" size={14} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0 space-y-2">
                      {streamingText ? (
                        <div className="space-y-2">
                          <p className="font-body-md text-[13px] text-on-surface leading-relaxed">
                            {streamingText}
                            <span className="inline-block w-1.5 h-4 ml-0.5 bg-primary animate-pulse align-middle"></span>
                          </p>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-2.5 py-1.5 px-3 rounded-lg bg-slate-50 border border-slate-200">
                          <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin"></div>
                          <span className="font-label-md text-[12px] text-on-surface font-medium">
                            Processing & generating invariant synthesis...
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Evidence Inspector Side Bar (Always closed by default, with hover trigger) */}
              <EvidenceInspector
                sources={sources}
                highlightedSourceId={highlightedSourceId}
                onInspect={(source) => setActiveInspectSource(source)}
                isOpen={isEvidenceOpen}
                onClose={() => setIsEvidenceOpen(false)}
                onOpen={() => setIsEvidenceOpen(true)}
              />

              {/* Floating Low-profile Docked Prompt Composer */}
              <PromptComposer
                onSubmit={handleQuerySubmit}
                selectedModel={selectedModel}
                onModelChange={(m) => {
                  setSelectedModel(m);
                  showToast(`Active model: ${m}`);
                }}
                selectedCorpus={selectedCorpus}
                onCorpusClick={() => {
                  setSelectedCorpus((prev) =>
                    prev === 'Aegis Core Vault' ? 'Edge Ingress Spec' : 'Aegis Core Vault'
                  );
                  showToast('Switched corpus');
                }}
                onTuneClick={() => {
                  setIsProfileOpen(true);
                }}
                isSidebarCollapsed={isSidebarCollapsed}
                onUnsupportedFile={handleUnsupportedFile}
              />
            </div>
          ) : (
            /* Alternate Tabs View */
            <div className="p-6 max-w-4xl mx-auto space-y-4">
              <div className="bg-white p-5 rounded-2xl border border-[#e2e8f0]">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="font-headline-md text-[18px] font-semibold text-on-surface capitalize">
                    {activeTab.replace('-', ' ')}
                  </h2>
                  <button
                    onClick={() => setActiveTab('chat-and-research')}
                    className="px-3 py-1 rounded-lg bg-primary text-white font-label-md text-[12px] cursor-pointer"
                  >
                    Return to Chat & Research
                  </button>
                </div>
                <p className="text-secondary font-body-md text-[13px]">
                  Viewing parameters for <strong className="text-on-surface">{currentWorkspace}</strong>.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-4">
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                    <div className="font-label-sm text-[10px] text-secondary uppercase font-semibold">
                      Total Corpora Fragments
                    </div>
                    <div className="text-[20px] font-bold text-on-surface mt-0.5 font-mono">42,910</div>
                    <div className="font-body-sm text-[11px] text-[#10b981] mt-0.5">● 100% Vector Synced</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                    <div className="font-label-sm text-[10px] text-secondary uppercase font-semibold">
                      Mean Grounding Score
                    </div>
                    <div className="text-[20px] font-bold text-on-surface mt-0.5 font-mono">0.9482</div>
                    <div className="font-body-sm text-[11px] text-primary mt-0.5">Zero Hallucinations Verified</div>
                  </div>
                  <div className="p-3 rounded-xl bg-slate-50 border border-[#e2e8f0]">
                    <div className="font-label-sm text-[10px] text-secondary uppercase font-semibold">
                      Active Invariant Rules
                    </div>
                    <div className="text-[20px] font-bold text-on-surface mt-0.5 font-mono">148 Rules</div>
                    <div className="font-body-sm text-[11px] text-secondary mt-0.5">mTLS, SPIFFE, SDS v3</div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Unsupported File Modal Notice */}
      {unsupportedFileNotice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl max-w-md w-full p-5 space-y-3">
            <div className="flex items-center gap-2.5 text-[#ba1a1a]">
              <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center">
                <Icon name="archive" size={16} className="text-red-600" />
              </div>
              <h3 className="font-headline-sm text-[14px] font-semibold text-on-surface">
                File Format Unavailable
              </h3>
            </div>
            <p className="font-body-md text-[13px] text-secondary leading-relaxed">
              {unsupportedFileNotice}
            </p>
            <div className="pt-2 flex justify-end">
              <button
                onClick={() => setUnsupportedFileNotice(null)}
                className="px-4 py-1.5 rounded-xl bg-primary text-white font-label-md text-[12px] font-medium hover:bg-primary-container cursor-pointer"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Account & Profile Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
        generationMode={generationMode}
        onGenerationModeChange={(m) => {
          setGenerationMode(m);
          showToast(`Generation mode set to ${m === 'stream' ? 'Token Streaming' : 'Instant Output'}`);
        }}
      />

      {/* Context Inspection Modal */}
      <ContextModal
        source={activeInspectSource}
        onClose={() => setActiveInspectSource(null)}
      />

      {/* Proof-of-Grounding DAG Graph Audit Modal */}
      <GraphAuditModal
        isOpen={isGraphAuditOpen}
        onClose={() => setIsGraphAuditOpen(false)}
      />

      {/* ⌘K Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setIsCommandPaletteOpen(false)}
        onSelectTopic={(topic) => handleQuerySubmit(topic)}
      />
    </div>
  );
}
