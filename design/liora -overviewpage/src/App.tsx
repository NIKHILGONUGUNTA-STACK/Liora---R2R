/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { WorkspaceBanner } from './components/WorkspaceBanner';
import { MetricsStrip } from './components/MetricsStrip';
import { TraceList } from './components/TraceList';
import { ActiveEngines } from './components/ActiveEngines';
import { IngestionPipeline } from './components/IngestionPipeline';
import { AuditLogStream } from './components/AuditLogStream';
import { IngestModal } from './components/IngestModal';
import { CommandPalette } from './components/CommandPalette';
import { QueryModal } from './components/QueryModal';
import { NotificationDrawer } from './components/NotificationDrawer';
import {
  INITIAL_TRACES,
  INITIAL_ENGINES,
  INITIAL_WORKERS,
  INITIAL_AUDIT_LOGS,
} from './data/mockData';
import { AnalyticalTrace, IngestionWorker } from './types';
import { CheckCircle2 } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState('overview');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeCluster, setActiveCluster] = useState('Enterprise Production');

  // Modals state
  const [ingestModalOpen, setIngestModalOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const [queryModalOpen, setQueryModalOpen] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Active items & data
  const [traces, setTraces] = useState<AnalyticalTrace[]>(INITIAL_TRACES);
  const [selectedTraceForQuery, setSelectedTraceForQuery] = useState<AnalyticalTrace | null>(null);
  const [workers, setWorkers] = useState<IngestionWorker[]>(INITIAL_WORKERS);
  const [docCount, setDocCount] = useState(84);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 3500);
  };

  const handleOpenInChat = (trace: AnalyticalTrace) => {
    setSelectedTraceForQuery(trace);
    setQueryModalOpen(true);
  };

  const handleIngestSuccess = (filename: string) => {
    setDocCount((prev) => prev + 1);

    // Add newly ingested document to workers list with active progress
    const newWorker: IngestionWorker = {
      id: `work-${Date.now()}`,
      filename,
      progress: 12,
      statusText: 'Vector embedding & chunk parsing: 3,072-dims',
      speedOrChunks: 'Chunk 1/140',
      color: 'blue',
      isSpinning: true,
    };
    setWorkers((prev) => [newWorker, ...prev.slice(0, 2)]);
    showToast(`Document "${filename}" queued for ingestion & HNSW indexing.`);
  };

  const handleSelectTab = (tab: string) => {
    setCurrentTab(tab);
    if (tab === 'chat') {
      setSelectedTraceForQuery(traces[0]);
      setQueryModalOpen(true);
    } else if (tab === 'documents') {
      setIngestModalOpen(true);
    } else if (tab !== 'overview') {
      showToast(`Switched view to ${tab.charAt(0).toUpperCase() + tab.slice(1)}.`);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] flex font-sans antialiased">
      {/* Sidebar Navigation */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={handleSelectTab}
        isOpenMobile={mobileMenuOpen}
        onCloseMobile={() => setMobileMenuOpen(false)}
        activeCluster={activeCluster}
        onSelectCluster={(c) => {
          setActiveCluster(c);
          showToast(`Active cluster switched to ${c}.`);
        }}
      />

      {/* Main Content Area */}
      <div className="flex-1 lg:pl-60 flex flex-col min-h-screen w-full overflow-x-hidden">
        {/* Top Sticky Header */}
        <Header
          onOpenMobileMenu={() => setMobileMenuOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
          onOpenNewQuery={() => {
            setSelectedTraceForQuery(null);
            setQueryModalOpen(true);
          }}
          onToggleNotifications={() => setNotificationsOpen(!notificationsOpen)}
          hasUnreadNotifications={hasUnreadNotifications}
        />

        {/* Main Canvas Container */}
        <main className="pt-[52px] flex-1 flex flex-col w-full">
          {/* Top Context & Workspace Actions Banner */}
          <WorkspaceBanner
            clusterName={activeCluster}
            onOpenIngestModal={() => setIngestModalOpen(true)}
            onOpenQueryWorkspace={() => {
              setSelectedTraceForQuery(null);
              setQueryModalOpen(true);
            }}
          />

          {/* Metric Strip: 4 High-Density Cards */}
          <MetricsStrip docCount={docCount} />

          {/* Primary Asymmetric Split Canvas */}
          <div className="px-4 sm:px-6 pb-6 pt-1">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Left Column (7 cols): Recent Syntheses & Analytical Traces */}
              <div className="lg:col-span-7 flex flex-col gap-3">
                <TraceList
                  traces={traces}
                  onOpenInChat={handleOpenInChat}
                  onViewMoreSessions={() => {
                    showToast('Loaded all 148 recent sessions from US-EAST-01 archive.');
                  }}
                />
              </div>

              {/* Right Column (5 cols): Active Engines, Ingestion Pipeline, Audit Log Stream */}
              <div className="lg:col-span-5 flex flex-col gap-3.5">
                {/* 1. Active Engines */}
                <ActiveEngines engines={INITIAL_ENGINES} />

                {/* 2. Ingestion Pipeline */}
                <IngestionPipeline workers={workers} />

                {/* 3. Audit Log Stream */}
                <AuditLogStream logs={INITIAL_AUDIT_LOGS} />
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* Ingest Document Modal */}
      <IngestModal
        isOpen={ingestModalOpen}
        onClose={() => setIngestModalOpen(false)}
        onIngestSuccess={handleIngestSuccess}
      />

      {/* Command Palette (⌘K) */}
      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
        traces={traces}
        onSelectTrace={handleOpenInChat}
        onOpenIngest={() => setIngestModalOpen(true)}
        onOpenQuery={() => {
          setSelectedTraceForQuery(null);
          setQueryModalOpen(true);
        }}
      />

      {/* Query Workspace Modal */}
      <QueryModal
        isOpen={queryModalOpen}
        onClose={() => setQueryModalOpen(false)}
        selectedTrace={selectedTraceForQuery}
      />

      {/* Notifications Drawer */}
      <NotificationDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        onClear={() => {
          setHasUnreadNotifications(false);
          setNotificationsOpen(false);
        }}
      />

      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-slate-900 text-white px-3.5 py-2.5 rounded-lg shadow-xl text-[12px] font-geist flex items-center gap-2 border border-slate-700 animate-in slide-in-from-bottom-2 duration-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}
    </div>
  );
}
