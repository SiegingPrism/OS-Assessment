import React from 'react';
import {
  Cpu,
  Layers,
  Sparkles,
  BookOpen,
  Plus,
  Shuffle,
  RotateCcw,
  BarChart3,
  PlaySquare,
  Activity,
  Terminal,
} from 'lucide-react';
import { PresetScenario } from '../types';
import { PRESET_SCENARIOS } from '../data/presets';

interface HeaderProps {
  activeTab: 'simulator' | 'comparison';
  setActiveTab: (tab: 'simulator' | 'comparison') => void;
  selectedPreset: string;
  onSelectPreset: (preset: PresetScenario) => void;
  onAddProcess: () => void;
  onRandomize: () => void;
  onReset: () => void;
  onOpenFormulas: () => void;
  onExport: () => void;
  onImport: () => void;
  cpuUtilization?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  selectedPreset,
  onSelectPreset,
  onAddProcess,
  onRandomize,
  onReset,
  onOpenFormulas,
  onExport,
  onImport,
  cpuUtilization = 85.5,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 text-slate-800 sticky top-0 z-30 shadow-xs relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex flex-col md:flex-row md:items-center md:justify-between gap-3">
        {/* Top-left attribution */}
        <div className="absolute left-4 top-3 text-[12px] text-slate-500">
          made by Ishan Bassin and Harsh Thakre
        </div>
        {/* Brand & Title */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-md shadow-blue-500/20 text-white">
            <Cpu className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 flex items-center gap-2">
                CPU Scheduler Visualizer
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                  Interactive Lab
                </span>
              </h1>
            </div>
            <p className="text-[12px] text-slate-500">
              Interactive process scheduling simulation, timeline Gantt charts & benchmark analytics
            </p>
          </div>
        </div>

        {/* Center: View Switcher Tabs & Tools */}
        <div className="flex flex-wrap items-center gap-2.5">
          {/* Main View Tabs */}
          <div className="bg-slate-100 p-1 rounded-xl border border-slate-200 flex items-center shadow-inner">
            <button
              id="view-simulator-btn"
              onClick={() => setActiveTab('simulator')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'simulator'
                  ? 'bg-white text-blue-700 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <PlaySquare className="w-3.5 h-3.5 text-blue-600" />
              Live Simulator
            </button>
            <button
              id="view-comparison-btn"
              onClick={() => setActiveTab('comparison')}
              className={`flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'comparison'
                  ? 'bg-white text-indigo-700 shadow-sm font-bold border border-slate-200/60'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <BarChart3 className="w-3.5 h-3.5 text-indigo-600" />
              Compare All
            </button>
          </div>

          {/* Preset Scenario Selector */}
          <div className="relative">
            <select
              id="preset-selector"
              value={selectedPreset}
              onChange={(e) => {
                const preset = PRESET_SCENARIOS.find((p) => p.id === e.target.value);
                if (preset) onSelectPreset(preset);
              }}
              className="bg-white border border-slate-300 text-xs font-medium rounded-lg px-3 py-2 text-slate-700 hover:border-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 cursor-pointer max-w-[190px] truncate shadow-xs transition-colors"
              title="Load Scenario Preset"
            >
              <option value="" disabled>Load Preset Scenario...</option>
              {PRESET_SCENARIOS.map((p) => (
                <option key={p.id} value={p.id} className="bg-white text-slate-800">
                  {p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Quick Action Tools */}
          <div className="flex items-center gap-1.5 border-l border-slate-200 pl-2">
            <button
              id="btn-randomize-scenario"
              onClick={onRandomize}
              className="p-2 bg-white hover:bg-slate-50 text-slate-700 hover:text-blue-600 rounded-lg border border-slate-300 hover:border-blue-400 transition shadow-xs"
              title="Generate Random Workload"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              id="btn-add-process-top"
              onClick={onAddProcess}
              className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-1.5 text-xs font-semibold shadow-sm hover:shadow"
              title="Add New Process"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Add Process</span>
            </button>
            <button
              id="btn-open-theory"
              onClick={onOpenFormulas}
              className="px-3 py-2 bg-amber-50 hover:bg-amber-100/80 text-amber-800 rounded-lg border border-amber-300/80 transition flex items-center gap-1.5 text-xs font-semibold shadow-xs"
              title="Formulas & Theory"
            >
              <BookOpen className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Formulas</span>
            </button>
          </div>

          {/* Real-Time CPU Load Monitor Telemetry */}
          <div className="hidden xl:flex items-center space-x-2.5 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-lg shadow-2xs">
            <div className="flex flex-col items-end">
              <span className="text-[9px] uppercase text-slate-500 font-bold tracking-wider">CPU Util</span>
              <span className="text-xs font-mono font-bold text-blue-700">{cpuUtilization}%</span>
            </div>
            <div className="w-14 h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, cpuUtilization)}%` }}
              />
            </div>
          </div>
        </div>
      </div>
    </header>
  );
};
