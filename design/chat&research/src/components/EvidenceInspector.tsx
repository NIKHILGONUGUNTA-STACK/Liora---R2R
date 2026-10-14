import React from 'react';
import { EvidenceSource } from '../types';
import { Icon } from './Icon';

interface EvidenceInspectorProps {
  sources: EvidenceSource[];
  highlightedSourceId: string | null;
  onInspect: (source: EvidenceSource) => void;
  isOpen: boolean;
  onClose: () => void;
  onOpen: () => void;
}

export const EvidenceInspector: React.FC<EvidenceInspectorProps> = ({
  sources,
  highlightedSourceId,
  onInspect,
  isOpen,
  onClose,
  onOpen,
}) => {
  return (
    <>
      {/* Floating Right Edge Trigger when closed - shows text on hover */}
      {!isOpen && (
        <div className="fixed right-0 top-1/3 z-30 group">
          <button
            onClick={onOpen}
            className="bg-white border-y border-l border-[#e2e8f0] shadow-md hover:bg-slate-50 py-3 px-1.5 rounded-l-xl flex flex-col items-center gap-2 cursor-pointer transition-all hover:pr-2.5"
            aria-label="Open Evidence Inspector"
          >
            <Icon name="fact_check" size={16} className="text-primary" />
            <span className="font-code-sm text-[10px] bg-primary text-white w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {sources.length}
            </span>
            <span className="[writing-mode:vertical-rl] rotate-180 font-label-md text-[11px] text-secondary tracking-wider uppercase font-semibold">
              Evidence
            </span>
          </button>

          {/* Hover Text Tooltip requested by user */}
          <div className="absolute right-full top-1/2 -translate-y-1/2 mr-2 px-2.5 py-1.5 rounded-lg bg-[#0b1c30] text-white text-[11px] font-label-md whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none shadow-lg flex items-center gap-1.5 border border-slate-700">
            <Icon name="fact_check" size={13} className="text-primary-fixed" />
            <span>Evidence Inspector • {sources.length} Sources • Click to open</span>
          </div>
        </div>
      )}

      {/* Right Sidebar Panel when opened */}
      <aside
        className={`fixed top-12 right-0 bottom-0 w-80 md:w-92 bg-white border-l border-[#e2e8f0] z-40 shadow-xl flex flex-col transition-transform duration-300 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        {/* Header */}
        <div className="px-4 py-2.5 border-b border-[#e2e8f0] flex items-center justify-between bg-slate-50/70">
          <div className="flex items-center gap-2">
            <Icon name="fact_check" size={17} className="text-primary" />
            <h2 className="font-headline-sm text-[13.5px] font-semibold text-on-surface">
              Evidence Inspector
            </h2>
            <span className="px-1.5 py-0.2 rounded-md bg-white border border-[#e2e8f0] text-secondary font-label-sm text-[10px] font-medium">
              {sources.length} Sources
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-7 h-7 rounded-lg hover:bg-slate-200 text-secondary hover:text-on-surface flex items-center justify-center transition-colors cursor-pointer"
            title="Close Evidence Inspector"
          >
            <Icon name="close" size={16} className="text-secondary" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-3 space-y-3">
          {/* Corpus Anchor Card */}
          <div className="p-2.5 rounded-xl bg-slate-50 border border-[#e2e8f0] flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-primary-fixed flex items-center justify-center text-primary shrink-0">
                <Icon name="account_tree" size={15} className="text-primary" />
              </div>
              <div className="min-w-0">
                <p className="font-label-md text-[12px] font-semibold text-on-surface truncate">
                  Corpus Anchor
                </p>
                <p className="font-code-sm text-[10.5px] text-secondary truncate">
                  Aegis Vault v3.2
                </p>
              </div>
            </div>
            <div className="text-right shrink-0">
              <span className="font-label-sm text-[10.5px] text-[#10b981] font-semibold flex items-center justify-end gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#10b981]"></span>
                99.8% Grounded
              </span>
              <span className="font-code-sm text-[10px] text-secondary">
                No Hallucinations
              </span>
            </div>
          </div>

          {/* Sources List */}
          {sources.map((src) => {
            const isHighlighted = highlightedSourceId === src.id;

            return (
              <div
                key={src.id}
                id={src.id}
                className={`rounded-xl bg-white border p-3 transition-all duration-200 ${
                  isHighlighted
                    ? 'border-primary ring-2 ring-primary-fixed-dim bg-primary-fixed/20'
                    : 'border-[#e2e8f0] hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between mb-1.5">
                  <div className="flex items-center gap-1.5 overflow-hidden">
                    <span
                      className={`w-4 h-4 rounded font-code-sm text-[10px] font-bold flex items-center justify-center shrink-0 ${
                        src.sourceNumber === 1
                          ? 'bg-primary text-on-primary'
                          : 'bg-surface-container text-primary'
                      }`}
                    >
                      {src.sourceNumber}
                    </span>
                    <span className="font-label-md text-[12px] font-semibold text-on-surface truncate">
                      {src.title}
                    </span>
                  </div>
                  <span className="font-code-sm text-[10.5px] text-secondary shrink-0 ml-1">
                    {src.location}
                  </span>
                </div>

                <div className="p-2 rounded-lg bg-slate-50 border border-[#e2e8f0] font-body-sm text-[11.5px] text-on-surface leading-relaxed">
                  {src.excerpt.split(src.highlightedPhrase).map((part, index, array) => (
                    <React.Fragment key={index}>
                      {part}
                      {index < array.length - 1 && (
                        <mark className="bg-surface-container-highest text-primary font-semibold px-1 rounded">
                          {src.highlightedPhrase}
                        </mark>
                      )}
                    </React.Fragment>
                  ))}
                </div>

                <div className="mt-2 flex items-center justify-between pt-1.5 border-t border-[#e2e8f0]">
                  <div className="flex items-center gap-1 font-code-sm text-[10.5px] text-secondary">
                    <Icon name="radar" size={13} className="text-[#10b981]" />
                    <span>
                      Sim: <strong className="text-on-surface">{src.similarity.toFixed(3)}</strong>
                    </span>
                  </div>
                  <button
                    onClick={() => onInspect(src)}
                    className="inline-flex items-center gap-1 text-primary hover:text-primary-container font-label-md text-[11.5px] font-semibold transition-colors cursor-pointer"
                    type="button"
                  >
                    <span>Inspect</span>
                    <Icon name="open_in_new" size={12} className="text-primary" />
                  </button>
                </div>
              </div>
            );
          })}

          {/* Embedding Space Dispersion */}
          <div className="rounded-xl bg-white border border-[#e2e8f0] p-2.5">
            <div className="flex items-center justify-between mb-1.5">
              <span className="font-label-md text-[11.5px] font-semibold text-on-surface">
                Embedding Space Dispersion
              </span>
              <span className="font-code-sm text-[10px] text-secondary">
                k=32 / cos-dist
              </span>
            </div>

            <div className="w-full bg-surface-container h-1.5 rounded-full overflow-hidden flex">
              <div className="bg-primary h-full" style={{ width: '74%' }}></div>
              <div className="bg-primary-fixed-dim h-full" style={{ width: '18%' }}></div>
              <div className="bg-surface-variant h-full" style={{ width: '8%' }}></div>
            </div>

            <div className="flex justify-between items-center text-secondary font-code-sm text-[10px] mt-1.5">
              <span>High Fidelity (&gt;0.90)</span>
              <span className="font-semibold text-on-surface">92% of sample</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
