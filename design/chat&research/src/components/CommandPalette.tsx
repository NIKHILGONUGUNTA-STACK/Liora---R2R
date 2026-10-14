import React, { useState, useEffect } from 'react';
import { Icon } from './Icon';

interface CommandPaletteProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectTopic: (query: string) => void;
}

export const CommandPalette: React.FC<CommandPaletteProps> = ({
  isOpen,
  onClose,
  onSelectTopic,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      } else if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const quickItems = [
    {
      category: 'Recent Knowledge Traces',
      items: [
        {
          title: 'Mutual TLS Certificate Rotation & Regional Failover',
          id: 'THREAD-8492',
          icon: 'neurology',
        },
        {
          title: 'SPIFFE Trust Domain Migration Policy in Istio Mesh',
          id: 'THREAD-8114',
          icon: 'tag',
        },
        {
          title: 'Envoy SDS Hot Restart & Socket Transfer Invariants',
          id: 'THREAD-7920',
          icon: 'code',
        },
      ],
    },
    {
      category: 'Corpora & Vaults',
      items: [
        { title: 'Aegis Core Vault (42,910 fragments)', id: 'CORPUS-01', icon: 'menu_book' },
        { title: 'Edge Proxy Ingress Cluster Docs', id: 'CORPUS-02', icon: 'dataset' },
        { title: 'Disaster Recovery Runbook Index', id: 'CORPUS-03', icon: 'database' },
      ],
    },
  ];

  const filteredItems = quickItems
    .map((group) => ({
      ...group,
      items: group.items.filter(
        (it) =>
          it.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
          it.id.toLowerCase().includes(searchTerm.toLowerCase())
      ),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-24 px-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl border border-[#e2e8f0] shadow-2xl max-w-xl w-full overflow-hidden flex flex-col">
        {/* Search Input */}
        <div className="px-4 py-3 border-b border-[#e2e8f0] flex items-center gap-3 bg-slate-50">
          <Icon name="search" size={20} className="text-secondary shrink-0" />
          <input
            autoFocus
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search knowledge nodes, corpora, traces..."
            className="flex-1 bg-transparent font-body-md text-body-md text-on-surface placeholder:text-outline focus:outline-none"
          />
          <kbd className="px-1.5 py-0.5 rounded bg-slate-200 text-secondary font-code-sm text-code-sm">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto p-2 divide-y divide-[#e2e8f0]/40">
          {filteredItems.map((group, idx) => (
            <div key={idx} className="py-1">
              <div className="font-label-sm text-label-sm font-semibold text-secondary uppercase tracking-wider px-3 py-1">
                {group.category}
              </div>
              {group.items.map((it) => (
                <button
                  key={it.id}
                  onClick={() => {
                    onSelectTopic(it.title);
                    onClose();
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-slate-50 transition-colors flex items-center justify-between group cursor-pointer"
                >
                  <div className="flex items-center gap-2.5">
                    <Icon
                      name={it.icon}
                      size={18}
                      className="text-secondary group-hover:text-primary transition-colors"
                    />
                    <span className="font-label-md text-label-md text-on-surface">
                      {it.title}
                    </span>
                  </div>
                  <span className="font-code-sm text-code-sm text-outline">
                    {it.id}
                  </span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
