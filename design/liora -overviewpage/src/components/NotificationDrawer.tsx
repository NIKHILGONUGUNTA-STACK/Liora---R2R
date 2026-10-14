import React from 'react';
import { X, CheckCircle, Bell, ArrowRight } from 'lucide-react';

interface NotificationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onClear: () => void;
}

export const NotificationDrawer: React.FC<NotificationDrawerProps> = ({
  isOpen,
  onClose,
  onClear,
}) => {
  if (!isOpen) return null;

  const notifications = [
    {
      id: 'n1',
      title: 'Corpus Policy Re-indexed',
      desc: 'All 4 secure silos synchronized with 99.82% deterministic fidelity.',
      time: '12m ago',
      type: 'success',
    },
    {
      id: 'n2',
      title: 'HNSW Vector Cluster Balanced',
      desc: '14,892 vectors optimized with 11ms average lookup latency.',
      time: '1h ago',
      type: 'info',
    },
    {
      id: 'n3',
      title: 'API Key Rotated',
      desc: 'Workspace Admin token verified for US-EAST-01 (SYNTH-CORE).',
      time: '3h ago',
      type: 'warning',
    },
  ];

  return (
    <div className="fixed inset-0 bg-slate-900/20 backdrop-blur-2xs z-50 flex justify-end animate-in fade-in duration-100">
      <div
        className="bg-white w-full max-w-sm h-full border-l border-[#e2e8f0] shadow-xl p-4 flex flex-col justify-between"
        onClick={(e) => e.stopPropagation()}
      >
        <div>
          <div className="flex items-center justify-between pb-3 border-b border-[#e2e8f0]">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-[#1d4ed8]" />
              <h3 className="font-geist font-semibold text-[14px] text-slate-900">
                Workspace Notifications
              </h3>
            </div>
            <button
              onClick={onClose}
              className="text-slate-400 hover:text-slate-600 p-1 rounded-md"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-2 mt-3">
            {notifications.map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-lg bg-slate-50 border border-[#e2e8f0] hover:bg-slate-100/70 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <span className="font-geist font-medium text-[12px] text-slate-800">
                    {n.title}
                  </span>
                  <span className="font-mono-code text-[10px] text-slate-400">{n.time}</span>
                </div>
                <p className="font-sans text-[11px] text-slate-500 mt-0.5 leading-snug">
                  {n.desc}
                </p>
              </div>
            ))}
          </div>
        </div>

        <div className="pt-3 border-t border-[#e2e8f0] flex items-center justify-between text-xs">
          <button
            onClick={onClear}
            className="text-slate-500 hover:text-slate-800 font-geist text-[11.5px] cursor-pointer"
          >
            Mark all read
          </button>
          <button
            onClick={onClose}
            className="text-[#1d4ed8] hover:text-[#1e40af] font-geist font-medium text-[11.5px] cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
