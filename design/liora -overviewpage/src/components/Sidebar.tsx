import React, { useState } from 'react';
import {
  LayoutDashboard,
  Brain,
  FileText,
  Cpu,
  BarChart3,
  Settings,
  ChevronsUpDown,
  User,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

interface SidebarProps {
  currentTab: string;
  onSelectTab: (tab: string) => void;
  isOpenMobile: boolean;
  onCloseMobile: () => void;
  activeCluster: string;
  onSelectCluster: (cluster: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  isOpenMobile,
  onCloseMobile,
  activeCluster,
  onSelectCluster,
}) => {
  const [clusterDropdownOpen, setClusterDropdownOpen] = useState(false);

  const clusterOptions = [
    { id: 'Enterprise Production', region: 'us-east-2 · active', isDefault: true },
    { id: 'Staging Enclave 02', region: 'eu-west-1 · sync', isDefault: false },
    { id: 'Air-Gapped Sovereign Node', region: 'us-gov-west · isolated', isDefault: false },
  ];

  const navItems = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    { id: 'chat', label: 'Chat & Research', icon: Brain },
    { id: 'documents', label: 'Documents', icon: FileText, badge: '84' },
    { id: 'models', label: 'Models & Providers', icon: Cpu, badge: '3' },
    { id: 'analytics', label: 'Analytics & Audit', icon: BarChart3 },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpenMobile && (
        <div
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
          onClick={onCloseMobile}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 w-60 bg-white border-r border-[#e2e8f0] z-50 flex flex-col justify-between transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isOpenMobile ? 'translate-x-0 shadow-xl' : '-translate-x-full'
        }`}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header Brand */}
          <div className="h-[52px] px-3.5 flex items-center justify-between border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <div className="w-6.5 h-6.5 bg-[#1d4ed8] rounded-md flex items-center justify-center text-white shadow-xs">
                {/* Hub/Liora mark icon */}
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="12" cy="12" r="3" />
                  <path d="M12 3v6" />
                  <path d="M12 15v6" />
                  <path d="M3 12h6" />
                  <path d="M15 12h6" />
                  <circle cx="12" cy="3" r="1.5" />
                  <circle cx="12" cy="21" r="1.5" />
                  <circle cx="3" cy="12" r="1.5" />
                  <circle cx="21" cy="12" r="1.5" />
                </svg>
              </div>
              <span className="font-geist font-semibold text-[14px] text-slate-900 tracking-tight">
                Liora Intelligence
              </span>
            </div>

            {/* Mobile Close Button */}
            <button
              onClick={onCloseMobile}
              className="lg:hidden text-slate-400 hover:text-slate-600 p-1"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Cluster Switcher */}
          <div className="px-3 pt-2.5 pb-1.5 relative">
            <button
              onClick={() => setClusterDropdownOpen(!clusterDropdownOpen)}
              className="w-full flex items-center justify-between p-1.5 px-2.5 rounded-lg bg-slate-50 border border-[#e2e8f0] text-slate-800 hover:bg-slate-100 transition-colors text-left"
            >
              <div className="flex items-center gap-2 overflow-hidden">
                <span className="w-1.5 h-1.5 rounded-full bg-[#1d4ed8] shrink-0" />
                <span className="font-geist text-[12px] font-medium truncate text-slate-800">
                  {activeCluster}
                </span>
              </div>
              <ChevronsUpDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            </button>

            {/* Cluster dropdown menu */}
            {clusterDropdownOpen && (
              <div className="absolute left-3 right-3 top-11 mt-1 bg-white border border-[#e2e8f0] rounded-lg shadow-md z-30 py-1 text-xs">
                <div className="px-2.5 py-1 text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
                  Select Mesh Enclave
                </div>
                {clusterOptions.map((opt) => (
                  <button
                    key={opt.id}
                    onClick={() => {
                      onSelectCluster(opt.id);
                      setClusterDropdownOpen(false);
                    }}
                    className="w-full px-2.5 py-1.5 text-left flex items-center justify-between hover:bg-slate-50 text-slate-700"
                  >
                    <div>
                      <div className="font-medium text-[12px] text-slate-900">{opt.id}</div>
                      <div className="text-[10px] text-slate-400 font-mono-code">{opt.region}</div>
                    </div>
                    {activeCluster === opt.id && <Check className="w-3.5 h-3.5 text-[#1d4ed8]" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Section Heading */}
          <div className="px-3 pt-2 pb-1">
            <span className="font-geist text-[10px] uppercase tracking-wider text-slate-400 px-1 font-semibold">
              Navigation
            </span>
          </div>

          {/* Nav Links */}
          <nav className="flex-1 px-2 space-y-0.5 overflow-y-auto">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    onSelectTab(item.id);
                    onCloseMobile();
                  }}
                  className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-[13px] font-medium transition-colors ${
                    isActive
                      ? 'bg-[#1d4ed8] text-white shadow-xs font-semibold'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-500'}`} />
                    <span className="font-geist">{item.label}</span>
                  </div>
                  {item.badge && !isActive && (
                    <span className="text-[10px] font-mono-code px-1.5 py-0.2 rounded bg-slate-100 text-slate-500">
                      {item.badge}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Profile Card Footer */}
        <div className="p-2.5 bg-white border-t border-[#e2e8f0]">
          <div className="flex items-center justify-between p-1.5 px-2 rounded-lg bg-slate-50 border border-[#e2e8f0] hover:bg-slate-100/80 transition-colors cursor-pointer">
            <div className="flex items-center gap-2 overflow-hidden">
              <div className="w-7 h-7 rounded-full bg-[#1d4ed8] flex items-center justify-center shrink-0 text-white font-medium text-[11px]">
                <User className="w-3.5 h-3.5" />
              </div>
              <div className="min-w-0">
                <p className="font-geist text-[12px] font-medium text-slate-900 truncate leading-tight">
                  Dr. Evelyn Voss
                </p>
                <p className="font-geist text-[10px] text-slate-500 truncate leading-tight">
                  Lead Cognitive Eng
                </p>
              </div>
            </div>
            <span
              className="w-2 h-2 rounded-full bg-[#10b981] shrink-0"
              title="Identity token verified"
            />
          </div>
        </div>
      </aside>
    </>
  );
};
