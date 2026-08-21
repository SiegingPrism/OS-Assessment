import React from 'react';
import {
  Sliders,
  Timer,
  ArrowUpDown,
  CheckCircle2,
  Info,
  Flame,
  Zap,
  ShieldAlert,
} from 'lucide-react';
import { AlgorithmType, SchedulerConfig } from '../types';
import {
  getAlgorithmDescription,
  getAlgorithmTitle,
  isAlgorithmPreemptive,
} from '../utils/scheduler';

interface AlgorithmSettingsProps {
  selectedAlgorithm: AlgorithmType;
  onSelectAlgorithm: (algo: AlgorithmType) => void;
  config: SchedulerConfig;
  onChangeConfig: React.Dispatch<React.SetStateAction<SchedulerConfig>>;
}

const ALGORITHMS: {
  id: AlgorithmType;
  short: string;
  name: string;
  category: 'Non-Preemptive' | 'Preemptive';
}[] = [
  {
    id: 'FCFS',
    short: 'FCFS',
    name: 'First-Come, First-Served',
    category: 'Non-Preemptive',
  },
  {
    id: 'SJF_NP',
    short: 'SJF (NP)',
    name: 'Shortest Job First',
    category: 'Non-Preemptive',
  },
  {
    id: 'SRTF',
    short: 'SRTF (Preemptive SJF)',
    name: 'Shortest Remaining Time',
    category: 'Preemptive',
  },
  {
    id: 'RR',
    short: 'Round Robin',
    name: 'Round Robin',
    category: 'Preemptive',
  },
  {
    id: 'PRIORITY_NP',
    short: 'Priority (NP)',
    name: 'Priority (Non-Preemptive)',
    category: 'Non-Preemptive',
  },
  {
    id: 'PRIORITY_P',
    short: 'Priority (P)',
    name: 'Priority (Preemptive)',
    category: 'Preemptive',
  },
];

export const AlgorithmSettings: React.FC<AlgorithmSettingsProps> = ({
  selectedAlgorithm,
  onSelectAlgorithm,
  config,
  onChangeConfig,
}) => {
  const currentTitle = getAlgorithmTitle(selectedAlgorithm);
  const currentDesc = getAlgorithmDescription(selectedAlgorithm);
  const isPreemptive = isAlgorithmPreemptive(selectedAlgorithm);

  const isSJF = selectedAlgorithm === 'SJF_NP' || selectedAlgorithm === 'SRTF';
  const isPriority = selectedAlgorithm === 'PRIORITY_NP' || selectedAlgorithm === 'PRIORITY_P';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col h-full">
      {/* Header bar */}
      <div className="px-5 py-3.5 bg-slate-50/80 border-b border-slate-200 flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <Sliders className="w-4 h-4 text-blue-600" />
          <h2 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
            Algorithm Dispatcher
          </h2>
        </div>
        <span
          className={`text-[10px] font-semibold px-2.5 py-0.5 rounded-full border ${
            isPreemptive
              ? 'border-blue-200 bg-blue-50 text-blue-700'
              : 'border-emerald-200 bg-emerald-50 text-emerald-700'
          }`}
        >
          {isPreemptive ? '⚡ Preemptive' : '🛡️ Non-Preemptive'}
        </span>
      </div>

      <div className="p-4 sm:p-5 space-y-4 flex-1 overflow-y-auto">
        {/* Algorithm Grid Selector */}
        <div>
          <label className="text-[11px] font-bold uppercase text-slate-500 tracking-wider block mb-2">
            Select Scheduling Policy
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {ALGORITHMS.map((algo) => {
              const isSelected = selectedAlgorithm === algo.id;
              return (
                <button
                  key={algo.id}
                  id={`algo-btn-${algo.id}`}
                  onClick={() => onSelectAlgorithm(algo.id)}
                  className={`px-3 py-2.5 text-left rounded-xl border transition-all relative ${
                    isSelected
                      ? 'bg-blue-50 border-blue-500 text-blue-900 shadow-xs ring-1 ring-blue-500'
                      : 'bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-slate-50 shadow-2xs'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className={`text-xs font-bold font-mono tracking-tight ${isSelected ? 'text-blue-700' : 'text-slate-800'}`}>
                      {algo.short}
                    </span>
                    {isSelected && (
                      <CheckCircle2 className="w-4 h-4 text-blue-600" />
                    )}
                  </div>
                  <span className="text-[11px] text-slate-500 block truncate mt-0.5">
                    {algo.category}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Selected Algorithm Description Card */}
        <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-start gap-3">
          <Info className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
          <div className="text-xs">
            <h4 className="font-bold text-slate-900">{currentTitle}</h4>
            <p className="text-slate-600 mt-0.5 leading-relaxed text-[11px]">
              {currentDesc}
            </p>
          </div>
        </div>

        {/* Contextual Policy Configurations */}
        <div className="space-y-3 pt-2 border-t border-slate-200">
          {/* SJF Preemption Mode Selector */}
          {isSJF && (
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-blue-900 flex items-center gap-1.5">
                  <Zap className="w-4 h-4 text-blue-600" />
                  SJF Execution Mode
                </span>
                <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-md bg-white text-blue-700 border border-blue-200 shadow-2xs">
                  {selectedAlgorithm === 'SRTF' ? 'Preemptive (SRTF)' : 'Non-Preemptive (SJF)'}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  id="btn-sjf-non-preemptive"
                  onClick={() => {
                    onSelectAlgorithm('SJF_NP');
                    onChangeConfig((prev) => ({ ...prev, sjfPreemptive: false }));
                  }}
                  className={`p-2.5 rounded-lg text-left border text-xs transition ${
                    selectedAlgorithm === 'SJF_NP'
                      ? 'bg-white border-blue-500 text-blue-900 font-bold shadow-xs ring-1 ring-blue-500'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <div className="font-bold text-blue-800">Non-Preemptive SJF</div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Runs started jobs to finish</div>
                </button>
                <button
                  id="btn-sjf-preemptive"
                  onClick={() => {
                    onSelectAlgorithm('SRTF');
                    onChangeConfig((prev) => ({ ...prev, sjfPreemptive: true }));
                  }}
                  className={`p-2.5 rounded-lg text-left border text-xs transition ${
                    selectedAlgorithm === 'SRTF'
                      ? 'bg-white border-blue-500 text-blue-900 font-bold shadow-xs ring-1 ring-blue-500'
                      : 'bg-white/80 border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-white'
                  }`}
                >
                  <div className="font-bold text-blue-800 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-blue-600" /> Preemptive (SRTF)
                  </div>
                  <div className="text-[10px] text-slate-500 mt-0.5">Preempts if shorter job arrives</div>
                </button>
              </div>
              <p className="text-[11px] text-blue-700/90 leading-tight">
                💡 <strong>Preemptive rule:</strong> When a new job arrives with remaining time less than the current process, the CPU immediately preempts.
              </p>
            </div>
          )}

          {/* Round Robin Time Quantum Slider */}
          {selectedAlgorithm === 'RR' && (
            <div className="p-3.5 bg-blue-50/60 rounded-xl border border-blue-200 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-blue-900 flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-blue-600" /> Time Quantum (Q):
                </span>
                <span className="font-mono font-bold text-blue-700 bg-white px-2.5 py-0.5 rounded-md border border-blue-200 shadow-2xs">
                  {config.timeQuantum} ms
                </span>
              </div>
              <input
                id="slider-time-quantum"
                type="range"
                min="1"
                max="10"
                step="1"
                value={config.timeQuantum}
                onChange={(e) =>
                  onChangeConfig((prev) => ({
                    ...prev,
                    timeQuantum: parseInt(e.target.value, 10),
                  }))
                }
                className="w-full h-2 bg-slate-200 accent-blue-600 rounded-lg cursor-pointer"
              />
              <div className="flex justify-between text-[11px] text-slate-500 font-mono">
                <span>1 ms (Frequent Slices)</span>
                <span>10 ms (Approaches FCFS)</span>
              </div>
            </div>
          )}

          {/* Priority Mode Ordering & Aging Configuration */}
          {isPriority && (
            <div className="space-y-3">
              {/* Priority Convention */}
              <div className="p-3.5 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                    <ArrowUpDown className="w-3.5 h-3.5 text-purple-600" />
                    Priority Convention
                  </span>
                  <span className="text-[11px] text-slate-500 block mt-0.5">
                    {config.priorityRule === 'LOWER_IS_HIGHER'
                      ? 'Lower number = Higher Priority (1 is top priority)'
                      : 'Higher number = Higher Priority (99 is top priority)'}
                  </span>
                </div>
                <button
                  id="btn-toggle-priority-rule"
                  onClick={() =>
                    onChangeConfig((prev) => ({
                      ...prev,
                      priorityRule:
                        prev.priorityRule === 'LOWER_IS_HIGHER'
                          ? 'HIGHER_IS_HIGHER'
                          : 'LOWER_IS_HIGHER',
                    }))
                  }
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white hover:bg-slate-100 text-purple-700 border border-purple-200 shadow-2xs transition"
                >
                  {config.priorityRule === 'LOWER_IS_HIGHER'
                    ? '1 = Highest'
                    : '99 = Highest'}
                </button>
              </div>

              {/* Starvation Prevention: Aging Feature */}
              <div className="p-3.5 bg-purple-50/50 rounded-xl border border-purple-200 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <div>
                      <span className="text-xs font-bold text-purple-900 block">
                        Starvation Prevention (Aging)
                      </span>
                      <span className="text-[11px] text-slate-500">
                        Boosts priority of long-waiting jobs in Ready Queue
                      </span>
                    </div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      id="toggle-aging"
                      type="checkbox"
                      checked={config.enableAging}
                      onChange={(e) =>
                        onChangeConfig((prev) => ({
                          ...prev,
                          enableAging: e.target.checked,
                        }))
                      }
                      className="sr-only peer"
                    />
                    <div className="w-10 h-5 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>

                {config.enableAging && (
                  <div className="space-y-3 pt-2 border-t border-purple-200">
                    {/* Aging Threshold Parameter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 text-[11px] font-medium">
                          Aging Threshold (Wait Time):
                        </span>
                        <span className="font-mono font-bold text-amber-700 bg-white px-2.5 py-0.5 rounded-md border border-amber-200 shadow-2xs">
                          {config.agingThreshold} ms
                        </span>
                      </div>
                      <input
                        id="slider-aging-threshold"
                        type="range"
                        min="1"
                        max="15"
                        step="1"
                        value={config.agingThreshold}
                        onChange={(e) =>
                          onChangeConfig((prev) => ({
                            ...prev,
                            agingThreshold: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full h-2 bg-slate-200 accent-amber-500 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>1 ms (Fast Aging)</span>
                        <span>15 ms (Gentle Aging)</span>
                      </div>
                    </div>

                    {/* Aging Factor Parameter */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-slate-700 text-[11px] font-medium">
                          Aging Factor (Priority Step Boost):
                        </span>
                        <span className="font-mono font-bold text-purple-700 bg-white px-2.5 py-0.5 rounded-md border border-purple-200 shadow-2xs">
                          +{config.agingFactor} priority / interval
                        </span>
                      </div>
                      <input
                        id="slider-aging-factor"
                        type="range"
                        min="1"
                        max="5"
                        step="1"
                        value={config.agingFactor}
                        onChange={(e) =>
                          onChangeConfig((prev) => ({
                            ...prev,
                            agingFactor: parseInt(e.target.value, 10),
                          }))
                        }
                        className="w-full h-2 bg-slate-200 accent-purple-600 rounded-lg cursor-pointer"
                      />
                      <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                        <span>+1 Unit</span>
                        <span>+5 Units (Aggressive)</span>
                      </div>
                    </div>

                    <div className="p-2.5 bg-white rounded-lg border border-purple-200 text-[11px] text-slate-600 leading-normal flex items-start gap-2 shadow-2xs">
                      <ShieldAlert className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                      <span>
                        Every <strong>{config.agingThreshold}ms</strong> a process waits in ready queue, its effective priority increases by <strong>{config.agingFactor}</strong>.
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

